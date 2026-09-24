import express from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const OFFICIAL_EMAIL = process.env.GMAIL_USER || 'beeginning4you@gmail.com';
const SERVER_CONFIG_FILE = path.resolve(__dirname, 'admin_server_config.json');

// Helper to get active server credentials
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

// 1. API: Salvar ou sincronizar credenciais administrativas no servidor
app.post('/api/admin/save-server-config', (req, res) => {
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

// 2. API: Testar Envio de E-mail
app.post('/api/test-email', async (req, res) => {
  try {
    const { to, appPassword } = req.body;
    const targetEmail = to || OFFICIAL_EMAIL;
    const config = getServerConfig();
    const rawPass = appPassword || config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const gmailPass = (rawPass || '').replace(/\s+/g, '');

    if (!gmailPass) {
      return res.status(400).json({
        success: false,
        error: 'Senha de aplicativo do Gmail não informada. Gere uma Senha de App de 16 caracteres em myaccount.google.com -> Segurança -> Senhas de app.'
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
    console.error('[Email Test] Erro ao testar envio:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao autenticar com o Gmail. Verifique se a senha de app de 16 letras está correta.'
    });
  }
});

// 3. API: Envio direto e automatizado de E-mail via Servidor
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text, html, appPassword } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ success: false, error: 'Campos "to" e "subject" são obrigatórios.' });
    }

    const config = getServerConfig();
    const rawPass = appPassword || config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const gmailPass = (rawPass || '').replace(/\s+/g, '');

    if (!gmailPass) {
      console.warn(`[Email Service] GMAIL_APP_PASSWORD não definida no ambiente. Notificação registrada para: ${to}`);
      return res.status(200).json({
        success: false,
        requiresAppPassword: true,
        message: 'A plataforma registrou o e-mail. Para disparo automático 100% silencioso pelo servidor sem interação manual, adicione a Senha de Aplicativo do Gmail (GMAIL_APP_PASSWORD).'
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

    console.log(`[Email Service] E-mail oficial enviado com sucesso para ${to}. ID: ${info.messageId}`);
    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'E-mail enviado com sucesso diretamente pelo servidor da plataforma.'
    });
  } catch (error: any) {
    console.error('[Email Service] Erro ao enviar e-mail:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao processar o envio de e-mail no servidor.'
    });
  }
});

// 4. API: Disparo de WhatsApp via Gateway (Z-API, Evolution API, Meta Cloud)
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;
    const cleanPhone = (to || '').replace(/\D/g, '');
    const phoneTarget = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const config = getServerConfig();
    const gatewayUrl = config.whatsappGatewayUrl || process.env.WHATSAPP_GATEWAY_URL;
    const gatewayToken = config.whatsappGatewayToken || process.env.WHATSAPP_GATEWAY_TOKEN;

    if (!gatewayUrl) {
      // Se não houver gateway externo de API conectado, o servidor instrui o fallback
      return res.status(200).json({
        success: false,
        requiresGateway: true,
        clientPhone: phoneTarget,
        message: 'Para o servidor injetar mensagens diretamente no WhatsApp do cliente sem interação humana, é necessário integrar um Gateway WhatsApp (como Evolution API ou Z-API). Link direto disponível para a Regina disparar com 1 clique.'
      });
    }

    // Se houver gateway configurado, dispara a requisição HTTP para o gateway oficial
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
    console.error('[WhatsApp Service] Erro ao disparar via gateway:', err);
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 3. Montagem do Vite no Dev ou Servir estáticos no Production
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
