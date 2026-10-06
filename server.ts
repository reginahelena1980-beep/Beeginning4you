import express from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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

// Inicialização segura do Firebase Admin SDK para verificação de tokens
let firebaseAdminApp: any = null;
const canonicalServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_ADMIN_CREDENTIALS;

if (!getApps().length) {
  try {
    if (canonicalServiceAccount) {
      const serviceAccount = JSON.parse(canonicalServiceAccount);
      firebaseAdminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID
      });
      console.log(`[Firebase Admin] SDK inicializado com conta de serviço para o projeto: ${FIREBASE_PROJECT_ID}`);
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
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[Server Data] Erro ao ler dados persistidos no servidor', err);
  }
  return {};
}

function saveServerAppData(data: ServerAppData) {
  try {
    fs.writeFileSync(SERVER_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server Data] Erro ao salvar dados no servidor', err);
  }
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
app.get('/api/booked-slots', (_req, res) => {
  try {
    const data = getServerAppData();
    const appointments = data.appointments || [];
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
app.get('/api/appointments', requireAdminAuth, (_req, res) => {
  try {
    const data = getServerAppData();
    return res.status(200).json({ success: true, appointments: data.appointments || [] });
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

    const current = getServerAppData();
    const existing = current.appointments || [];

    // Se a requisição vem de um administrador autenticado, permite criar ou atualizar
    if (adminUser) {
      if (!body.id || !body.clientName || !body.date || !body.time) {
        return res.status(400).json({ success: false, error: 'Dados obrigatórios do agendamento incompletos.' });
      }
      const index = existing.findIndex((a) => a.id === body.id);
      if (index >= 0) {
        existing[index] = { ...existing[index], ...body, updatedAt: new Date().toISOString() };
      } else {
        existing.unshift(body);
      }
      current.appointments = existing;
      saveServerAppData(current);
      return res.status(200).json({ success: true, message: 'Agendamento salvo pelo administrador.', appointment: body });
    }

    // --- REQUISIÇÃO PÚBLICA / ANÔNIMA ---
    // 1. PREVENÇÃO DE SOBRESCRITA: Rejeitar se o ID fornecido já existir no sistema
    if (body.id && typeof body.id === 'string' && existing.some((a) => a.id === body.id)) {
      return res.status(409).json({
        success: false,
        error: 'Identificador já existente. Operações públicas não podem sobrescrever registros.'
      });
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

    // 3. Validação de colisão de horário no servidor
    const isSlotOccupied = existing.some(
      (a) => a && a.status !== 'cancelled' && a.date === date && a.time === time
    );
    if (isSlotOccupied) {
      return res.status(409).json({
        success: false,
        error: 'Este horário já se encontra reservado. Por favor, selecione outro horário.'
      });
    }

    // 4. Construção explícita de objeto higienizado (IGNORANDO adminNotes, diagnosticNotes, flags)
    const trustedId = (body.id && typeof body.id === 'string' && /^[a-zA-Z0-9_-]{3,128}$/.test(body.id))
      ? body.id
      : `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const sanitizedAppointment = {
      id: trustedId,
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

    existing.unshift(sanitizedAppointment);
    current.appointments = existing;
    saveServerAppData(current);

    // 5. Disparo interno seguro do e-mail oficial (sem relay aberto)
    sendServerAppointmentEmail(sanitizedAppointment).catch((err) => {
      console.warn('[Email Trigger] Falha no disparo do e-mail de agendamento:', err?.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Agendamento registrado com sucesso.',
      appointment: sanitizedAppointment
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Excluir agendamento (REQUER ADMIN)
app.delete('/api/appointments/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const current = getServerAppData();
    current.appointments = (current.appointments || []).filter((a) => a.id !== id);
    saveServerAppData(current);
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
    const current = getServerAppData();
    const existing = current.appointments || [];
    const appointment = existing.find((a) => a.id === appointmentId);
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

// Notificação oficial de reagendamento pelo servidor (SEGURO: SEM OPEN RELAY)
app.post('/api/appointments/reschedule-notification', async (req, res) => {
  try {
    const { appointmentId, newDate, newTime } = req.body;
    if (!appointmentId || typeof appointmentId !== 'string') {
      return res.status(400).json({ success: false, error: 'Identificador do agendamento é obrigatório.' });
    }
    const current = getServerAppData();
    const existing = current.appointments || [];
    const appointment = existing.find((a) => a.id === appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Agendamento não encontrado.' });
    }

    const config = getServerConfig();
    const rawPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const gmailPass = (rawPass || '').replace(/\s+/g, '');

    if (!gmailPass) {
      return res.status(200).json({ success: false, requiresAppPassword: true });
    }

    const targetDate = newDate || appointment.date;
    const targetTime = newTime || appointment.time;
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

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Notificação oficial de cancelamento pelo servidor (SEGURO: SEM OPEN RELAY)
app.post('/api/appointments/cancel-notification', async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId || typeof appointmentId !== 'string') {
      return res.status(400).json({ success: false, error: 'Identificador do agendamento é obrigatório.' });
    }
    const current = getServerAppData();
    const existing = current.appointments || [];
    const appointment = existing.find((a) => a.id === appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Agendamento não encontrado.' });
    }

    const config = getServerConfig();
    const rawPass = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const gmailPass = (rawPass || '').replace(/\s+/g, '');

    if (!gmailPass) {
      return res.status(200).json({ success: false, requiresAppPassword: true });
    }

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

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
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
