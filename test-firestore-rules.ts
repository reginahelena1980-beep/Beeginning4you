import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

const PROJECT_ID = 'beegining4you-test';
const RULES = readFileSync('./firestore.rules', 'utf8');

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err?.message || String(err) });
    console.error(`  ✗ ${name}`);
    console.error(`    Erro: ${err?.message || err}`);
  }
}

async function main() {
  console.log('\n============================================================');
  console.log('🧪 Iniciando Testes Automatizados de Regras de Segurança Firestore');
  console.log('============================================================\n');

  const testEnv: RulesTestEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: RULES,
      host: '127.0.0.1',
      port: 8080
    }
  });

  const unauthenticatedContext = testEnv.unauthenticatedContext();
  const unauthDb = unauthenticatedContext.firestore();

  const adminContext = testEnv.authenticatedContext('admin-regina', {
    email: 'beeginning4you@gmail.com',
    email_verified: true
  });
  const adminDb = adminContext.firestore();

  const unverifiedAdminContext = testEnv.authenticatedContext('fake-admin', {
    email: 'beeginning4you@gmail.com',
    email_verified: false
  });
  const unverifiedAdminDb = unverifiedAdminContext.firestore();

  const otherUserContext = testEnv.authenticatedContext('attacker-user', {
    email: 'attacker@example.com',
    email_verified: true
  });
  const otherUserDb = otherUserContext.firestore();

  try {
    // ----------------------------------------------------------------
    // GRUPO 1: Criação Pública Válida de Demandas
    // ----------------------------------------------------------------
    console.log('--- Grupo 1: Criação Pública de Demandas (Visitantes Anônimos) ---');
    await testEnv.clearFirestore();

    await runTest('Visitante público cria demanda válida com status "Novo"', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-pub-1');
      await assertSucceeds(
        setDoc(ref, {
          name: 'Maria Silva',
          email: 'maria@example.com',
          phone: '(11) 98765-4321',
          contactMethod: 'whatsapp',
          contactValue: '(11) 98765-4321',
          businessName: 'Studio Beleza',
          segment: 'Estética',
          biggestNeed: 'Automatizar agendamentos',
          projectStage: 'rodando',
          source: 'formulario_contato',
          origin: 'site',
          status: 'Novo',
          createdAt: new Date().toISOString()
        })
      );
    });

    await runTest('Visitante público cria demanda válida com status "new"', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-pub-2');
      await assertSucceeds(
        setDoc(ref, {
          name: 'João Santos',
          status: 'new',
          createdAt: new Date().toISOString()
        })
      );
    });

    await runTest('Visitante público cria lead WhatsApp com status "in_progress"', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-wa-1');
      await assertSucceeds(
        setDoc(ref, {
          name: 'Carlos Oliveira',
          origin: 'whatsapp_modal',
          source: 'whatsapp_modal',
          urgency: 'media',
          status: 'in_progress',
          createdAt: new Date().toISOString()
        })
      );
    });

    // ----------------------------------------------------------------
    // GRUPO 2: Rejeição de Dados Maliciosos em Demandas
    // ----------------------------------------------------------------
    console.log('\n--- Grupo 2: Rejeição de Demandas Inválidas ou Maliciosas ---');

    await runTest('Bloqueia demanda pública com injeção de "adminNotes"', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-exploit-1');
      await assertFails(
        setDoc(ref, {
          name: 'Hacker',
          adminNotes: 'Aprovado internamente sem revisão',
          status: 'Novo'
        })
      );
    });

    await runTest('Bloqueia demanda pública com status administrativo arbitrário ("Concluído")', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-exploit-2');
      await assertFails(
        setDoc(ref, {
          name: 'Hacker',
          status: 'Concluído'
        })
      );
    });

    await runTest('Bloqueia demanda pública com campos arbitrários injetados ("isAdmin")', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-exploit-3');
      await assertFails(
        setDoc(ref, {
          name: 'Hacker',
          isAdmin: true,
          status: 'Novo'
        })
      );
    });

    await runTest('Bloqueia demanda sem nome (campo obrigatório ausente)', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-invalid-1');
      await assertFails(
        setDoc(ref, {
          email: 'teste@example.com',
          status: 'Novo'
        })
      );
    });

    await runTest('Bloqueia demanda com contactMethod inválido ("telegram")', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-invalid-2');
      await assertFails(
        setDoc(ref, {
          name: 'Cliente Teste',
          contactMethod: 'telegram',
          status: 'Novo'
        })
      );
    });

    // ----------------------------------------------------------------
    // GRUPO 3: Criação Pública Válida de Agendamentos
    // ----------------------------------------------------------------
    console.log('\n--- Grupo 3: Criação Pública de Agendamentos (Visitantes Anônimos) ---');

    await runTest('Visitante público é bloqueado ao tentar criar agendamento diretamente no Firestore (requer API Express)', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-pub-1');
      await assertFails(
        setDoc(ref, {
          clientName: 'Ana Paula',
          clientEmail: 'ana.paula@example.com',
          clientPhone: '(11) 97777-8888',
          topic: 'Consultoria de processos digitais',
          date: '2026-10-20',
          time: '14:00',
          durationMinutes: 45,
          meetLink: 'https://meet.google.com/fxx-ctnv-hgm',
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          confidentialityAccepted: true
        })
      );
    });

    // ----------------------------------------------------------------
    // GRUPO 4: Rejeição de Dados Maliciosos em Agendamentos
    // ----------------------------------------------------------------
    console.log('\n--- Grupo 4: Rejeição de Agendamentos Inválidos ou Maliciosos ---');

    await runTest('Bloqueia agendamento com status arbitrário ("cancelled" na criação pública)', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-malicious-status');
      await assertFails(
        setDoc(ref, {
          clientName: 'Atacante',
          date: '2026-10-20',
          time: '14:00',
          durationMinutes: 45,
          meetLink: 'https://meet.google.com/fxx-ctnv-hgm',
          status: 'cancelled'
        })
      );
    });

    await runTest('Bloqueia agendamento com durationMinutes adulterado (120 min)', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-malicious-duration');
      await assertFails(
        setDoc(ref, {
          clientName: 'Atacante',
          date: '2026-10-20',
          time: '14:00',
          durationMinutes: 120,
          meetLink: 'https://meet.google.com/fxx-ctnv-hgm',
          status: 'confirmed'
        })
      );
    });

    await runTest('Bloqueia agendamento com meetLink externo/phishing ("https://evil-phishing.com")', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-malicious-link');
      await assertFails(
        setDoc(ref, {
          clientName: 'Atacante',
          date: '2026-10-20',
          time: '14:00',
          durationMinutes: 45,
          meetLink: 'https://evil-phishing.com/roubo-credenciais',
          status: 'confirmed'
        })
      );
    });

    await runTest('Bloqueia agendamento com injeção de "diagnosticNotes"', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-malicious-diag');
      await assertFails(
        setDoc(ref, {
          clientName: 'Atacante',
          date: '2026-10-20',
          time: '14:00',
          durationMinutes: 45,
          meetLink: 'https://meet.google.com/fxx-ctnv-hgm',
          status: 'confirmed',
          diagnosticNotes: { estimatedBudget: 'R$ 0,00' }
        })
      );
    });

    await runTest('Bloqueia agendamento com formato de data inválido ("20/10/2026")', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-invalid-date');
      await assertFails(
        setDoc(ref, {
          clientName: 'Cliente',
          date: '20/10/2026',
          time: '14:00',
          durationMinutes: 45,
          status: 'confirmed'
        })
      );
    });

    await runTest('Bloqueia agendamento com formato de horário inválido ("14h00")', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-invalid-time');
      await assertFails(
        setDoc(ref, {
          clientName: 'Cliente',
          date: '2026-10-20',
          time: '14h00',
          durationMinutes: 45,
          status: 'confirmed'
        })
      );
    });

    await runTest('Bloqueia agendamento com histórico inflado (tamanho > 2)', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-inflated-history');
      await assertFails(
        setDoc(ref, {
          clientName: 'Atacante',
          date: '2026-10-20',
          time: '14:00',
          durationMinutes: 45,
          meetLink: 'https://meet.google.com/fxx-ctnv-hgm',
          status: 'confirmed',
          history: [
            { date: '2026-10-01', action: '1' },
            { date: '2026-10-02', action: '2' },
            { date: '2026-10-03', action: '3' }
          ]
        })
      );
    });

    // ----------------------------------------------------------------
    // GRUPO 5: Bloqueio Rigoroso de Leitura, Atualização e Exclusão Pública
    // ----------------------------------------------------------------
    console.log('\n--- Grupo 5: Bloqueio de Leitura, Edição e Exclusão Pública ---');

    await runTest('Bloqueia leitura pública direta de demanda (/demands/id)', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-pub-1');
      await assertFails(getDoc(ref));
    });

    await runTest('Bloqueia listagem pública de demandas (/demands)', async () => {
      const col = collection(unauthDb, 'demands');
      await assertFails(getDocs(col));
    });

    await runTest('Bloqueia leitura pública de agendamento (/appointments/id)', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-pub-1');
      await assertFails(getDoc(ref));
    });

    await runTest('Bloqueia listagem pública de agendamentos (/appointments)', async () => {
      const col = collection(unauthDb, 'appointments');
      await assertFails(getDocs(col));
    });

    await runTest('Bloqueia edição/atualização pública de agendamento', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-pub-1');
      await assertFails(updateDoc(ref, { status: 'cancelled' }));
    });

    await runTest('Bloqueia exclusão pública de agendamento', async () => {
      const ref = doc(unauthDb, 'appointments', 'meet-pub-1');
      await assertFails(deleteDoc(ref));
    });

    await runTest('Bloqueia edição/atualização pública de demanda', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-pub-1');
      await assertFails(updateDoc(ref, { status: 'Concluído' }));
    });

    await runTest('Bloqueia exclusão pública de demanda', async () => {
      const ref = doc(unauthDb, 'demands', 'demand-pub-1');
      await assertFails(deleteDoc(ref));
    });

    await runTest('Bloqueia escrita pública em /settings/contact_config', async () => {
      const ref = doc(unauthDb, 'settings', 'contact_config');
      await assertFails(setDoc(ref, { email: 'hacker@evil.com' }));
    });

    await runTest('Permite leitura pública em /settings/contact_config', async () => {
      const ref = doc(unauthDb, 'settings', 'contact_config');
      await assertSucceeds(getDoc(ref));
    });

    // ----------------------------------------------------------------
    // GRUPO 6: Usuário Autenticado Não-Autorizado (Tentativa de Bypass)
    // ----------------------------------------------------------------
    console.log('\n--- Grupo 6: Bloqueio de Usuários Autenticados Não-Autorizados ---');

    await runTest('Bloqueia leitura de demandas por usuário autenticado com outro e-mail', async () => {
      const col = collection(otherUserDb, 'demands');
      await assertFails(getDocs(col));
    });

    await runTest('Bloqueia acesso administrativo se e-mail oficial não for verificado', async () => {
      const col = collection(unverifiedAdminDb, 'demands');
      await assertFails(getDocs(col));
    });

    // ----------------------------------------------------------------
    // GRUPO 7: Acesso Completo e Exclusivo do Administrador Oficial
    // ----------------------------------------------------------------
    console.log('\n--- Grupo 7: Acesso Administrativo Autorizado (Regina / beeginning4you@gmail.com) ---');

    await runTest('Administrador lê demandas', async () => {
      const col = collection(adminDb, 'demands');
      await assertSucceeds(getDocs(col));
    });

    await runTest('Administrador atualiza status e notas de demanda', async () => {
      const ref = doc(adminDb, 'demands', 'demand-pub-1');
      await assertSucceeds(
        updateDoc(ref, {
          status: 'Proposta Enviada',
          adminNotes: 'Reunião realizada com sucesso em 10/10'
        })
      );
    });

    await runTest('Administrador lê agendamentos', async () => {
      const col = collection(adminDb, 'appointments');
      await assertSucceeds(getDocs(col));
    });

    await runTest('Administrador atualiza diagnóstico e status de agendamento', async () => {
      const ref = doc(adminDb, 'appointments', 'meet-pub-1');
      await assertSucceeds(
        updateDoc(ref, {
          status: 'rescheduled',
          diagnosticNotes: {
            opportunityStatus: 'proposta_enviada',
            estimatedBudget: 'R$ 4.500,00'
          }
        })
      );
    });

    await runTest('Administrador altera /settings/contact_config', async () => {
      const ref = doc(adminDb, 'settings', 'contact_config');
      await assertSucceeds(
        setDoc(ref, {
          email: 'beeginning4you@gmail.com',
          meetUrl: 'https://meet.google.com/fxx-ctnv-hgm'
        })
      );
    });

    await runTest('Administrador exclui demanda', async () => {
      const ref = doc(adminDb, 'demands', 'demand-pub-2');
      await assertSucceeds(deleteDoc(ref));
    });

    await runTest('Administrador exclui agendamento', async () => {
      const ref = doc(adminDb, 'appointments', 'meet-pub-1');
      await assertSucceeds(deleteDoc(ref));
    });

    // ----------------------------------------------------------------
    // Resumo dos Resultados
    // ----------------------------------------------------------------
    console.log('\n============================================================');
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`📊 Total de Testes: ${total}`);
    console.log(`✅ Sucessos: ${passed}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log('============================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await testEnv.cleanup();
  }
}

main().catch((err) => {
  console.error('Erro fatal ao executar suíte de testes:', err);
  process.exit(1);
});
