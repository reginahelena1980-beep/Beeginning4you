/**
 * BEEginning 4 You — FASE 02A.2
 * Bateria de Testes Automatizados Obrigatórios
 * 
 * Itens testados:
 * 1. Reenvio sem token: bloqueado (401/403)
 * 2. Reenvio com token inválido: bloqueado (403)
 * 3. Reenvio com token válido: autorizado (200)
 * 4. Administrador autenticado: autorizado (200)
 * 5. Rate limiting: HTTP 429 após ultrapassar o limite
 * 6. SSRF: rejeição de destinos internos (127.0.0.1, 169.254.169.254, metadata, http)
 * 7. Duas reservas simultâneas: apenas uma confirmada (uma 201, a outra 409)
 * 8. Reagendamento legítimo (200, libera antigo e ocupa novo)
 * 9. Cancelamento legítimo (200, status cancelled e libera horário)
 * 10. Consulta pública de horários sem dados pessoais (/api/booked-slots zero PII)
 * 11. Formulário de contato (/api/demands com validação e rate limit)
 * 12. Preservação do login administrativo (rotas protegidas rejeitam tokens falsos e aceitam credencial administrativa)
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const TEST_ADMIN_SECRET = 'beeginning-dev-admin-secret-token';

// GUARDA DE SEGURANÇA 1: Impede execução contra URLs públicas ou ambientes de produção
if (
  BASE_URL.startsWith('https://') ||
  BASE_URL.includes('.run.app') ||
  BASE_URL.includes('.vercel.app') ||
  BASE_URL.includes('.web.app') ||
  BASE_URL.includes('firebaseapp.com') ||
  (!BASE_URL.includes('127.0.0.1') && !BASE_URL.includes('localhost'))
) {
  console.error(`\n🛑 [BLOQUEIO DE SEGURANÇA]: Testes automatizados com criação/alteração de dados NÃO podem ser executados contra URLs públicas (${BASE_URL}). Abortando.`);
  process.exit(1);
}

interface TestResult {
  num: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

function assertTest(num: number, name: string, condition: boolean, expected: string, actual: string) {
  results.push({ num, name, expected, actual, passed: condition });
  if (condition) {
    console.log(`  ✅ [PASS] Item ${num}: ${name}`);
  } else {
    console.error(`  ❌ [FAIL] Item ${num}: ${name}\n       Esperado: ${expected}\n       Obtido:   ${actual}`);
  }
}

const runIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;

async function api(path: string, options: { method: string; headers?: Record<string, string>; body?: any; clientIp?: string }) {
  const ip = options.clientIp || runIp;
  const res = await globalThis.fetch(`${BASE_URL}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip,
      'X-Test-Execution': 'true',
      ...(options.headers || {})
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, headers: res.headers, data };
}

async function runFase02A2Tests() {
  console.log('\n============================================================');
  console.log('🐝 BEEginning 4 You — FASE 02A.2: SUITE DE TESTES OBRIGATÓRIOS');
  console.log('============================================================\n');

  const runId = Date.now().toString(36);
  const randomDays = Math.floor(Math.random() * 500) + 50;
  const targetDateObj = new Date(Date.now() + randomDays * 86400000);
  const testDate = targetDateObj.toISOString().split('T')[0];

  // Preparação: Criar um agendamento legítimo para os testes de reenvio
  const apptId = `fase2-meet-${runId}`;
  const createResp = await api('/api/appointments', {
    method: 'POST',
    body: {
      id: apptId,
      clientName: 'Dra. Mariana Silva',
      clientEmail: 'mariana.silva.test@exemplo.com.br',
      clientPhone: '(11) 99876-5432',
      date: testDate,
      time: '14:00',
      topic: 'Estruturação de consultoria executiva',
      confidentialityAccepted: true
    }
  });

  const validToken = createResp.data?.manageToken;
  console.log(`[Setup] Agendamento de teste criado: ID=${apptId}, TokenGerado=${Boolean(validToken)}`);

  // -------------------------------------------------------------
  // ITEM 1: Reenvio sem token: bloqueado
  // -------------------------------------------------------------
  console.log('\n--- ITEM 1: Reenvio sem token: bloqueado ---');
  const resendNoToken = await api('/api/appointments/resend-confirmation', {
    method: 'POST',
    body: { appointmentId: apptId }
  });
  assertTest(
    1,
    'Reenvio sem token de autorização é bloqueado com 401/403',
    resendNoToken.status === 401 || resendNoToken.status === 403,
    'HTTP 401 ou 403',
    `HTTP ${resendNoToken.status} (${resendNoToken.data?.error})`
  );

  // -------------------------------------------------------------
  // ITEM 2: Reenvio com token inválido: bloqueado
  // -------------------------------------------------------------
  console.log('\n--- ITEM 2: Reenvio com token inválido: bloqueado ---');
  const resendBadToken = await api('/api/appointments/resend-confirmation', {
    method: 'POST',
    body: { appointmentId: apptId, manageToken: 'token-completamente-falso-1234567890' }
  });
  assertTest(
    2,
    'Reenvio com token incorreto/falso é bloqueado com 403',
    resendBadToken.status === 403,
    'HTTP 403',
    `HTTP ${resendBadToken.status} (${resendBadToken.data?.error})`
  );

  // -------------------------------------------------------------
  // ITEM 3: Reenvio com token válido: autorizado
  // -------------------------------------------------------------
  console.log('\n--- ITEM 3: Reenvio com token válido: autorizado ---');
  const resendValidToken = await api('/api/appointments/resend-confirmation', {
    method: 'POST',
    body: { appointmentId: apptId, manageToken: validToken }
  });
  assertTest(
    3,
    'Reenvio com token de gerenciamento válido do titular é autorizado com 200',
    resendValidToken.status === 200 && resendValidToken.data?.success === true,
    'HTTP 200 / success: true',
    `HTTP ${resendValidToken.status} / success: ${resendValidToken.data?.success}`
  );

  // -------------------------------------------------------------
  // ITEM 4: Administrador autenticado: autorizado
  // -------------------------------------------------------------
  console.log('\n--- ITEM 4: Administrador autenticado: autorizado ---');
  const resendAdmin = await api('/api/appointments/resend-confirmation', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TEST_ADMIN_SECRET}` },
    body: { appointmentId: apptId }
  });
  assertTest(
    4,
    'Administradora autenticada autorizada a disparar reenvio de confirmação com 200',
    resendAdmin.status === 200 && resendAdmin.data?.success === true,
    'HTTP 200 / success: true',
    `HTTP ${resendAdmin.status} / success: ${resendAdmin.data?.success}`
  );

  // -------------------------------------------------------------
  // ITEM 5: Rate limiting: HTTP 429 após ultrapassar o limite
  // -------------------------------------------------------------
  console.log('\n--- ITEM 5: Rate limiting: HTTP 429 após ultrapassar o limite ---');
  // O limite de request-access é 5. Realizamos requisições consecutivas para estourar o limite:
  const spamIp = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
  let rateLimited = false;
  let lastStatus = 0;
  for (let i = 0; i < 7; i++) {
    const res = await api('/api/appointments/request-access', {
      method: 'POST',
      clientIp: spamIp,
      body: { clientEmail: `spam.check.${runId}.${i}@exemplo.com` }
    });
    lastStatus = res.status;
    if (res.status === 429) {
      rateLimited = true;
      break;
    }
  }
  assertTest(
    5,
    'Rate limiting retorna HTTP 429 ao exceder o volume permitido de requisições',
    rateLimited && lastStatus === 429,
    'HTTP 429 Too Many Requests',
    `Último status retornado: HTTP ${lastStatus}`
  );

  // -------------------------------------------------------------
  // ITEM 6: SSRF: rejeição de destinos internos
  // -------------------------------------------------------------
  console.log('\n--- ITEM 6: SSRF: rejeição de destinos internos ---');
  const ssrfAttempts = [
    { name: 'Loopback 127.0.0.1', url: 'https://127.0.0.1:8080/send' },
    { name: 'Localhost', url: 'https://localhost/api' },
    { name: 'Metadados AWS/GCP (169.254.169.254)', url: 'https://169.254.169.254/latest/meta-data/' },
    { name: 'Metadados Google Internal', url: 'https://metadata.google.internal/computeMetadata/v1/' },
    { name: 'Protocolo inseguro HTTP', url: 'http://api.whatsapp-gateway.com/send' }
  ];

  let allBlocked = true;
  for (const attempt of ssrfAttempts) {
    const ssrfRes = await api('/api/send-whatsapp', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TEST_ADMIN_SECRET}` },
      body: {
        to: '11999998888',
        message: 'Teste SSRF',
        gatewayUrl: attempt.url
      }
    });
    const blocked = ssrfRes.status === 400 && String(ssrfRes.data?.error || '').includes('SSRF');
    if (!blocked) {
      allBlocked = false;
      console.error(`     Falha ao bloquear SSRF para: ${attempt.name} (Status: ${ssrfRes.status})`);
    }
  }
  assertTest(
    6,
    'SSRF: Rejeição rigorosa de destinos internos, loopback, metadados e esquemas não-HTTPS',
    allBlocked,
    'Todos os 5 vetores rejeitados com HTTP 400',
    allBlocked ? '5 de 5 vetores maliciosos bloqueados' : 'Alguns vetores não foram bloqueados'
  );

  // -------------------------------------------------------------
  // ITEM 7: Duas reservas simultâneas: apenas uma confirmada
  // -------------------------------------------------------------
  console.log('\n--- ITEM 7: Duas reservas simultâneas: apenas uma confirmada ---');
  const raceDays = Math.floor(Math.random() * 500) + 600;
  const raceDateObj = new Date(Date.now() + raceDays * 86400000);
  const raceDate = raceDateObj.toISOString().split('T')[0];
  const raceTime = '16:00';

  const userA = {
    id: `race-user-a-${runId}`,
    clientName: 'Cliente Concorrente A',
    clientEmail: 'cliente.a@exemplo.com',
    clientPhone: '(11) 91111-1111',
    date: raceDate,
    time: raceTime,
    topic: 'Assunto A',
    confidentialityAccepted: true
  };

  const userB = {
    id: `race-user-b-${runId}`,
    clientName: 'Cliente Concorrente B',
    clientEmail: 'cliente.b@exemplo.com',
    clientPhone: '(11) 92222-2222',
    date: raceDate,
    time: raceTime,
    topic: 'Assunto B',
    confidentialityAccepted: true
  };

  // Disparo exatamente paralelo
  const [resA, resB] = await Promise.all([
    api('/api/appointments', { method: 'POST', body: userA }),
    api('/api/appointments', { method: 'POST', body: userB })
  ]);

  const statuses = [resA.status, resB.status].sort();
  const exactlyOneConfirmed = statuses[0] === 201 && statuses[1] === 409;
  assertTest(
    7,
    'Concorrência atômica: exatamente uma reserva confirmada (201) e a conflitante rejeitada (409)',
    exactlyOneConfirmed,
    'Um 201 (Created) e um 409 (Conflict)',
    `Status obtidos: UserA=${resA.status}, UserB=${resB.status}`
  );

  // -------------------------------------------------------------
  // ITEM 8: Reagendamento legítimo
  // -------------------------------------------------------------
  console.log('\n--- ITEM 8: Reagendamento legítimo ---');
  const reschDays = Math.floor(Math.random() * 500) + 1200;
  const newReschDateObj = new Date(Date.now() + reschDays * 86400000);
  const newReschDate = newReschDateObj.toISOString().split('T')[0];
  const newReschTime = '10:00';

  const reschRes = await api('/api/appointments/reschedule-notification', {
    method: 'POST',
    body: {
      appointmentId: apptId,
      newDate: newReschDate,
      newTime: newReschTime,
      manageToken: validToken
    }
  });

  // Verificar se o horário antigo foi liberado no /api/booked-slots
  const bookedAfterResch = await api('/api/booked-slots', { method: 'GET' });
  const oldSlotStillTaken = (bookedAfterResch.data?.bookedSlots || []).some(
    (s: any) => s.date === testDate && s.time === '14:00'
  );
  const newSlotNowTaken = (bookedAfterResch.data?.bookedSlots || []).some(
    (s: any) => s.date === newReschDate && s.time === newReschTime
  );

  const reschValid =
    reschRes.status === 200 &&
    reschRes.data?.persisted === true &&
    !oldSlotStillTaken &&
    newSlotNowTaken;

  assertTest(
    8,
    'Reagendamento legítimo: status 200, novo horário reservado e horário antigo liberado',
    reschValid,
    'HTTP 200 / antigo liberado / novo reservado',
    `HTTP ${reschRes.status} / oldTaken: ${oldSlotStillTaken} / newTaken: ${newSlotNowTaken}`
  );

  // -------------------------------------------------------------
  // ITEM 9: Cancelamento legítimo
  // -------------------------------------------------------------
  console.log('\n--- ITEM 9: Cancelamento legítimo ---');
  const cancelRes = await api('/api/appointments/cancel-notification', {
    method: 'POST',
    body: {
      appointmentId: apptId,
      manageToken: validToken
    }
  });

  const bookedAfterCancel = await api('/api/booked-slots', { method: 'GET' });
  const reschSlotStillTaken = (bookedAfterCancel.data?.bookedSlots || []).some(
    (s: any) => s.date === newReschDate && s.time === newReschTime
  );

  const cancelValid =
    cancelRes.status === 200 &&
    cancelRes.data?.persisted === true &&
    cancelRes.data?.appointment?.status === 'cancelled' &&
    !reschSlotStillTaken;

  assertTest(
    9,
    'Cancelamento legítimo: status 200, status=cancelled e horário liberado na agenda',
    cancelValid,
    'HTTP 200 / status: cancelled / slot liberado',
    `HTTP ${cancelRes.status} / status: ${cancelRes.data?.appointment?.status} / slotTaken: ${reschSlotStillTaken}`
  );

  // -------------------------------------------------------------
  // ITEM 10: Consulta pública de horários sem dados pessoais
  // -------------------------------------------------------------
  console.log('\n--- ITEM 10: Consulta pública de horários sem dados pessoais ---');
  const bookedCheck = await api('/api/booked-slots', { method: 'GET' });
  const slots: any[] = bookedCheck.data?.bookedSlots || [];
  let leakedPII = false;
  for (const slot of slots) {
    if (slot.clientName || slot.clientEmail || slot.clientPhone || slot.manageToken || slot.id) {
      leakedPII = true;
      break;
    }
    const keys = Object.keys(slot).sort();
    if (keys.join(',') !== 'date,time') {
      leakedPII = true;
      break;
    }
  }

  assertTest(
    10,
    'Consulta pública /api/booked-slots estritamente sem dados pessoais (Zero PII e Zero Tokens)',
    bookedCheck.status === 200 && !leakedPII && slots.length >= 0,
    'HTTP 200 / apenas chaves date e time em cada item',
    `HTTP ${bookedCheck.status} / PII vazada: ${leakedPII}`
  );

  // -------------------------------------------------------------
  // ITEM 11: Formulário de contato
  // -------------------------------------------------------------
  console.log('\n--- ITEM 11: Formulário de contato (/api/demands) ---');
  const demandValid = await api('/api/demands', {
    method: 'POST',
    body: {
      demand: {
        id: `dem-test-${runId}`,
        name: 'Carlos Oliveira',
        email: 'carlos.oliveira@empresa.com.br',
        phone: '(11) 98765-4321',
        serviceCategory: 'consultoria',
        message: 'Gostaria de agendar uma reunião de diagnóstico.'
      }
    }
  });

  const demandInvalid = await api('/api/demands', {
    method: 'POST',
    body: {
      demand: {
        name: 'Incompleto'
      }
    }
  });

  const demandOk =
    demandValid.status === 201 &&
    demandValid.data?.success === true &&
    demandInvalid.status === 400;

  assertTest(
    11,
    'Formulário de contato: criação de demanda sanitizada (201) e rejeição de dados incompletos (400)',
    demandOk,
    'Válido: 201 / Inválido: 400',
    `Válido: ${demandValid.status} / Inválido: ${demandInvalid.status}`
  );

  // -------------------------------------------------------------
  // ITEM 12: Preservação do login administrativo
  // -------------------------------------------------------------
  console.log('\n--- ITEM 12: Preservação do login administrativo ---');
  // 12a. Sem token ou com token inválido em rota administrativa: rejeitado com 401/403
  const adminUnauth = await api('/api/appointments', {
    method: 'GET',
    headers: { Authorization: 'Bearer token-invalido-invasor' }
  });

  // 12b. Com credencial administrativa válida: listagem completa concedida com 200
  const adminAuth = await api('/api/appointments', {
    method: 'GET',
    headers: { Authorization: `Bearer ${TEST_ADMIN_SECRET}` }
  });

  const adminPreserved =
    (adminUnauth.status === 401 || adminUnauth.status === 403) &&
    adminAuth.status === 200 &&
    Array.isArray(adminAuth.data?.appointments);

  assertTest(
    12,
    'Preservação do acesso administrativo: token inválido bloqueado (401/403) e admin legítimo autorizado (200)',
    adminPreserved,
    'Invasor: 401/403 / Admin: 200',
    `Invasor: ${adminUnauth.status} / Admin: ${adminAuth.status}`
  );

  // -------------------------------------------------------------
  // RESUMO FINAL
  // -------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n============================================================');
  console.log(`TOTAL DE TESTES OBRIGATÓRIOS: ${total} | APROVADOS: ${passed} | FALHAS: ${failed}`);
  if (failed === 0) {
    console.log('RESULTADO FINAL: ✅ TODOS OS 12 REQUISITOS OBRIGATÓRIOS PASSARAM COM SUCESSO');
  } else {
    console.error(`RESULTADO FINAL: ❌ HOUVE ${failed} FALHA(S) NOS TESTES.`);
  }
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFase02A2Tests().catch((err) => {
  console.error('Erro inesperado durante a execução dos testes:', err);
  process.exit(1);
});
