import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DATA_FILE = path.resolve(rootDir, 'admin_app_data.json');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'beegining4you';

async function runMigration() {
  console.log('============================================================');
  console.log('🐝 BEEginning 4 You — Migração de Agendamentos para Firestore');
  console.log('============================================================\n');

  if (!fs.existsSync(DATA_FILE)) {
    console.log(`[AVISO] Arquivo ${DATA_FILE} não encontrado. Nenhum dado local a migrar.`);
    return;
  }

  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  let data: { appointments?: any[]; demands?: any[] } = {};
  try {
    data = JSON.parse(rawData);
  } catch (err: any) {
    console.error('[ERRO] Falha ao analisar admin_app_data.json:', err.message);
    return;
  }

  const appointments = Array.isArray(data.appointments) ? data.appointments : [];
  console.log(`[1] Total de agendamentos encontrados no JSON local: ${appointments.length}`);

  // Backup de segurança
  const backupPath = path.resolve(rootDir, `admin_app_data.backup.${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[2] Backup de segurança gerado com sucesso em: ${path.basename(backupPath)}`);

  // Inicializa Firebase Admin SDK se configurado
  let db: any = null;
  const canonicalServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  try {
    let app: any = null;
    if (canonicalServiceAccount && canonicalServiceAccount.trim().startsWith('{')) {
      app = initializeApp({
        credential: cert(JSON.parse(canonicalServiceAccount)),
        projectId: PROJECT_ID
      });
    } else {
      app = initializeApp({ projectId: PROJECT_ID });
    }
    db = getFirestore(app);
    console.log(`[3] Conexão com Cloud Firestore estabelecida para o projeto: ${PROJECT_ID}`);
  } catch (err: any) {
    console.warn(`[3] Firestore Admin não pôde conectar em modo live (ambiente sandbox/local): ${err?.message}`);
  }

  let migratedCount = 0;
  let updatedCount = 0;

  for (const appt of appointments) {
    if (!appt || !appt.id) continue;

    // Normalização do token seguro
    if (!appt.tokenHash) {
      const rawToken = appt.manageToken || `tok_live_${Date.now().toString(36)}_${crypto.randomBytes(24).toString('hex')}`;
      appt.tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      appt.tokenCreatedAt = appt.tokenCreatedAt || new Date().toISOString();
      updatedCount++;
    }

    if (db) {
      try {
        const { id, manageToken, ...firestoreDoc } = appt;
        await db.collection('appointments').doc(id).set(firestoreDoc, { merge: true });
        migratedCount++;
        console.log(`  ✓ Agendamento [${appt.id}] migrado para o Firestore com tokenHash`);
      } catch (err: any) {
        console.warn(`  ✗ Falha ao gravar agendamento [${appt.id}] no Firestore: ${err?.message}`);
      }
    }
  }

  // Atualiza arquivo local higienizado
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[4] admin_app_data.json atualizado com tokens criptográficos normalizados.`);

  console.log('\n============================================================');
  console.log(`Resumo da Migração:`);
  console.log(`- Registros avaliados: ${appointments.length}`);
  console.log(`- Tokens gerados/normalizados: ${updatedCount}`);
  console.log(`- Documentos gravados no Firestore: ${migratedCount}`);
  console.log('✅ PROCESSO DE MIGRAÇÃO CONCLUÍDO');
  console.log('============================================================\n');
}

runMigration().catch((err) => {
  console.error('[ERRO FATAL NA MIGRAÇÃO]:', err);
  process.exit(1);
});
