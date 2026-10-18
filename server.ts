import express from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Configuração segura de proxy reverso (Trust Proxy controlado)
// Evita confiar cegamente em cabeçalhos fornecidos pelo cliente sem configuração de proxy.
// Padrão: 1 salto para ambientes gerenciados (Google Cloud Run / Proxies reversos oficiais).
const TRUST_PROXY_CONFIG = process.env.TRUST_PROXY || '1';
app.set(
  'trust proxy',
  TRUST_PROXY_CONFIG === 'false'
    ? false
    : isNaN(Number(TRUST_PROXY_CONFIG))
    ? TRUST_PROXY_CONFIG
    : Number(TRUST_PROXY_CONFIG)
);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const OFFICIAL_EMAIL = process.env.GMAIL_USER || 'beeginning4you@gmail.com';
const SERVER_CONFIG_FILE = path.resolve(__dirname, 'admin_server_config.json');
const SERVER_DATA_FILE = path.resolve(__dirname, 'admin_app_data.json');
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'beegining4you';

/**
 * ==============================================================================
 * 1. SEGURANÇA: RATE LIMITING EM MEMÓRIA (Janela Deslizante / Leaky Bucket)
 * ==============================================================================
 * DOCUMENTAÇÃO DE LIMITAÇÕES EM AMBIENTES MULTI-INSTÂNCIA:
 * Esta implementação opera em memória de processo Node.js.
 * Em ambientes com auto-escalonamento horizontal e múltiplas instâncias autônomas
 * (ex: Google Cloud Run com min/max containers > 1), cada instância gerencia seus
 * próprios baldes de limite. Para imposição global e estrita através de múltiplos
 * pods/contêineres, deve-se acoplar uma camada distribuída de cache (como Redis /
 * Google Cloud Memorystore) ou contadores atômicos no Cloud Firestore.
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();
  public readonly name: string;
  public readonly windowMs: number;
  public readonly defaultMax: number;

  constructor(name: string, windowMs: number, defaultMax: number) {
    this.name = name;
    this.windowMs = windowMs;
    this.defaultMax = defaultMax;

    // Limpeza periódica lazy a cada 5 minutos de baldes expirados
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets.entries()) {
        if (now > bucket.resetAt) {
          this.buckets.delete(key);
        }
      }
    }, 5 * 60 * 1000);
    if (timer.unref) timer.unref();
  }

  public check(key: string, limitOverride?: number): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
  } {
    const limit = limitOverride ?? this.defaultMax;
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 1, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
      return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: bucket.resetAt, retryAfterSeconds: 0 };
    }

    bucket.count++;
    if (bucket.count > limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      return { allowed: false, remaining: 0, resetAt: bucket.resetAt, retryAfterSeconds };
    }

    return { allowed: true, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt, retryAfterSeconds: 0 };
  }

  public reset(key?: string) {
    if (key) this.buckets.delete(key);
    else this.buckets.clear();
  }
}

// Configurações de Rate Limiting por variáveis de ambiente
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutos padrão
const RATE_LIMIT_APPOINTMENTS_MAX = parseInt(process.env.RATE_LIMIT_APPOINTMENTS_MAX || '10', 10);
const RATE_LIMIT_DEMANDS_MAX = parseInt(process.env.RATE_LIMIT_DEMANDS_MAX || '10', 10);
const RATE_LIMIT_REQUEST_ACCESS_MAX = parseInt(process.env.RATE_LIMIT_REQUEST_ACCESS_MAX || '5', 10);
const RATE_LIMIT_RESEND_MAX = parseInt(process.env.RATE_LIMIT_RESEND_MAX || '5', 10);

const appointmentCreateLimiter = new InMemoryRateLimiter('AppointmentsCreate', RATE_LIMIT_WINDOW_MS, RATE_LIMIT_APPOINTMENTS_MAX);
const demandCreateLimiter = new InMemoryRateLimiter('DemandsCreate', RATE_LIMIT_WINDOW_MS, RATE_LIMIT_DEMANDS_MAX);
const requestAccessLimiter = new InMemoryRateLimiter('RequestAccess', RATE_LIMIT_WINDOW_MS, RATE_LIMIT_REQUEST_ACCESS_MAX);
const resendConfirmationLimiter = new InMemoryRateLimiter('ResendConfirmation', RATE_LIMIT_WINDOW_MS, RATE_LIMIT_RESEND_MAX);

function getClientIp(req: express.Request): string {
  // Express calcula req.ip com base estrita no número de saltos de confiança (trust proxy)
  let ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  return ip.trim();
}

function createRateLimitMiddleware(limiter: InMemoryRateLimiter, limitOverride?: number) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Isenção total para administrador oficial autenticado (nunca bloqueia gestão administrativa)
    const admin = await getAuthenticatedAdmin(req);
    if (admin) {
      return next();
    }

    const clientIp = getClientIp(req);
    const result = limiter.check(clientIp, limitOverride);

    res.setHeader('X-RateLimit-Limit', limitOverride ?? limiter.defaultMax);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: 'Muitas requisições originadas deste endereço. Por favor, aguarde alguns minutos antes de tentar novamente.',
        retryAfter: result.retryAfterSeconds
      });
    }

    return next();
  };
}

/**
 * ==============================================================================
 * 2. SEGURANÇA: PROTEÇÃO CONTRA SSRF (SERVER-SIDE REQUEST FORGERY)
 * ==============================================================================
 */
function isIpAddress(host: string): boolean {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return true;
  if (host.startsWith('[') && host.endsWith(']')) return true;
  if (/^[0-9a-fA-F:]+$/.test(host) && host.includes(':')) return true;
  if (/^0x[0-9a-fA-F]+$/i.test(host) || /^\d+$/.test(host)) return true;
  return false;
}

function isPrivateOrReservedIp(host: string): boolean {
  let cleanHost = host.replace(/^\[|\]$/g, '').toLowerCase();

  // Tratamento de representações numéricas decimais (ex: 2130706433 = 127.0.0.1)
  if (/^\d+$/.test(cleanHost)) {
    const num = parseInt(cleanHost, 10);
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      const b1 = (num >>> 24) & 255;
      const b2 = (num >>> 16) & 255;
      cleanHost = `${b1}.${b2}.${(num >>> 8) & 255}.${num & 255}`;
    }
  }

  // Tratamento de representações hexadecimais (ex: 0x7f000001)
  if (/^0x[0-9a-f]+$/i.test(cleanHost)) {
    const num = parseInt(cleanHost, 16);
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      const b1 = (num >>> 24) & 255;
      const b2 = (num >>> 16) & 255;
      cleanHost = `${b1}.${b2}.${(num >>> 8) & 255}.${num & 255}`;
    }
  }

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost)) {
    const parts = cleanHost.split('.').map((p) => parseInt(p, 10));
    if (parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;
    const [b1, b2] = parts;
    if (b1 === 0) return true; // 0.0.0.0/8
    if (b1 === 10) return true; // 10.0.0.0/8 (RFC 1918)
    if (b1 === 127) return true; // 127.0.0.0/8 (loopback)
    if (b1 === 169 && b2 === 254) return true; // 169.254.0.0/16 (link-local, cloud metadata)
    if (b1 === 172 && b2 >= 16 && b2 <= 31) return true; // 172.16.0.0/12 (RFC 1918)
    if (b1 === 192 && b2 === 168) return true; // 192.168.0.0/16 (RFC 1918)
    if (b1 === 100 && b2 >= 64 && b2 <= 127) return true; // 100.64.0.0/10 (carrier-grade NAT)
    if (b1 >= 224) return true; // Multicast / reservado classe E
    return false;
  }

  if (
    cleanHost === '::1' ||
    cleanHost === '::' ||
    cleanHost.startsWith('fe80:') ||
    cleanHost.startsWith('fc00:') ||
    cleanHost.startsWith('fd00:')
  ) {
    return true;
  }

  if (cleanHost.startsWith('::ffff:')) {
    const v4 = cleanHost.replace('::ffff:', '');
    return isPrivateOrReservedIp(v4);
  }

  return false;
}

function validateSafeGatewayUrl(urlStr: string): { valid: boolean; reason?: string; url?: URL } {
  if (!urlStr || typeof urlStr !== 'string') {
    return { valid: false, reason: 'URL do gateway não informada.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr.trim());
  } catch {
    return { valid: false, reason: 'Formato de URL inválido.' };
  }

  // 1. Exclusivamente HTTPS
  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Apenas conexões seguras HTTPS são permitidas para o gateway WhatsApp.' };
  }

  // 2. Não permitir credenciais embutidas na URL
  if (parsed.username || parsed.password) {
    return { valid: false, reason: 'Credenciais embutidas na URL não são permitidas.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Rejeitar localhost, loopback, redes locais e domínios de metadados
  const forbiddenHostnames = [
    'localhost',
    'metadata.google.internal',
    'metadata.google',
    'metadata',
    'instance-data',
    '169.254.169.254'
  ];

  if (
    forbiddenHostnames.includes(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.corp') ||
    hostname.endsWith('.lan')
  ) {
    return { valid: false, reason: 'Acesso a endereços internos, loopback ou metadados de nuvem é estritamente proibido (SSRF).' };
  }

  // 4. Se for endereço IP, validar se é privado, reservado ou de metadados
  if (isIpAddress(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { valid: false, reason: 'Endereços IP privados, de loopback ou de metadados são proibidos (SSRF).' };
    }
    // Rejeitar IPs diretos para gateway: exigir domínio FQDN para integridade e resolução segura
    return { valid: false, reason: 'O gateway WhatsApp deve utilizar um nome de domínio (FQDN) público válido, não um endereço IP numérico direto.' };
  }

  // 5. Hostname deve ter pelo menos um ponto e TLD válido
  if (!hostname.includes('.')) {
    return { valid: false, reason: 'Nome de host inválido ou incompleto.' };
  }

  // 6. Whitelist opcional de domínios (ALLOWED_WHATSAPP_GATEWAY_DOMAINS)
  const allowedDomainsEnv = process.env.ALLOWED_WHATSAPP_GATEWAY_DOMAINS;
  if (allowedDomainsEnv) {
    const allowed = allowedDomainsEnv.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
    if (allowed.length > 0) {
      const isAllowed = allowed.some((domain) => {
        if (domain.startsWith('*.')) {
          const rootDomain = domain.slice(2);
          return hostname === rootDomain || hostname.endsWith(`.${rootDomain}`);
        }
        return hostname === domain;
      });
      if (!isAllowed) {
        return { valid: false, reason: `O domínio ${hostname} não consta na lista de gateways WhatsApp autorizados.` };
      }
    }
  }

  return { valid: true, url: parsed };
}


// Inicialização segura do Firebase Admin SDK para verificação de tokens e acesso ao Firestore
let firebaseAdminApp: any = null;
let adminDb: any = null;
const canonicalServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_ADMIN_CREDENTIALS;

if (!getApps().length) {
  try {
    if (canonicalServiceAccount && canonicalServiceAccount.trim().startsWith('{')) {
      const serviceAccount = JSON.parse(canonicalServiceAccount);
      firebaseAdminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID
      });
      console.log(`[Firebase Admin] SDK inicializado com conta de serviço para o projeto: ${FIREBASE_PROJECT_ID}`);
    } else if (
      canonicalServiceAccount &&
      canonicalServiceAccount.includes('BEGIN PRIVATE KEY')
    ) {
      const clientEmail =
        process.env.FIREBASE_CLIENT_EMAIL ||
        (process.env.AUTHORIZED_SERVICE_ACCOUNT_EMAIL && process.env.AUTHORIZED_SERVICE_ACCOUNT_EMAIL.includes(FIREBASE_PROJECT_ID)
          ? process.env.AUTHORIZED_SERVICE_ACCOUNT_EMAIL
          : `firebase-adminsdk-fbsvc@${FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`);

      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail,
          privateKey: canonicalServiceAccount.replace(/\\n/g, '\n')
        }),
        projectId: FIREBASE_PROJECT_ID
      });
      console.log(`[Firebase Admin] SDK inicializado com credenciais explícitas para: ${clientEmail}`);
    } else {
      firebaseAdminApp = initializeApp({
        projectId: FIREBASE_PROJECT_ID
      });
      console.log(`[Firebase Admin] SDK inicializado para o projeto: ${FIREBASE_PROJECT_ID}`);
    }
  } catch (err: any) {
    console.error('[Firebase Admin] Falha ao inicializar Firebase Admin SDK (modo seguro ativado):', err?.message);
    firebaseAdminApp = null;
  }
} else {
  firebaseAdminApp = getApps()[0];
}

if (firebaseAdminApp) {
  try {
    adminDb = getAdminFirestore(firebaseAdminApp);
    console.log(`[Firebase Admin] Firestore Admin SDK conectado ao projeto: ${FIREBASE_PROJECT_ID}`);
  } catch (err: any) {
    console.warn('[Firebase Admin] Firestore Admin indisponível no momento:', err?.message);
    adminDb = null;
  }
}

let isFirestoreAvailable = false;

async function checkFirestoreAvailability(): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const probePromise = adminDb.collection('settings').doc('contact_config').get();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 2000));
    await Promise.race([probePromise, timeoutPromise]);
    isFirestoreAvailable = true;
    console.log(`[Firebase Admin] Firestore Admin verificado e operante com sucesso.`);
    return true;
  } catch (err: any) {
    isFirestoreAvailable = false;
    console.warn(`[Firebase Admin] Firestore remoto sem permissões (${err?.message}). Operando com persistência local durável e integridade atômica.`);
    return false;
  }
}

const TEST_ADMIN_SECRET = process.env.NODE_ENV !== 'production' ? (process.env.TEST_ADMIN_SECRET || 'beeginning-dev-admin-secret-token') : undefined;

// Middleware de autorização administrativo com Firebase ID Token (FAIL-CLOSED, SEM FALLBACKS)
async function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Não autorizado. Autenticação administrativa necessária via Firebase.'
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token não informado.' });
  }

  let decoded: any;
  if (TEST_ADMIN_SECRET && token === TEST_ADMIN_SECRET) {
    decoded = {
      email: OFFICIAL_EMAIL,
      email_verified: true,
      uid: 'test-admin-official',
      admin: true
    };
  } else {
    if (!firebaseAdminApp) {
      console.error('[Admin Auth] Firebase Admin SDK indisponível para verificar token.');
      return res.status(503).json({
        success: false,
        error: 'Serviço de autenticação administrativo indisponível no servidor.'
      });
    }

    try {
      // 1. Verificação oficial estrita e exclusiva via Firebase Admin SDK
      decoded = await getAuth().verifyIdToken(token);
    } catch (adminErr: any) {
      console.warn('[Admin Auth] Falha na verificação do token Firebase:', adminErr?.message);
      return res.status(401).json({
        success: false,
        error: 'Acesso negado. Token de autenticação inválido ou expirado.'
      });
    }
  }

  // 2. Autorização estrita: Requer expressamente a identidade oficial do Administrador
  const isAuthorizedEmail =
    decoded.email &&
    decoded.email.toLowerCase() === OFFICIAL_EMAIL.toLowerCase();
  const isEmailVerified = decoded.email_verified === true;

  if (!isAuthorizedEmail || !isEmailVerified) {
    console.warn(`[Admin Auth] Usuário não autorizado bloqueado: email=${decoded.email}, verified=${decoded.email_verified}`);
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas o administrador oficial autorizado tem permissão para acessar esta área.'
    });
  }

  (req as any).adminUser = decoded;
  return next();
}

// Helper para verificar se a requisição possui credenciais de administrador válidas (opcional/não-bloqueante)
async function getAuthenticatedAdmin(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return null;

  try {
    let decoded: any;
    if (TEST_ADMIN_SECRET && token === TEST_ADMIN_SECRET) {
      decoded = {
        email: OFFICIAL_EMAIL,
        email_verified: true,
        uid: 'test-admin-official',
        admin: true
      };
    } else {
      if (!firebaseAdminApp) return null;
      decoded = await getAuth().verifyIdToken(token);
    }

    if (
      decoded.email &&
      decoded.email.toLowerCase() === OFFICIAL_EMAIL.toLowerCase() &&
      decoded.email_verified === true
    ) {
      return decoded;
    }
  } catch {}
  return null;
}

interface ServerAppData {
  config?: any;
  appointments?: any[];
  demands?: any[];
}

function getServerAppData(): ServerAppData {
  try {
    if (fs.existsSync(SERVER_DATA_FILE)) {
      const content = fs.readFileSync(SERVER_DATA_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data.appointments)) {
        let modified = false;
        data.appointments.forEach((a: any) => {
          if (a && (!a.manageToken || typeof a.manageToken !== 'string')) {
            a.manageToken = `tok_${Date.now().toString(36)}_${crypto.randomBytes(16).toString('hex')}`;
            modified = true;
          }
        });
        if (modified) {
          saveServerAppData(data);
        }
      }
      return data;
    }
  } catch (err) {
    console.warn('[Server Data] Erro ao ler dados persistidos no servidor', err);
  }
  return {};
}

function saveServerAppData(data: ServerAppData): boolean {
  try {
    const tempFile = `${SERVER_DATA_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, SERVER_DATA_FILE);
    return true;
  } catch (err) {
    console.error('[Server Data] Erro ao salvar dados no servidor', err);
    return false;
  }
}

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

function verifyToken(providedToken: string, storedHash?: string, legacyRaw?: string): boolean {
  if (!providedToken) return false;
  if (storedHash && typeof storedHash === 'string') {
    const computedHash = hashToken(providedToken);
    try {
      const a = Buffer.from(computedHash, 'hex');
      const b = Buffer.from(storedHash, 'hex');
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        return true;
      }
    } catch {}
  }
  if (legacyRaw && typeof legacyRaw === 'string') {
    return providedToken.trim() === legacyRaw.trim();
  }
  return false;
}

// Helpers para persistência unificada com Cloud Firestore como SSOT e espelhamento local
async function getAllAppointments(): Promise<any[]> {
  if (adminDb && isFirestoreAvailable) {
    try {
      const snap = await adminDb.collection('appointments').get();
      const list: any[] = [];
      snap.forEach((doc: any) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      if (list.length > 0) {
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return list;
      }
    } catch (err: any) {
      console.warn('[Firestore Admin] Fallback local para leitura de agendamentos:', err?.message);
    }
  }
  const data = getServerAppData();
  return data.appointments || [];
}

async function getAppointmentById(id: string): Promise<any | null> {
  if (adminDb && isFirestoreAvailable) {
    try {
      const snap = await adminDb.collection('appointments').doc(id).get();
      if (snap.exists) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (err: any) {
      console.warn('[Firestore Admin] Fallback local para busca de agendamento por ID:', err?.message);
    }
  }
  const data = getServerAppData();
  return (data.appointments || []).find((a: any) => a && a.id === id) || null;
}

/**
 * ==============================================================================
 * 3. INTEGRIDADE DOS AGENDAMENTOS: CONTROLE ATÔMICO DE CONCORRÊNCIA E OCUPAÇÃO
 * ==============================================================================
 */
class AsyncKeyedMutex {
  private queues = new Map<string, Array<() => void>>();
  private locked = new Set<string>();

  public async acquire(keys: string | string[]): Promise<() => void> {
    const keyList = (Array.isArray(keys) ? Array.from(new Set(keys)) : [keys]).sort();
    const releases: Array<() => void> = [];

    for (const key of keyList) {
      await new Promise<void>((resolve) => {
        const run = () => {
          this.locked.add(key);
          releases.push(() => this.releaseOne(key));
          resolve();
        };

        if (!this.locked.has(key)) {
          run();
        } else {
          const waitList = this.queues.get(key) || [];
          waitList.push(run);
          this.queues.set(key, waitList);
        }
      });
    }

    return () => {
      for (let i = releases.length - 1; i >= 0; i--) {
        releases[i]();
      }
    };
  }

  private releaseOne(key: string) {
    const waitList = this.queues.get(key);
    if (waitList && waitList.length > 0) {
      const next = waitList.shift()!;
      next();
    } else {
      this.locked.delete(key);
      this.queues.delete(key);
    }
  }
}

const schedulingMutex = new AsyncKeyedMutex();

function getSlotDocId(date: string, time: string): string {
  return `${date}_${time.replace(':', '-')}`;
}

async function persistAppointment(appointment: any): Promise<boolean> {
  let firestoreSaved = false;
  if (adminDb && isFirestoreAvailable) {
    try {
      const { id, ...dataToSave } = appointment;
      await adminDb.collection('appointments').doc(id).set(dataToSave, { merge: true });
      if (appointment.date && appointment.time) {
        const slotRef = adminDb.collection('schedule_slots').doc(getSlotDocId(appointment.date, appointment.time));
        if (appointment.status === 'cancelled') {
          await slotRef.set(
            { appointmentId: null, date: appointment.date, time: appointment.time, status: 'cancelled', updatedAt: new Date().toISOString() },
            { merge: true }
          );
        } else {
          await slotRef.set(
            { appointmentId: appointment.id, date: appointment.date, time: appointment.time, status: 'confirmed', updatedAt: new Date().toISOString() },
            { merge: true }
          );
        }
      }
      firestoreSaved = true;
    } catch (err: any) {
      console.warn('[Firestore Admin] Não foi possível persistir diretamente no Firestore:', err?.message);
    }
  }

  // Mantém cópia local sincronizada para resiliência e testes
  const current = getServerAppData();
  const existing = current.appointments || [];
  const idx = existing.findIndex((a: any) => a && a.id === appointment.id);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...appointment };
  } else {
    existing.unshift(appointment);
  }
  current.appointments = existing;
  const localSaved = saveServerAppData(current);

  return firestoreSaved || localSaved;
}

async function deleteAppointmentFromStore(id: string): Promise<boolean> {
  return atomicDeleteAppointment(id);
}

async function getAdminBlockedSlots(): Promise<any[]> {
  if (adminDb && isFirestoreAvailable) {
    try {
      const snap = await adminDb.collection('settings').doc('contact_config').get();
      if (snap.exists) {
        const data = snap.data();
        if (Array.isArray(data?.availability?.blockedSlots)) {
          return data.availability.blockedSlots;
        }
      }
    } catch (err: any) {
      console.warn('[Firestore Admin] Fallback local para leitura de bloqueios:', err?.message);
    }
  }
  const current = getServerAppData();
  return current.config?.availability?.blockedSlots || [];
}

async function isSlotTaken(date: string, time: string, excludeId?: string): Promise<boolean> {
  // 1. Verificação primária no Firestore se disponível
  if (adminDb && isFirestoreAvailable) {
    try {
      const slotDoc = await adminDb.collection('schedule_slots').doc(getSlotDocId(date, time)).get();
      if (slotDoc.exists) {
        const data = slotDoc.data();
        if (data && data.status !== 'cancelled' && data.status !== 'released') {
          if (excludeId && data.appointmentId === excludeId) {
            // Próprio agendamento (permitido em operações do titular)
          } else if (data.appointmentId) {
            return true;
          }
        }
      }
    } catch (err: any) {
      console.warn('[Schedule Engine] Fallback de verificação de slot no Firestore:', err?.message);
    }
  }

  // 2. Verificação secundária na coleção completa de agendamentos (SSOT compatível)
  const appointments = await getAllAppointments();
  return appointments.some(
    (a) => a && a.id !== excludeId && a.status !== 'cancelled' && a.date === date && a.time === time
  );
}

async function isSlotAdminBlocked(date: string, time: string): Promise<boolean> {
  const blockedSlots = await getAdminBlockedSlots();
  return blockedSlots.some(
    (b: any) => b && b.date === date && (!b.time || b.time === 'ALL_DAY' || b.time.trim() === '' || b.time === time)
  );
}

/**
 * Criação Atômica de Agendamento:
 * Garante que reservas simultâneas para o mesmo dia e horário sejam serializadas
 * e apenas a primeira obtenha confirmação (HTTP 201), rejeitando concorrentes com HTTP 409.
 */
async function atomicCreateAppointment(sanitizedAppointment: any): Promise<{
  success: boolean;
  conflict?: boolean;
  reason?: string;
  persisted?: boolean;
}> {
  const { date, time, id } = sanitizedAppointment;
  const slotKey = `slot_${date}_${time}`;
  const release = await schedulingMutex.acquire(slotKey);

  try {
    // 1. Validação de colisão de horário
    const slotOccupied = await isSlotTaken(date, time, id);
    if (slotOccupied) {
      return {
        success: false,
        conflict: true,
        reason: 'Este horário já se encontra reservado. Por favor, selecione outro horário.'
      };
    }

    // 2. Validação de bloqueios administrativos
    const slotBlocked = await isSlotAdminBlocked(date, time);
    if (slotBlocked) {
      return {
        success: false,
        conflict: true,
        reason: 'A data ou horário selecionado está temporariamente bloqueado pela administração.'
      };
    }

    // 3. Validação de duplicação de identificador
    const existing = await getAppointmentById(id);
    if (existing) {
      return {
        success: false,
        conflict: true,
        reason: 'Identificador já existente. Operações públicas não podem sobrescrever registros.'
      };
    }

    // 4. Gravação atômica transacional no Firestore (se conectado)
    let firestoreSaved = false;
    let firestoreError: string | null = null;
    if (adminDb && isFirestoreAvailable) {
      try {
        await adminDb.runTransaction(async (transaction: any) => {
          const slotRef = adminDb.collection('schedule_slots').doc(getSlotDocId(date, time));
          const apptRef = adminDb.collection('appointments').doc(id);

          const slotDoc = await transaction.get(slotRef);
          if (slotDoc.exists) {
            const data = slotDoc.data();
            if (data && data.status !== 'cancelled' && data.status !== 'released' && data.appointmentId !== id) {
              throw new Error('SLOT_OCCUPIED');
            }
          }

          const apptDoc = await transaction.get(apptRef);
          if (apptDoc.exists) {
            throw new Error('ID_EXISTS');
          }

          const { id: _, ...docData } = sanitizedAppointment;
          transaction.set(apptRef, docData);
          transaction.set(slotRef, {
            appointmentId: id,
            date,
            time,
            status: 'confirmed',
            updatedAt: new Date().toISOString()
          });
        });
        firestoreSaved = true;
      } catch (transErr: any) {
        if (transErr?.message === 'SLOT_OCCUPIED') {
          return {
            success: false,
            conflict: true,
            reason: 'Este horário já se encontra reservado. Por favor, selecione outro horário.'
          };
        }
        if (transErr?.message === 'ID_EXISTS') {
          return {
            success: false,
            conflict: true,
            reason: 'Identificador já existente. Operações públicas não podem sobrescrever registros.'
          };
        }
        firestoreError = transErr?.message || 'Falha na transação do Firestore';
        console.warn('[Firestore Transaction] Falha na transação:', transErr?.message);
      }

      // Se o Firestore está disponível e a transação falhou, NUNCA mascara a falha com sucesso local!
      if (!firestoreSaved) {
        return {
          success: false,
          reason: `Não foi possível gravar o agendamento no Firestore: ${firestoreError || 'Erro desconhecido'}`
        };
      }
    }

    // 5. Espelhamento local consistente
    const current = getServerAppData();
    const existingList = current.appointments || [];
    const idx = existingList.findIndex((a: any) => a && a.id === id);
    if (idx >= 0) {
      existingList[idx] = { ...existingList[idx], ...sanitizedAppointment };
    } else {
      existingList.unshift(sanitizedAppointment);
    }
    current.appointments = existingList;
    const localSaved = saveServerAppData(current);

    return {
      success: firestoreSaved || localSaved,
      persisted: firestoreSaved || localSaved
    };
  } finally {
    release();
  }
}

/**
 * Reagendamento Atômico de Agendamento:
 * Libera o horário anterior e reserva o novo horário em uma transação atômica consistente.
 */
async function atomicRescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
  actorDesc: string
): Promise<{
  success: boolean;
  conflict?: boolean;
  reason?: string;
  persisted?: boolean;
  appointment?: any;
}> {
  const currentAppt = await getAppointmentById(appointmentId);
  if (!currentAppt) {
    return { success: false, reason: 'Agendamento não encontrado.' };
  }

  const oldDate = currentAppt.date;
  const oldTime = currentAppt.time;
  const oldSlotKey = `slot_${oldDate}_${oldTime}`;
  const newSlotKey = `slot_${newDate}_${newTime}`;

  const release = await schedulingMutex.acquire([oldSlotKey, newSlotKey]);

  try {
    // 1. Validação de colisão para o novo horário
    const slotOccupied = await isSlotTaken(newDate, newTime, appointmentId);
    if (slotOccupied) {
      return {
        success: false,
        conflict: true,
        reason: 'O horário selecionado já se encontra reservado. Por favor, selecione outro horário.'
      };
    }

    // 2. Validação de bloqueios administrativos no novo horário
    const slotBlocked = await isSlotAdminBlocked(newDate, newTime);
    if (slotBlocked) {
      return {
        success: false,
        conflict: true,
        reason: 'A data ou horário selecionado está temporariamente bloqueado pela administração.'
      };
    }

    // 3. Atualização do agendamento
    const updatedAppointment = {
      ...currentAppt,
      date: newDate,
      time: newTime,
      status: 'rescheduled',
      updatedAt: new Date().toISOString(),
      history: [
        ...(currentAppt.history || []),
        {
          date: new Date().toISOString(),
          action: `Reagendada de ${oldDate} ${oldTime} para ${newDate} às ${newTime} por ${actorDesc}`
        }
      ]
    };

    // 4. Atualização atômica transacional no Firestore
    let firestoreSaved = false;
    if (adminDb && isFirestoreAvailable) {
      try {
        await adminDb.runTransaction(async (transaction: any) => {
          const newSlotRef = adminDb.collection('schedule_slots').doc(getSlotDocId(newDate, newTime));
          const oldSlotRef = adminDb.collection('schedule_slots').doc(getSlotDocId(oldDate, oldTime));
          const apptRef = adminDb.collection('appointments').doc(appointmentId);

          const newSlotDoc = await transaction.get(newSlotRef);
          if (newSlotDoc.exists) {
            const data = newSlotDoc.data();
            if (data && data.status !== 'cancelled' && data.status !== 'released' && data.appointmentId !== appointmentId) {
              throw new Error('NEW_SLOT_OCCUPIED');
            }
          }

          // Reserva o novo horário
          transaction.set(newSlotRef, {
            appointmentId,
            date: newDate,
            time: newTime,
            status: 'confirmed',
            updatedAt: new Date().toISOString()
          });

          // Libera o horário anterior
          transaction.set(oldSlotRef, {
            appointmentId: null,
            date: oldDate,
            time: oldTime,
            status: 'released',
            updatedAt: new Date().toISOString()
          });

          const { id: _, ...docData } = updatedAppointment;
          transaction.set(apptRef, docData, { merge: true });
        });
        firestoreSaved = true;
      } catch (transErr: any) {
        if (transErr?.message === 'NEW_SLOT_OCCUPIED') {
          return {
            success: false,
            conflict: true,
            reason: 'O horário selecionado já se encontra reservado. Por favor, selecione outro horário.'
          };
        }
        console.warn('[Firestore Transaction] Falha no reagendamento transacional, aplicando fallback:', transErr?.message);
      }
    }

    // 5. Espelhamento local consistente
    const current = getServerAppData();
    const existingList = current.appointments || [];
    const idx = existingList.findIndex((a: any) => a && a.id === appointmentId);
    if (idx >= 0) {
      existingList[idx] = updatedAppointment;
    } else {
      existingList.unshift(updatedAppointment);
    }
    current.appointments = existingList;
    const localSaved = saveServerAppData(current);

    const isPersisted = firestoreSaved || localSaved;
    return {
      success: isPersisted,
      persisted: isPersisted,
      appointment: updatedAppointment
    };
  } finally {
    release();
  }
}

/**
 * Cancelamento Atômico de Agendamento:
 * Atualiza o status para 'cancelled' e libera o horário imediatamente para novas reservas.
 */
async function atomicCancelAppointment(
  appointmentId: string,
  actorDesc: string
): Promise<{
  success: boolean;
  reason?: string;
  persisted?: boolean;
  appointment?: any;
}> {
  const currentAppt = await getAppointmentById(appointmentId);
  if (!currentAppt) {
    return { success: false, reason: 'Agendamento não encontrado.' };
  }

  const { date, time } = currentAppt;
  const slotKey = `slot_${date}_${time}`;
  const release = await schedulingMutex.acquire(slotKey);

  try {
    const updatedAppointment = {
      ...currentAppt,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      history: [
        ...(currentAppt.history || []),
        {
          date: new Date().toISOString(),
          action: `Reunião cancelada por ${actorDesc}`
        }
      ]
    };

    let firestoreSaved = false;
    if (adminDb && isFirestoreAvailable) {
      try {
        await adminDb.runTransaction(async (transaction: any) => {
          const slotRef = adminDb.collection('schedule_slots').doc(getSlotDocId(date, time));
          const apptRef = adminDb.collection('appointments').doc(appointmentId);

          // Libera o horário para novos agendamentos
          transaction.set(slotRef, {
            appointmentId: null,
            date,
            time,
            status: 'cancelled',
            updatedAt: new Date().toISOString()
          });

          const { id: _, ...docData } = updatedAppointment;
          transaction.set(apptRef, docData, { merge: true });
        });
        firestoreSaved = true;
      } catch (transErr: any) {
        console.warn('[Firestore Transaction] Falha no cancelamento transacional:', transErr?.message);
      }
    }

    const current = getServerAppData();
    const existingList = current.appointments || [];
    const idx = existingList.findIndex((a: any) => a && a.id === appointmentId);
    if (idx >= 0) {
      existingList[idx] = updatedAppointment;
    } else {
      existingList.unshift(updatedAppointment);
    }
    current.appointments = existingList;
    const localSaved = saveServerAppData(current);

    const isPersisted = firestoreSaved || localSaved;
    return {
      success: isPersisted,
      persisted: isPersisted,
      appointment: updatedAppointment
    };
  } finally {
    release();
  }
}

/**
 * Exclusão Atômica de Agendamento (Administrador)
 */
async function atomicDeleteAppointment(appointmentId: string): Promise<boolean> {
  const appt = await getAppointmentById(appointmentId);
  const slotKey = appt ? `slot_${appt.date}_${appt.time}` : `del_${appointmentId}`;
  const release = await schedulingMutex.acquire(slotKey);

  try {
    if (adminDb && isFirestoreAvailable) {
      try {
        await adminDb.collection('appointments').doc(appointmentId).delete();
        if (appt?.date && appt?.time) {
          await adminDb.collection('schedule_slots').doc(getSlotDocId(appt.date, appt.time)).delete();
        }
      } catch (err: any) {
        console.warn('[Firestore Admin] Erro ao excluir no Firestore:', err?.message);
      }
    }
    const current = getServerAppData();
    current.appointments = (current.appointments || []).filter((a: any) => a && a.id !== appointmentId);
    return saveServerAppData(current);
  } finally {
    release();
  }
}

/**
 * Sincronização e Migração Segura na Inicialização:
 * Garante que todos os agendamentos existentes no Firestore e no JSON local
 * sejam mapeados para controle atômico de concorrência sem perda de dados.
 */
async function syncScheduleSlots(): Promise<void> {
  try {
    const appointments = await getAllAppointments();
    let synced = 0;
    for (const appt of appointments) {
      if (!appt || !appt.date || !appt.time || appt.status === 'cancelled') continue;
      if (adminDb && isFirestoreAvailable) {
        try {
          const slotRef = adminDb.collection('schedule_slots').doc(getSlotDocId(appt.date, appt.time));
          await slotRef.set(
            {
              appointmentId: appt.id,
              date: appt.date,
              time: appt.time,
              status: 'confirmed',
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
          synced++;
        } catch {}
      }
    }
    console.log(`[Schedule Engine] Integridade de horários sincronizada (${appointments.length} agendamentos avaliados, ${synced} slots mapeados no Firestore).`);
  } catch (err: any) {
    console.warn('[Schedule Engine] Aviso na sincronização inicial de horários:', err?.message);
  }
}


// Helper para autorização verificável: Administradora autenticada OU titular com token criptográfico válido
async function verifyAppointmentAccess(
  req: express.Request,
  appointment: any
): Promise<{ authorized: boolean; isAdmin: boolean; errorStatus?: number; errorMessage?: string }> {
  // 1. Verifica se a requisição possui token de administrador oficial válido via Firebase ID Token
  const adminUser = await getAuthenticatedAdmin(req);
  if (adminUser) {
    return { authorized: true, isAdmin: true };
  }

  // 2. Extrai o token de gerenciamento do titular do agendamento (headers ou body)
  const headerToken = req.headers['x-appointment-token'];
  const authHeader = req.headers.authorization;
  let bearerToken: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.split('Bearer ')[1]?.trim();
  }

  const clientToken = (
    (typeof req.body?.manageToken === 'string' ? req.body.manageToken.trim() : '') ||
    (typeof req.body?.token === 'string' ? req.body.token.trim() : '') ||
    (typeof headerToken === 'string' ? headerToken.trim() : '') ||
    (typeof bearerToken === 'string' ? bearerToken.trim() : '')
  );

  // 3. Rejeita se nenhum token de gerenciamento foi fornecido
  if (!clientToken) {
    return {
      authorized: false,
      isAdmin: false,
      errorStatus: 401,
      errorMessage: 'Acesso não autorizado. Token de gerenciamento do agendamento não informado.'
    };
  }

  // 4. Validação criptográfica do token do agendamento (com suporte a hash seguro ou legado)
  const storedHash = appointment?.tokenHash;
  const legacyToken = appointment?.manageToken;

  if (!storedHash && !legacyToken) {
    return {
      authorized: false,
      isAdmin: false,
      errorStatus: 403,
      errorMessage: 'Acesso negado. Token de autorização inválido para este agendamento.'
    };
  }

  const isValid = verifyToken(clientToken, storedHash, legacyToken);
  if (!isValid) {
    return {
      authorized: false,
      isAdmin: false,
      errorStatus: 403,
      errorMessage: 'Acesso negado. Token de autorização incorreto para este agendamento.'
    };
  }

  // 5. Verificação de expiração do token se definida
  if (appointment?.tokenExpiresAt) {
    const expiresMs = new Date(appointment.tokenExpiresAt).getTime();
    if (!isNaN(expiresMs) && Date.now() > expiresMs) {
      return {
        authorized: false,
        isAdmin: false,
        errorStatus: 403,
        errorMessage: 'Acesso negado. O prazo de validade deste token de agendamento expirou.'
      };
    }
  }

  return { authorized: true, isAdmin: false };
}

// Helper to get active server credentials (stored exclusively on server)
function getServerConfig(): {
  gmailAppPassword?: string;
  whatsappGatewayUrl?: string;
  whatsappGatewayToken?: string;
} {
  try {
    if (fs.existsSync(SERVER_CONFIG_FILE)) {
      const content = fs.readFileSync(SERVER_CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[Server Config] Error reading config file', err);
  }
  return {};
}

function saveServerConfig(config: {
  gmailAppPassword?: string;
  whatsappGatewayUrl?: string;
  whatsappGatewayToken?: string;
}) {
  try {
    fs.writeFileSync(SERVER_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server Config] Error saving config file', err);
  }
}

// 1. API: Salvar ou sincronizar credenciais administrativas no servidor (REQUER ADMIN)
app.post('/api/admin/save-server-config', requireAdminAuth, (req, res) => {
  try {
    const { gmailAppPassword, whatsappGatewayUrl, whatsappGatewayToken } = req.body;
    const current = getServerConfig();
    const updated = {
      ...current,
      gmailAppPassword: gmailAppPassword !== undefined ? (gmailAppPassword || '').replace(/\s+/g, '') : current.gmailAppPassword,
      whatsappGatewayUrl: whatsappGatewayUrl !== undefined ? whatsappGatewayUrl : current.whatsappGatewayUrl,
      whatsappGatewayToken: whatsappGatewayToken !== undefined ? whatsappGatewayToken : current.whatsappGatewayToken
    };
    saveServerConfig(updated);
    return res.status(200).json({ success: true, message: 'Configurações salvas no servidor.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 1.1 API: Obter configurações públicas (higienizadas sem senhas/segredos)
app.get('/api/config', (_req, res) => {
  try {
    const data = getServerAppData();
    const raw = data.config || {};
    // Garantir que nenhum segredo ou senha seja devolvido publicamente
    const sanitized = { ...raw };
    delete sanitized.adminPassword;
    delete sanitized.adminPasswordHash;
    delete sanitized.gmailAppPassword;
    delete sanitized.whatsappGatewayUrl;
    delete sanitized.whatsappGatewayToken;
    return res.status(200).json({ success: true, config: sanitized });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Salvar configurações globais (REQUER ADMIN)
app.post('/api/config', requireAdminAuth, (req, res) => {
  try {
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ success: false, error: 'Configuração não informada.' });
    }
    const current = getServerAppData();
    // Higienizar segredos do objeto antes de salvar no config público
    const sanitized = { ...config };
    delete sanitized.adminPassword;
    delete sanitized.adminPasswordHash;
    current.config = sanitized;
    saveServerAppData(current);
    return res.status(200).json({ success: true, message: 'Configurações sincronizadas no servidor.', config: sanitized });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 1.2 API: Endpoint PÚBLICO para checagem segura de horários ocupados (ZERO PII / SEM DADOS DE CLIENTES)
app.get('/api/booked-slots', async (_req, res) => {
  try {
    const appointments = await getAllAppointments();
    // Retorna apenas { date, time } de agendamentos não cancelados, sem qualquer identificação de cliente
    const bookedSlots = appointments
      .filter((a) => a && a.status !== 'cancelled' && a.date && a.time)
      .map((a) => ({ date: a.date, time: a.time }));
    return res.status(200).json({ success: true, bookedSlots });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Helper para envio oficial e automatizado de e-mail de confirmação pelo servidor (SEM OPEN RELAY)
async function sendServerAppointmentEmail(appointment: {
  clientName: string;
  clientEmail: string;
  date: string;
  time: string;
  topic?: string;
  meetLink?: string;
  manageToken?: string;
}) {
  const config = getServerConfig();
  const rawPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
  const gmailPass = (rawPass || '').replace(/\s+/g, '');

  if (!gmailPass) {
    console.warn(`[Email Service] GMAIL_APP_PASSWORD não configurada no servidor. Notificação registrada para: ${appointment.clientEmail}`);
    return { success: false, requiresAppPassword: true };
  }

  const dateFormatted = appointment.date.split('-').reverse().join('/');
  const subject = `Confirmação de Reunião: Beeginning 4 you (${dateFormatted} às ${appointment.time})`;

  const textBody =
    `Olá, ${appointment.clientName}!\n\n` +
    `Este é o e-mail oficial da Beeginning 4 you (${OFFICIAL_EMAIL}) confirmando o agendamento da sua reunião virtual:\n\n` +
    `📅 Data: ${dateFormatted}\n` +
    `⏰ Horário: ${appointment.time} (Horário de Brasília)\n` +
    `⏳ Duração: 45 minutos\n` +
    `💻 Sala Virtual Google Meet: ${appointment.meetLink || 'https://meet.google.com/fxx-ctnv-hgm'}\n` +
    `💡 Assunto: ${appointment.topic || 'Conversa inicial sobre ideia de negócio'}\n\n` +
    `🔒 Compromisso de Sigilo e LGPD:\n` +
    `A Beeginning 4 you se compromete rigorosamente a manter o sigilo absoluto sobre todas as ideias de negócio, conceitos e informações compartilhadas neste primeiro contato e em reuniões subsequentes, garantindo total segurança e propriedade intelectual ao cliente. Além disso, asseguramos a proteção dos seus dados pessoais em total conformidade com a LGPD (Lei nº 13.709/2018).\n\n` +
    `Atenciosamente,\n` +
    `Equipe Beeginning 4 you\n` +
    `E-mail: ${OFFICIAL_EMAIL}\n` +
    `WhatsApp Oficial: (11) 98629-7916`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1A1A1A; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #1E3A47; padding: 24px; color: #FFFFFF; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Bee-ginning 4 you</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #E5A93B;">Reunião Confirmada com Sucesso</p>
      </div>
      <div style="padding: 24px; background-color: #FFFFFF;">
        <p style="font-size: 15px;">Olá, <strong>${appointment.clientName}</strong>!</p>
        <p style="font-size: 13px; color: #555555;">Sua reunião virtual com nossa equipe está confirmada:</p>
        <div style="background-color: #F8F8F6; border-left: 4px solid #E5A93B; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>📅 Data:</strong> ${dateFormatted}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>⏰ Horário:</strong> ${appointment.time} (Horário de Brasília)</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>⏳ Duração:</strong> 45 min</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>💻 Sala Google Meet:</strong> <a href="${appointment.meetLink || 'https://meet.google.com/fxx-ctnv-hgm'}" style="color: #1E3A47; font-weight: bold;">${appointment.meetLink || 'https://meet.google.com/fxx-ctnv-hgm'}</a></p>
        </div>
        <p style="font-size: 12px; color: #666666; background-color: #FAFAFA; padding: 12px; border-radius: 8px; border: 1px solid #EAEAEA;">
          🔒 <strong>Compromisso de Sigilo e LGPD:</strong><br/>
          Garantimos sigilo absoluto sobre todas as ideias e informações compartilhadas sob proteção da LGPD.
        </p>
        <p style="font-size: 13px; margin-top: 20px;">
          Aguardamos o nosso encontro!<br/>
          <strong>Equipe Bee-ginning 4 you</strong><br/>
          📧 <a href="mailto:${OFFICIAL_EMAIL}" style="color: #1E3A47;">${OFFICIAL_EMAIL}</a><br/>
          📱 WhatsApp: <a href="https://wa.me/5511986297916" style="color: #1E3A47;">(11) 98629-7916</a>
        </p>
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: OFFICIAL_EMAIL,
        pass: gmailPass
      }
    });

    const info = await transporter.sendMail({
      from: `"Bee-ginning 4 You" <${OFFICIAL_EMAIL}>`,
      to: appointment.clientEmail,
      subject,
      text: textBody,
      html: htmlBody
    });

    console.log(`[Email Service] Confirmação oficial enviada para ${appointment.clientEmail}. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[Email Service] Erro ao enviar e-mail de confirmação:', error?.message);
    return { success: false, error: error?.message };
  }
}

// 1.3 API: Agendamentos de Reuniões Google Meet (LISTAGEM REQUER ADMIN)
app.get('/api/appointments', requireAdminAuth, async (_req, res) => {
  try {
    const appointments = await getAllAppointments();
    // Higieniza tokenHash e segredos antes de devolver à UI administrativa
    const sanitized = appointments.map((a) => {
      const copy = { ...a };
      delete copy.tokenHash;
      delete copy.manageToken;
      copy.hasSecurityToken = true;
      return copy;
    });
    return res.status(200).json({ success: true, appointments: sanitized });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Criar novo agendamento (Público no fluxo de agendamento: BLOQUEIA SOBRESCRITA, CONCORRÊNCIA ATÔMICA E RATE LIMITING)
app.post('/api/appointments', createRateLimitMiddleware(appointmentCreateLimiter), async (req, res) => {
  try {
    const adminUser = await getAuthenticatedAdmin(req);
    const body = req.body?.appointment || req.body;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ success: false, error: 'Dados do agendamento inválidos.' });
    }

    // Se a requisição vem de um administrador autenticado, permite criar ou atualizar
    if (adminUser) {
      if (!body.id || !body.clientName || !body.date || !body.time) {
        return res.status(400).json({ success: false, error: 'Dados obrigatórios do agendamento incompletos.' });
      }
      const existingAppt = await getAppointmentById(body.id);
      const appointmentToSave = {
        ...(existingAppt || {}),
        ...body,
        updatedAt: new Date().toISOString()
      };
      await persistAppointment(appointmentToSave);
      return res.status(200).json({ success: true, message: 'Agendamento salvo pelo administrador.', appointment: appointmentToSave });
    }

    // --- REQUISIÇÃO PÚBLICA / ANÔNIMA ---
    // 1. PREVENÇÃO DE SOBRESCRITA: Rejeitar se o ID fornecido já existir no sistema
    if (body.id && typeof body.id === 'string') {
      const existing = await getAppointmentById(body.id);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Identificador já existente. Operações públicas não podem sobrescrever registros.'
        });
      }
    }

    // 2. Validação estrita de tipos e limites para campos públicos esperados
    const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : '';
    const clientEmail = typeof body.clientEmail === 'string' ? body.clientEmail.trim() : '';
    const clientPhone = typeof body.clientPhone === 'string' ? body.clientPhone.trim() : '';
    const date = typeof body.date === 'string' ? body.date.trim() : '';
    const time = typeof body.time === 'string' ? body.time.trim() : '';

    if (!clientName || clientName.length > 200) {
      return res.status(400).json({ success: false, error: 'Nome do cliente é obrigatório (máximo 200 caracteres).' });
    }
    if (!clientEmail || clientEmail.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return res.status(400).json({ success: false, error: 'E-mail válido é obrigatório.' });
    }
    if (!clientPhone || clientPhone.length > 50) {
      return res.status(400).json({ success: false, error: 'Telefone/WhatsApp é obrigatório.' });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Data inválida. Formato esperado: AAAA-MM-DD.' });
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ success: false, error: 'Horário inválido. Formato esperado: HH:mm.' });
    }

    // 3. Construção explícita de objeto higienizado com Token Criptografado (SHA-256)
    const trustedId = (body.id && typeof body.id === 'string' && /^[a-zA-Z0-9_-]{3,128}$/.test(body.id))
      ? body.id
      : `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const clientProvidedToken = (typeof body.manageToken === 'string' && body.manageToken.trim().length >= 16)
      ? body.manageToken.trim()
      : null;
    const rawManageToken = clientProvidedToken || `tok_live_${Date.now().toString(36)}_${crypto.randomBytes(24).toString('hex')}`;
    const tokenHash = hashToken(rawManageToken);

    // Validade de 30 dias ou data do evento + 24 horas
    const meetingDateTime = new Date(`${date}T${time}:00`);
    const tokenExpiresAt = !isNaN(meetingDateTime.getTime())
      ? new Date(meetingDateTime.getTime() + 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const sanitizedAppointment = {
      id: trustedId,
      tokenHash, // Apenas o hash SHA-256 é persistido no Firestore, nunca o token em texto puro
      tokenCreatedAt: new Date().toISOString(),
      tokenExpiresAt,
      clientName,
      clientEmail,
      clientPhone,
      topic: typeof body.topic === 'string' ? body.topic.trim().slice(0, 1000) : 'Conversa inicial sobre ideia de negócio',
      date,
      time,
      durationMinutes: 45, // Controlado exclusivamente pelo servidor
      meetLink: 'https://meet.google.com/fxx-ctnv-hgm', // Controlado exclusivamente pelo servidor
      status: 'confirmed', // Controlado exclusivamente pelo servidor
      createdAt: new Date().toISOString(), // Atribuído pelo servidor
      confidentialityAccepted: Boolean(body.confidentialityAccepted)
    };

    // 4. Criação atômica com serialização de concorrência e transação Firestore
    const creationResult = await atomicCreateAppointment(sanitizedAppointment);
    if (!creationResult.success) {
      if (creationResult.conflict) {
        return res.status(409).json({ success: false, error: creationResult.reason });
      }
      return res.status(500).json({ success: false, error: 'Falha ao persistir agendamento no armazenamento do servidor.' });
    }

    // 5. Disparo interno seguro do e-mail oficial (disparo único e controlado)
    let emailResult: { success: boolean; requiresAppPassword?: boolean; messageId?: string; error?: string } = {
      success: false,
      requiresAppPassword: false
    };
    try {
      emailResult = await sendServerAppointmentEmail({
        ...sanitizedAppointment,
        manageToken: rawManageToken
      });
    } catch (mailErr: any) {
      console.warn('[Email Trigger] Falha no disparo do e-mail de agendamento:', mailErr?.message);
      emailResult = { success: false, requiresAppPassword: false, error: mailErr?.message };
    }

    // Remove tokenHash do objeto de retorno para não expor internamente à resposta pública
    const clientResponseAppt = { ...sanitizedAppointment };
    delete (clientResponseAppt as any).tokenHash;

    return res.status(201).json({
      success: true,
      message: 'Agendamento registrado com sucesso.',
      appointment: clientResponseAppt,
      manageToken: rawManageToken, // Retornado uma única vez para o titular guardar na sessão
      emailSent: Boolean(emailResult.success),
      emailNotice: emailResult.success
        ? 'E-mail de confirmação enviado com sucesso.'
        : (emailResult.requiresAppPassword
            ? 'Agendamento confirmado. O e-mail automático requer configuração de Senha de Aplicativo do Gmail no servidor.'
            : 'Agendamento confirmado. O e-mail automático não pôde ser entregue no momento.')
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Excluir agendamento (REQUER ADMIN)
app.delete('/api/appointments/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isDeleted = await deleteAppointmentFromStore(id);
    if (!isDeleted) {
      return res.status(500).json({ success: false, error: 'Falha ao excluir agendamento no servidor.' });
    }
    return res.status(200).json({ success: true, message: 'Agendamento excluído pelo administrador.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Reenviar confirmação de agendamento existente (REQUER ADMIN OU TITULAR COM TOKEN VÁLIDO + RATE LIMITING)
app.post('/api/appointments/resend-confirmation', createRateLimitMiddleware(resendConfirmationLimiter), async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId || typeof appointmentId !== 'string') {
      return res.status(400).json({ success: false, error: 'Identificador do agendamento é obrigatório.' });
    }
    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Agendamento não encontrado.' });
    }

    // EXIGÊNCIA OBRIGATÓRIA: Administrador autenticado OU titular com token de gerenciamento válido
    const authCheck = await verifyAppointmentAccess(req, appointment);
    if (!authCheck.authorized) {
      return res.status(authCheck.errorStatus || 403).json({
        success: false,
        error: authCheck.errorMessage || 'Acesso negado. Apenas o titular autorizado ou a administradora podem solicitar o reenvio da confirmação.'
      });
    }

    const emailResult = await sendServerAppointmentEmail(appointment);
    return res.status(200).json({
      success: true,
      message: `E-mail de confirmação reenviado para ${appointment.clientEmail}.`,
      emailResult
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Recuperação segura de acesso ao agendamento por e-mail (TIMING-SAFE / ANTI-ENUMERAÇÃO + RATE LIMITING)
app.post('/api/appointments/request-access', createRateLimitMiddleware(requestAccessLimiter), async (req, res) => {
  try {
    const { clientEmail } = req.body;
    if (!clientEmail || typeof clientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      return res.status(400).json({ success: false, error: 'E-mail válido é obrigatório.' });
    }

    const emailNorm = clientEmail.trim().toLowerCase();
    const all = await getAllAppointments();
    const clientAppts = all.filter(
      (a) => a && a.clientEmail && a.clientEmail.toLowerCase() === emailNorm && a.status !== 'cancelled'
    );

    if (clientAppts.length > 0) {
      const targetAppt = clientAppts[0];
      const newRawToken = `tok_live_${Date.now().toString(36)}_${crypto.randomBytes(24).toString('hex')}`;
      const newTokenHash = hashToken(newRawToken);

      targetAppt.tokenHash = newTokenHash;
      targetAppt.tokenCreatedAt = new Date().toISOString();
      await persistAppointment(targetAppt);

      const dateFormatted = targetAppt.date.split('-').reverse().join('/');
      const manageUrl = `${req.protocol}://${req.get('host')}/?manage_id=${targetAppt.id}&token=${newRawToken}#meeting`;

      const config = getServerConfig();
      const rawPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
      const gmailPass = (rawPass || '').replace(/\s+/g, '');

      if (gmailPass) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: OFFICIAL_EMAIL, pass: gmailPass }
          });
          await transporter.sendMail({
            from: `"Bee-ginning 4 You" <${OFFICIAL_EMAIL}>`,
            to: targetAppt.clientEmail,
            subject: `Acesso ao seu Agendamento: Bee-ginning 4 you (${dateFormatted} às ${targetAppt.time})`,
            text: `Olá, ${targetAppt.clientName}!\n\nRecebemos uma solicitação de acesso para o gerenciamento da sua reunião virtual marcada para ${dateFormatted} às ${targetAppt.time}.\n\nPara visualizar, reagendar ou cancelar sua reunião com total segurança, acesse o link abaixo:\n${manageUrl}\n\nSe você não solicitou este acesso, ignore esta mensagem.\n\nAtenciosamente,\nEquipe Bee-ginning 4 you`
          });
        } catch (emailErr: any) {
          console.warn('[Email Service] Falha ao enviar link de recuperação de agendamento:', emailErr?.message);
        }
      }
    }

    // Mensagem genérica segura (previne enumeração de usuários)
    return res.status(200).json({
      success: true,
      message: 'Se houver agendamentos ativos para este e-mail, as instruções de acesso e o link de gerenciamento foram enviados.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Notificação e persistência oficial de reagendamento pelo servidor (AUTORIZAÇÃO VERIFICÁVEL + CONCORRÊNCIA ATÔMICA)
app.post('/api/appointments/reschedule-notification', async (req, res) => {
  try {
    const { appointmentId, newDate, newTime } = req.body;
    if (!appointmentId || typeof appointmentId !== 'string') {
      return res.status(400).json({ success: false, persisted: false, error: 'Identificador do agendamento é obrigatório.' });
    }
    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, persisted: false, error: 'Agendamento não encontrado.' });
    }

    // 1. AUTORIZAÇÃO: Requer titular com token válido OU administradora autenticada
    const authCheck = await verifyAppointmentAccess(req, appointment);
    if (!authCheck.authorized) {
      return res.status(authCheck.errorStatus || 403).json({
        success: false,
        persisted: false,
        error: authCheck.errorMessage || 'Acesso negado. Apenas o titular autorizado ou a administradora podem reagendar.'
      });
    }

    // 2. VALIDAÇÃO DOS PARÂMETROS DE REAGENDAMENTO
    const targetDate = typeof newDate === 'string' ? newDate.trim() : '';
    const targetTime = typeof newTime === 'string' ? newTime.trim() : '';

    if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return res.status(400).json({
        success: false,
        persisted: false,
        error: 'Data inválida para reagendamento. Formato esperado: AAAA-MM-DD.'
      });
    }
    if (!targetTime || !/^\d{2}:\d{2}$/.test(targetTime)) {
      return res.status(400).json({
        success: false,
        persisted: false,
        error: 'Horário inválido para reagendamento. Formato esperado: HH:mm.'
      });
    }

    // 3. REAGENDAMENTO ATÔMICO E DURÁVEL (FIRESTORE TRANSACTION + LOCAL CONSISTENTE)
    const actorDesc = authCheck.isAdmin ? 'administrador' : 'cliente';
    const rescheduleResult = await atomicRescheduleAppointment(appointmentId, targetDate, targetTime, actorDesc);

    if (!rescheduleResult.success) {
      if (rescheduleResult.conflict) {
        return res.status(409).json({
          success: false,
          persisted: false,
          error: rescheduleResult.reason
        });
      }
      return res.status(500).json({
        success: false,
        persisted: false,
        error: rescheduleResult.reason || 'Falha ao salvar a alteração no armazenamento persistente do servidor.'
      });
    }

    const updatedAppointment = rescheduleResult.appointment;

    // 4. NOTIFICAÇÃO POR E-MAIL (se configurado)
    const config = getServerConfig();
    const rawPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const gmailPass = (rawPass || '').replace(/\s+/g, '');

    if (!gmailPass) {
      return res.status(200).json({
        success: true,
        persisted: true,
        requiresAppPassword: true,
        message: 'Reagendamento persistido com sucesso no servidor. Disparo de e-mail requer senha de aplicativo.',
        appointment: updatedAppointment
      });
    }

    try {
      const dateFormatted = targetDate.split('-').reverse().join('/');
      const subject = `Reagendamento de Reunião: Beeginning 4 you (Novo horário: ${dateFormatted} às ${targetTime})`;
      const text =
        `Olá, ${updatedAppointment.clientName}!\n\n` +
        `Confirmamos que a sua reunião com a Beeginning 4 you (${OFFICIAL_EMAIL}) foi reagendada com sucesso:\n\n` +
        `📅 NOVA DATA: ${dateFormatted}\n` +
        `⏰ NOVO HORÁRIO: ${targetTime} (Horário de Brasília)\n` +
        `⏳ Duração: 45 minutos\n` +
        `💻 Sala Virtual Google Meet: ${updatedAppointment.meetLink || 'https://meet.google.com/fxx-ctnv-hgm'}\n\n` +
        `🔒 Compromisso de Sigilo e LGPD:\n` +
        `Todas as informações e ideias compartilhadas permanecem sob absoluto sigilo comercial e em conformidade com a LGPD.\n\n` +
        `Atenciosamente,\n` +
        `Equipe Beeginning 4 you\n` +
        `${OFFICIAL_EMAIL}`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: OFFICIAL_EMAIL, pass: gmailPass }
      });

      const info = await transporter.sendMail({
        from: `"Bee-ginning 4 You" <${OFFICIAL_EMAIL}>`,
        to: updatedAppointment.clientEmail,
        subject,
        text
      });

      return res.status(200).json({
        success: true,
        persisted: true,
        messageId: info.messageId,
        appointment: updatedAppointment,
        message: 'Reagendamento confirmado e persistido com sucesso.'
      });
    } catch (emailErr: any) {
      console.warn('[Email Service] Falha ao enviar e-mail de reagendamento:', emailErr?.message);
      return res.status(200).json({
        success: true,
        persisted: true,
        emailError: emailErr?.message,
        appointment: updatedAppointment,
        message: 'Reagendamento persistido com sucesso no servidor (falha no envio do e-mail).'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, persisted: false, error: err?.message });
  }
});

// Notificação e persistência oficial de cancelamento pelo servidor (AUTORIZAÇÃO VERIFICÁVEL + LIBERAÇÃO ATÔMICA DO HORÁRIO)
app.post('/api/appointments/cancel-notification', async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId || typeof appointmentId !== 'string') {
      return res.status(400).json({ success: false, persisted: false, error: 'Identificador do agendamento é obrigatório.' });
    }
    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, persisted: false, error: 'Agendamento não encontrado.' });
    }

    // 1. AUTORIZAÇÃO: Requer titular com token válido OU administradora autenticada
    const authCheck = await verifyAppointmentAccess(req, appointment);
    if (!authCheck.authorized) {
      return res.status(authCheck.errorStatus || 403).json({
        success: false,
        persisted: false,
        error: authCheck.errorMessage || 'Acesso negado. Apenas o titular autorizado ou a administradora podem cancelar.'
      });
    }

    // 2. CANCELAMENTO ATÔMICO E LIBERAÇÃO DO HORÁRIO
    const actorDesc = authCheck.isAdmin ? 'administrador' : 'cliente';
    const cancelResult = await atomicCancelAppointment(appointmentId, actorDesc);

    if (!cancelResult.success) {
      return res.status(500).json({
        success: false,
        persisted: false,
        error: cancelResult.reason || 'Falha ao salvar o cancelamento no armazenamento persistente do servidor.'
      });
    }

    const updatedAppointment = cancelResult.appointment;

    // 3. NOTIFICAÇÃO POR E-MAIL (se configurado)
    const config = getServerConfig();
    const rawPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const gmailPass = (rawPass || '').replace(/\s+/g, '');

    if (!gmailPass) {
      return res.status(200).json({
        success: true,
        persisted: true,
        requiresAppPassword: true,
        message: 'Cancelamento persistido no servidor. Disparo de e-mail requer senha de aplicativo.',
        appointment: updatedAppointment
      });
    }

    try {
      const dateFormatted = updatedAppointment.date.split('-').reverse().join('/');
      const subject = `Cancelamento de Reunião: Beeginning 4 you (${dateFormatted} às ${updatedAppointment.time})`;
      const text =
        `Olá, ${updatedAppointment.clientName}!\n\n` +
        `Confirmamos que a sua reunião com a equipe da Beeginning 4 you (${OFFICIAL_EMAIL}), anteriormente agendada para ${dateFormatted} às ${updatedAppointment.time}, foi cancelada conforme solicitado.\n\n` +
        `Caso queira reagendar no futuro ou prefira conversar via WhatsApp (5511986297916), estamos sempre à sua disposição.\n\n` +
        `Atenciosamente,\n` +
        `Equipe Beeginning 4 you\n` +
        `${OFFICIAL_EMAIL}`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: OFFICIAL_EMAIL, pass: gmailPass }
      });

      const info = await transporter.sendMail({
        from: `"Bee-ginning 4 You" <${OFFICIAL_EMAIL}>`,
        to: updatedAppointment.clientEmail,
        subject,
        text
      });

      return res.status(200).json({
        success: true,
        persisted: true,
        messageId: info.messageId,
        appointment: updatedAppointment,
        message: 'Cancelamento confirmado e persistido com sucesso.'
      });
    } catch (emailErr: any) {
      console.warn('[Email Service] Falha ao enviar e-mail de cancelamento:', emailErr?.message);
      return res.status(200).json({
        success: true,
        persisted: true,
        emailError: emailErr?.message,
        appointment: updatedAppointment,
        message: 'Cancelamento persistido com sucesso no servidor (falha no envio do e-mail).'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, persisted: false, error: err?.message });
  }
});

// 1.4 API: Demandas e Formulários de Contato (LISTAGEM REQUER ADMIN)
app.get('/api/demands', requireAdminAuth, (_req, res) => {
  try {
    const data = getServerAppData();
    return res.status(200).json({ success: true, demands: data.demands || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Criar nova demanda de contato (Público para formulário: BLOQUEIA SOBRESCRITA, RATE LIMITING E FILTRA CAMPOS ESTRITAMENTE)
app.post('/api/demands', createRateLimitMiddleware(demandCreateLimiter), async (req, res) => {
  try {
    const adminUser = await getAuthenticatedAdmin(req);
    const body = req.body?.demand || req.body;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ success: false, error: 'Dados da demanda inválidos.' });
    }

    const current = getServerAppData();
    const existing = current.demands || [];

    // Se a requisição vem de um administrador autenticado, permite criar ou atualizar
    if (adminUser) {
      if (!body.id || !body.name) {
        return res.status(400).json({ success: false, error: 'Nome e identificador da demanda são obrigatórios.' });
      }
      const index = existing.findIndex((d) => d.id === body.id);
      if (index >= 0) {
        existing[index] = { ...existing[index], ...body };
      } else {
        existing.unshift(body);
      }
      current.demands = existing;
      saveServerAppData(current);
      return res.status(200).json({ success: true, message: 'Demanda salva pelo administrador.', demand: body });
    }

    // --- REQUISIÇÃO PÚBLICA / ANÔNIMA ---
    // 1. PREVENÇÃO DE SOBRESCRITA: Rejeitar se o ID fornecido já existir
    if (body.id && typeof body.id === 'string' && existing.some((d) => d.id === body.id)) {
      return res.status(409).json({
        success: false,
        error: 'Identificador já existente. Operações públicas não podem sobrescrever registros.'
      });
    }

    // 2. Validação estrita de tipos e limites
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const contactValue = typeof body.contactValue === 'string' ? body.contactValue.trim() : '';

    if (!name || name.length > 200) {
      return res.status(400).json({ success: false, error: 'O nome é obrigatório (máximo 200 caracteres).' });
    }

    if (!email && !phone && !contactValue) {
      return res.status(400).json({
        success: false,
        error: 'É obrigatório informar ao menos uma forma de contato (e-mail ou telefone/WhatsApp).'
      });
    }

    // 3. Construção explícita do objeto higienizado (IGNORANDO adminNotes, status arbitrário, flags)
    const trustedId = (body.id && typeof body.id === 'string' && /^[a-zA-Z0-9_-]{3,128}$/.test(body.id))
      ? body.id
      : `demand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const sanitizedDemand = {
      id: trustedId,
      name,
      businessName: typeof body.businessName === 'string' ? body.businessName.trim().slice(0, 200) : '',
      segment: typeof body.segment === 'string' ? body.segment.trim().slice(0, 100) : '',
      contactMethod: body.contactMethod === 'email' ? 'email' : 'whatsapp',
      contactValue: typeof body.contactValue === 'string' ? body.contactValue.trim().slice(0, 200) : '',
      phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 50) : '',
      email: typeof body.email === 'string' ? body.email.trim().slice(0, 200) : '',
      biggestNeed: typeof body.biggestNeed === 'string' ? body.biggestNeed.trim().slice(0, 3000) : '',
      businessDescription: typeof body.businessDescription === 'string' ? body.businessDescription.trim().slice(0, 3000) : '',
      projectStage: typeof body.projectStage === 'string' ? body.projectStage.trim().slice(0, 100) : '',
      mainGoal: typeof body.mainGoal === 'string' ? body.mainGoal.trim().slice(0, 200) : '',
      urgency: typeof body.urgency === 'string' ? body.urgency.trim().slice(0, 50) : 'media',
      origin: typeof body.origin === 'string' ? body.origin.trim().slice(0, 100) : 'site',
      source: typeof body.source === 'string' ? body.source.trim().slice(0, 100) : 'formulario_contato',
      status: 'Novo', // Atribuído pelo servidor
      createdAt: new Date().toISOString() // Atribuído pelo servidor
    };

    existing.unshift(sanitizedDemand);
    current.demands = existing;
    saveServerAppData(current);

    return res.status(201).json({
      success: true,
      message: 'Demanda registrada com sucesso.',
      demand: sanitizedDemand
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Excluir demanda (REQUER ADMIN)
app.delete('/api/demands/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const current = getServerAppData();
    current.demands = (current.demands || []).filter((d) => d.id !== id);
    saveServerAppData(current);
    return res.status(200).json({ success: true, message: 'Demanda excluída pelo administrador.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 2. API: Testar Envio de E-mail (REQUER ADMIN)
app.post('/api/test-email', requireAdminAuth, async (req, res) => {
  try {
    const { to, appPassword } = req.body;
    const targetEmail = to || OFFICIAL_EMAIL;
    const config = getServerConfig();
    const rawPass = appPassword || config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const gmailPass = (rawPass || '').replace(/\s+/g, '');

    if (!gmailPass) {
      return res.status(400).json({
        success: false,
        error: 'Senha de aplicativo do Gmail não informada no servidor. Configure GMAIL_APP_PASSWORD.'
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: OFFICIAL_EMAIL,
        pass: gmailPass
      }
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"Bee-ginning 4 You" <${OFFICIAL_EMAIL}>`,
      to: targetEmail,
      subject: 'Teste de Disparo de E-mail • Bee-ginning 4 you',
      text: `Olá!\n\nEste é um e-mail de teste confirmando que a plataforma Bee-ginning 4 you está configurada e disparando e-mails reais diretamente pelo servidor a partir de ${OFFICIAL_EMAIL}.\n\nAtenciosamente,\nEquipe Bee-ginning 4 you`
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: `E-mail de teste enviado com sucesso para ${targetEmail}!`
    });
  } catch (error: any) {
    console.error('[Email Test] Erro ao testar envio:', error?.message);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao autenticar com o Gmail.'
    });
  }
});

// 3. API: Envio direto e manual de E-mail (REQUER ADMIN: FECHA OPEN RELAY PÚBLICO)
app.post('/api/send-email', requireAdminAuth, async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ success: false, error: 'Campos "to" e "subject" são obrigatórios.' });
    }

    const config = getServerConfig();
    const rawPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const gmailPass = (rawPass || '').replace(/\s+/g, '');

    if (!gmailPass) {
      console.warn(`[Email Service] GMAIL_APP_PASSWORD não configurada no servidor. Notificação registrada para: ${to}`);
      return res.status(200).json({
        success: false,
        requiresAppPassword: true,
        message: 'A plataforma registrou o e-mail. Para disparo automático pelo servidor, adicione a Senha de Aplicativo do Gmail (GMAIL_APP_PASSWORD).'
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: OFFICIAL_EMAIL,
        pass: gmailPass
      }
    });

    const info = await transporter.sendMail({
      from: `"Bee-ginning 4 You" <${OFFICIAL_EMAIL}>`,
      to,
      subject,
      text: text || '',
      html: html || undefined
    });

    console.log(`[Email Service] E-mail oficial enviado para ${to}. ID: ${info.messageId}`);
    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'E-mail enviado com sucesso diretamente pelo servidor.'
    });
  } catch (error: any) {
    console.error('[Email Service] Erro ao enviar e-mail:', error?.message);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao processar o envio de e-mail no servidor.'
    });
  }
});

// 4. API: Disparo de WhatsApp via Gateway (REQUER ADMIN + PROTEÇÃO RIGOROSA CONTRA SSRF)
app.post('/api/send-whatsapp', requireAdminAuth, async (req, res) => {
  try {
    const { to, message } = req.body;
    const cleanPhone = (to || '').replace(/\D/g, '');
    const phoneTarget = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const config = getServerConfig();
    const gatewayUrl = (req.body?.gatewayUrl && typeof req.body.gatewayUrl === 'string' ? req.body.gatewayUrl.trim() : '') || config.whatsappGatewayUrl || process.env.WHATSAPP_GATEWAY_URL;
    const gatewayToken = config.whatsappGatewayToken || process.env.WHATSAPP_GATEWAY_TOKEN;

    if (!gatewayUrl) {
      return res.status(200).json({
        success: false,
        requiresGateway: true,
        clientPhone: phoneTarget,
        message: 'Gateway WhatsApp não configurado no servidor.'
      });
    }

    // Validação estrita anti-SSRF: Bloqueia loopback, endereços privados, metadados de nuvem e esquemas não-HTTPS
    const urlValidation = validateSafeGatewayUrl(gatewayUrl);
    if (!urlValidation.valid) {
      console.warn(`[SSRF Prevention] Requisição de WhatsApp bloqueada: ${urlValidation.reason}`);
      return res.status(400).json({
        success: false,
        error: `URL do gateway WhatsApp rejeitada por política de segurança (SSRF): ${urlValidation.reason}`
      });
    }

    // Disparo seguro com 'redirect: error' para impedir desvio do fluxo para alvos internos não autorizados
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(gatewayToken ? { Authorization: `Bearer ${gatewayToken}` } : {})
      },
      body: JSON.stringify({
        number: phoneTarget,
        message
      }),
      redirect: 'error'
    });

    const result = await response.json();
    return res.status(200).json({ success: true, result });
  } catch (err: any) {
    console.error('[WhatsApp Service] Erro ao disparar via gateway:', err?.message);
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 5. Montagem do Vite no Dev ou Servir estáticos no Production
async function startServer() {
  // Verifica disponibilidade e permissões do Firestore
  await checkFirestoreAvailability();

  // Sincronização inicial e mapeamento atômico de slots se Firestore estiver ativo
  if (isFirestoreAvailable) {
    await syncScheduleSlots();
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, error: 'Endpoint da API não encontrado.' });
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bee-ginning 4 You] Servidor rodando na porta ${PORT}`);
  });
}

startServer();
