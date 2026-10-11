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

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const OFFICIAL_EMAIL = process.env.GMAIL_USER || 'beeginning4you@gmail.com';
const SERVER_CONFIG_FILE = path.resolve(__dirname, 'admin_server_config.json');
const SERVER_DATA_FILE = path.resolve(__dirname, 'admin_app_data.json');
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'beegining4you';

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
      canonicalServiceAccount.includes('BEGIN PRIVATE KEY') &&
      process.env.AUTHORIZED_SERVICE_ACCOUNT_EMAIL
    ) {
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: process.env.AUTHORIZED_SERVICE_ACCOUNT_EMAIL,
          privateKey: canonicalServiceAccount.replace(/\\n/g, '\n')
        }),
        projectId: FIREBASE_PROJECT_ID
      });
      console.log(`[Firebase Admin] SDK inicializado com credenciais explícitas para: ${process.env.AUTHORIZED_SERVICE_ACCOUNT_EMAIL}`);
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

  if (!firebaseAdminApp) {
    console.error('[Admin Auth] Firebase Admin SDK indisponível para verificar token.');
    return res.status(503).json({
      success: false,
      error: 'Serviço de autenticação administrativo indisponível no servidor.'
    });
  }

  let decoded: any;
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
  if (!authHeader || !authHeader.startsWith('Bearer ') || !firebaseAdminApp) return null;
  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return null;
  try {
    const decoded = await getAuth().verifyIdToken(token);
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
  if (adminDb) {
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
  if (adminDb) {
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

async function persistAppointment(appointment: any): Promise<boolean> {
  let firestoreSaved = false;
  if (adminDb) {
    try {
      const { id, ...dataToSave } = appointment;
      await adminDb.collection('appointments').doc(id).set(dataToSave, { merge: true });
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
  if (adminDb) {
    try {
      await adminDb.collection('appointments').doc(id).delete();
    } catch (err: any) {
      console.warn('[Firestore Admin] Erro ao excluir no Firestore:', err?.message);
    }
  }
  const current = getServerAppData();
  current.appointments = (current.appointments || []).filter((a: any) => a && a.id !== id);
  return saveServerAppData(current);
}

async function getAdminBlockedSlots(): Promise<any[]> {
  if (adminDb) {
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
    `${OFFICIAL_EMAIL}`;

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
          <a href="mailto:${OFFICIAL_EMAIL}" style="color: #1E3A47;">${OFFICIAL_EMAIL}</a>
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

// Criar novo agendamento (Público no fluxo de agendamento: BLOQUEIA SOBRESCRITA E FILTRA CAMPOS ESTRITAMENTE)
app.post('/api/appointments', async (req, res) => {
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

    // 3. Validação de colisão de horário no servidor (SSOT)
    const slotOccupied = await isSlotTaken(date, time);
    if (slotOccupied) {
      return res.status(409).json({
        success: false,
        error: 'Este horário já se encontra reservado. Por favor, selecione outro horário.'
      });
    }

    // 4. Validação de bloqueios administrativos na mesma fonte de dados
    const slotBlocked = await isSlotAdminBlocked(date, time);
    if (slotBlocked) {
      return res.status(409).json({
        success: false,
        error: 'A data ou horário selecionado está temporariamente bloqueado pela administração.'
      });
    }

    // 5. Construção explícita de objeto higienizado com Token Criptografado (SHA-256)
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
      tokenHash, // Apenas o hash SHA-256 é armazenado no Firestore, nunca o segredo em texto puro
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

    const isSaved = await persistAppointment(sanitizedAppointment);
    if (!isSaved) {
      return res.status(500).json({ success: false, error: 'Falha ao persistir agendamento no armazenamento do servidor.' });
    }

    // 6. Disparo interno seguro do e-mail oficial (sem relay aberto)
    sendServerAppointmentEmail({
      ...sanitizedAppointment,
      manageToken: rawManageToken
    }).catch((err) => {
      console.warn('[Email Trigger] Falha no disparo do e-mail de agendamento:', err?.message);
    });

    // Remove tokenHash do objeto de retorno para não expor à resposta pública
    const clientResponseAppt = { ...sanitizedAppointment };
    delete (clientResponseAppt as any).tokenHash;

    return res.status(201).json({
      success: true,
      message: 'Agendamento registrado com sucesso.',
      appointment: clientResponseAppt,
      manageToken: rawManageToken // Retornado uma única vez para o titular guardar na sessão
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

// Reenviar confirmação de agendamento existente (SEGURO: SEM OPEN RELAY)
app.post('/api/appointments/resend-confirmation', async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId || typeof appointmentId !== 'string') {
      return res.status(400).json({ success: false, error: 'Identificador do agendamento é obrigatório.' });
    }
    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Agendamento não encontrado.' });
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

// Recuperação segura de acesso ao agendamento por e-mail (TIMING-SAFE / ANTI-ENUMERAÇÃO)
app.post('/api/appointments/request-access', async (req, res) => {
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

// Notificação e persistência oficial de reagendamento pelo servidor (AUTORIZAÇÃO VERIFICÁVEL + ANTI-COLISÃO)
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

    // 3. VALIDAÇÃO DE CONFLITO/COLISÃO DE HORÁRIO (BLOQUEIA HORÁRIO JÁ OCUPADO NO FIRESTORE/SSOT)
    const slotOccupied = await isSlotTaken(targetDate, targetTime, appointment.id);
    if (slotOccupied) {
      return res.status(409).json({
        success: false,
        persisted: false,
        error: 'O horário selecionado já se encontra reservado. Por favor, selecione outro horário.'
      });
    }

    // 4. VALIDAÇÃO DE HORÁRIOS BLOQUEADOS PELA ADMINISTRAÇÃO
    const slotBlocked = await isSlotAdminBlocked(targetDate, targetTime);
    if (slotBlocked) {
      return res.status(409).json({
        success: false,
        persisted: false,
        error: 'A data ou horário selecionado está temporariamente bloqueado pela administração.'
      });
    }

    // 5. ATUALIZAÇÃO DO AGENDAMENTO
    const prevDate = appointment.date;
    const prevTime = appointment.time;
    appointment.date = targetDate;
    appointment.time = targetTime;
    appointment.status = 'rescheduled';
    appointment.updatedAt = new Date().toISOString();
    appointment.history = [
      ...(appointment.history || []),
      {
        date: new Date().toISOString(),
        action: `Reagendada de ${prevDate} ${prevTime} para ${targetDate} às ${targetTime} por ${authCheck.isAdmin ? 'administrador' : 'cliente'}`
      }
    ];

    // 6. PERSISTÊNCIA DURÁVEL CONFIRMADA (FIRESTORE + ESPELHAMENTO)
    const isPersisted = await persistAppointment(appointment);
    if (!isPersisted) {
      return res.status(500).json({
        success: false,
        persisted: false,
        error: 'Falha ao salvar a alteração no armazenamento persistente do servidor.'
      });
    }

    // 7. NOTIFICAÇÃO POR E-MAIL (se configurado)
    const config = getServerConfig();
    const rawPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const gmailPass = (rawPass || '').replace(/\s+/g, '');

    if (!gmailPass) {
      return res.status(200).json({
        success: true,
        persisted: true,
        requiresAppPassword: true,
        message: 'Reagendamento persistido com sucesso no servidor. Disparo de e-mail requer senha de aplicativo.',
        appointment
      });
    }

    try {
      const dateFormatted = targetDate.split('-').reverse().join('/');
      const subject = `Reagendamento de Reunião: Beeginning 4 you (Novo horário: ${dateFormatted} às ${targetTime})`;
      const text =
        `Olá, ${appointment.clientName}!\n\n` +
        `Confirmamos que a sua reunião com a Beeginning 4 you (${OFFICIAL_EMAIL}) foi reagendada com sucesso:\n\n` +
        `📅 NOVA DATA: ${dateFormatted}\n` +
        `⏰ NOVO HORÁRIO: ${targetTime} (Horário de Brasília)\n` +
        `⏳ Duração: 45 minutos\n` +
        `💻 Sala Virtual Google Meet: ${appointment.meetLink || 'https://meet.google.com/fxx-ctnv-hgm'}\n\n` +
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
        to: appointment.clientEmail,
        subject,
        text
      });

      return res.status(200).json({
        success: true,
        persisted: true,
        messageId: info.messageId,
        appointment,
        message: 'Reagendamento confirmado e persistido com sucesso.'
      });
    } catch (emailErr: any) {
      console.warn('[Email Service] Falha ao enviar e-mail de reagendamento:', emailErr?.message);
      return res.status(200).json({
        success: true,
        persisted: true,
        emailError: emailErr?.message,
        appointment,
        message: 'Reagendamento persistido com sucesso no servidor (falha no envio do e-mail).'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, persisted: false, error: err?.message });
  }
});

// Notificação e persistência oficial de cancelamento pelo servidor (AUTORIZAÇÃO VERIFICÁVEL + GRAVAÇÃO DURÁVEL)
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

    // 2. ATUALIZAÇÃO DO STATUS PARA CANCELADO
    appointment.status = 'cancelled';
    appointment.updatedAt = new Date().toISOString();
    appointment.history = [
      ...(appointment.history || []),
      {
        date: new Date().toISOString(),
        action: `Reunião cancelada por ${authCheck.isAdmin ? 'administrador' : 'cliente'}`
      }
    ];

    // 3. PERSISTÊNCIA DURÁVEL CONFIRMADA (FIRESTORE + ESPELHAMENTO)
    const isPersisted = await persistAppointment(appointment);
    if (!isPersisted) {
      return res.status(500).json({
        success: false,
        persisted: false,
        error: 'Falha ao salvar o cancelamento no armazenamento persistente do servidor.'
      });
    }

    // 4. NOTIFICAÇÃO POR E-MAIL (se configurado)
    const config = getServerConfig();
    const rawPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const gmailPass = (rawPass || '').replace(/\s+/g, '');

    if (!gmailPass) {
      return res.status(200).json({
        success: true,
        persisted: true,
        requiresAppPassword: true,
        message: 'Cancelamento persistido no servidor. Disparo de e-mail requer senha de aplicativo.',
        appointment
      });
    }

    try {
      const dateFormatted = appointment.date.split('-').reverse().join('/');
      const subject = `Cancelamento de Reunião: Beeginning 4 you (${dateFormatted} às ${appointment.time})`;
      const text =
        `Olá, ${appointment.clientName}!\n\n` +
        `Confirmamos que a sua reunião com a equipe da Beeginning 4 you (${OFFICIAL_EMAIL}), anteriormente agendada para ${dateFormatted} às ${appointment.time}, foi cancelada conforme solicitado.\n\n` +
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
        to: appointment.clientEmail,
        subject,
        text
      });

      return res.status(200).json({
        success: true,
        persisted: true,
        messageId: info.messageId,
        appointment,
        message: 'Cancelamento confirmado e persistido com sucesso.'
      });
    } catch (emailErr: any) {
      console.warn('[Email Service] Falha ao enviar e-mail de cancelamento:', emailErr?.message);
      return res.status(200).json({
        success: true,
        persisted: true,
        emailError: emailErr?.message,
        appointment,
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

// Criar nova demanda de contato (Público para formulário: BLOQUEIA SOBRESCRITA E FILTRA CAMPOS ESTRITAMENTE)
app.post('/api/demands', async (req, res) => {
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
    if (!name || name.length > 200) {
      return res.status(400).json({ success: false, error: 'O nome é obrigatório (máximo 200 caracteres).' });
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

// 4. API: Disparo de WhatsApp via Gateway (REQUER ADMIN)
app.post('/api/send-whatsapp', requireAdminAuth, async (req, res) => {
  try {
    const { to, message } = req.body;
    const cleanPhone = (to || '').replace(/\D/g, '');
    const phoneTarget = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const config = getServerConfig();
    const gatewayUrl = config.whatsappGatewayUrl || process.env.WHATSAPP_GATEWAY_URL;
    const gatewayToken = config.whatsappGatewayToken || process.env.WHATSAPP_GATEWAY_TOKEN;

    if (!gatewayUrl) {
      return res.status(200).json({
        success: false,
        requiresGateway: true,
        clientPhone: phoneTarget,
        message: 'Gateway WhatsApp não configurado no servidor.'
      });
    }

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(gatewayToken ? { Authorization: `Bearer ${gatewayToken}` } : {})
      },
      body: JSON.stringify({
        number: phoneTarget,
        message
      })
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
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bee-ginning 4 You] Servidor rodando na porta ${PORT}`);
  });
}

startServer();
