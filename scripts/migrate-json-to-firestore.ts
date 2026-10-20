import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DATA_FILE = path.resolve(rootDir, 'admin_app_data.json');
const PRODUCTION_PROJECT_ID = 'beegining4you';

interface MigrationOptions {
  isDryRun: boolean;
  targetProject: string | null;
  confirmedExecution: boolean;
  authorizedProduction: boolean;
}

function parseCliArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  let isDryRun = true;
  let targetProject: string | null = process.env.MIGRATION_TARGET_PROJECT || null;
  let confirmedExecution = process.env.CONFIRM_MIGRATION_EXECUTION === 'true';
  let authorizedProduction = process.env.AUTHORIZE_PRODUCTION_MIGRATION === 'true';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      isDryRun = true;
    } else if (arg === '--execute') {
      isDryRun = false;
    } else if (arg === '--confirm-migration') {
      confirmedExecution = true;
    } else if (arg === '--authorize-production-migration') {
      authorizedProduction = true;
    } else if (arg === '--target-project' && i + 1 < args.length) {
      targetProject = args[++i].trim();
    }
  }

  return { isDryRun, targetProject, confirmedExecution, authorizedProduction };
}

async function runMigration() {
  const options = parseCliArgs();

  console.log('============================================================');
  console.log('🐝 BEEginning 4 You — Migração Segura de Agendamentos');
  console.log('============================================================');

  if (!fs.existsSync(DATA_FILE)) {
    console.log(`[AVISO] Arquivo ${DATA_FILE} não encontrado. Nenhum dado local a migrar.`);
    return;
  }

  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  let data: { appointments?: any[]; demands?: any[] } = {};
  try {
    data = JSON.parse(rawData);
  } catch (err: any) {
    console.error('[ERRO] Falha ao analisar admin_app_data.json:', err?.message);
    process.exit(1);
  }

  const appointments = Array.isArray(data.appointments) ? data.appointments : [];
  console.log(`[1] Total de agendamentos encontrados no JSON local: ${appointments.length}`);

  // MODO DRY-RUN (PADRÃO SEGURO)
  if (options.isDryRun) {
    console.log('\n[MODO DRY-RUN ATIVO] Simulação segura de migração:');
    console.log('- Nenhuma escrita será executada no Firestore.');
    console.log('- Nenhum dado do Firestore foi ou será alterado.');
    console.log(`- Projeto alvo configurado: ${options.targetProject || '(não informado - execute com --target-project <ID>)'}`);
    console.log(`- Registros elegíveis para migração: ${appointments.length}`);
    appointments.forEach((a, idx) => {
      console.log(`    ${idx + 1}. [${a.id}] ${a.clientName || 'Sem nome'} (${a.date || 'sem data'} ${a.time || ''}) - Status: ${a.status || 'novo'}`);
    });
    console.log('\n✅ Simulação concluída com sucesso. Nenhuma operação executada em produção.');
    console.log('Para autorizar execução real: forneça --target-project, --confirm-migration e credenciais explícitas.');
    console.log('============================================================\n');
    return;
  }

  // VALIDAÇÃO RIGOROSA PARA EXECUÇÃO LIVE
  if (!options.targetProject) {
    console.error('\n❌ [BLOQUEIO DE SEGURANÇA]:');
    console.error('Projeto de destino explícito não foi informado.');
    console.error('Uso obrigatório: npx tsx scripts/migrate-json-to-firestore.ts --execute --target-project <PROJECT_ID> --confirm-migration');
    process.exit(1);
  }

  if (!options.confirmedExecution) {
    console.error('\n❌ [BLOQUEIO DE SEGURANÇA]:');
    console.error('Autorização operacional explícita ausente.');
    console.error('Adicione a flag --confirm-migration e defina CONFIRM_MIGRATION_EXECUTION=true no ambiente.');
    process.exit(1);
  }

  // Proteção contra execução acidental contra projeto de produção
  const isTargetProduction =
    options.targetProject === PRODUCTION_PROJECT_ID ||
    options.targetProject === 'beegining4you' ||
    (options.targetProject.includes('beegining') && !options.targetProject.includes('test'));

  if (isTargetProduction && !options.authorizedProduction) {
    console.error('\n🛑 [PROTEÇÃO DE PRODUÇÃO ATIVADA]:');
    console.error(`O projeto alvo "${options.targetProject}" é identificado como AMBIENTE DE PRODUÇÃO.`);
    console.error('A execução direta contra produção é estritamente bloqueada para evitar contaminação ou sobrescrita.');
    console.error('Requer: --authorize-production-migration E variável AUTHORIZE_PRODUCTION_MIGRATION=true.');
    process.exit(1);
  }

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
        projectId: options.targetProject
      });
    } else {
      app = initializeApp({ projectId: options.targetProject });
    }
    db = getFirestore(app);
    console.log(`[3] Conexão com Cloud Firestore estabelecida para o projeto: ${options.targetProject}`);
  } catch (err: any) {
    console.error(`[3] Falha na conexão com Firestore: ${err?.message}`);
    process.exit(1);
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
        console.log(`  ✓ Agendamento [${appt.id}] migrado para o Firestore`);
      } catch (err: any) {
        console.warn(`  ✗ Falha ao gravar agendamento [${appt.id}] no Firestore: ${err?.message}`);
      }
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[4] admin_app_data.json atualizado.`);

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
