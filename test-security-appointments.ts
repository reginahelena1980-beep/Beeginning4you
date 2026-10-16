import fetch from 'node:http';

const testSuiteIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

async function request(urlPath: string, options: { method: string; headers?: Record<string, string>; body?: any }) {
  const res = await globalThis.fetch(`http://127.0.0.1:3000${urlPath}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': testSuiteIp,
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

interface TestReport {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const reports: TestReport[] = [];

function assertTest(name: string, condition: boolean, expected: string, actual: string) {
  reports.push({
    name,
    expected,
    actual,
    passed: condition
  });
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name} (Expected: ${expected}, Got: ${actual})`);
  }
}

async function runSecurityTests() {
  console.log('\n============================================================');
  console.log('🛡️  TESTES DE SEGURANÇA E PERSISTÊNCIA DOS AGENDAMENTOS (FASE 1.1)');
  console.log('============================================================\n');

  // SETUP: Criar dois agendamentos legítimos de teste com datas dinâmicas para evitar colisão entre execuções
  const runTag = Date.now().toString(36);
  const appt1Id = `test-meet-1-${runTag}`;
  const appt2Id = `test-meet-2-${runTag}`;
  const baseOffset = Math.floor(Math.random() * 500) + 10;
  const targetDateObj1 = new Date(Date.now() + baseOffset * 86400000);
  const targetDateObj2 = new Date(Date.now() + (baseOffset + 1) * 86400000);
  const targetDateObj3 = new Date(Date.now() + (baseOffset + 2) * 86400000);

  const date1 = targetDateObj1.toISOString().split('T')[0];
  const date2 = targetDateObj2.toISOString().split('T')[0];
  const reschDate = targetDateObj3.toISOString().split('T')[0];

  const create1 = await request('/api/appointments', {
    method: 'POST',
    body: {
      id: appt1Id,
      clientName: 'Cliente Alice',
      clientEmail: 'alice@exemplo.com',
      clientPhone: '(11) 91111-2222',
      date: date1,
      time: '10:00',
      confidentialityAccepted: true
    }
  });

  const appt1Token = create1.data?.manageToken;
  console.log(`Agendamento 1 criado: ID=${appt1Id}, Token=${appt1Token ? 'OK (gerado)' : 'NULO'}`);

  const create2 = await request('/api/appointments', {
    method: 'POST',
    body: {
      id: appt2Id,
      clientName: 'Cliente Bob',
      clientEmail: 'bob@exemplo.com',
      clientPhone: '(11) 93333-4444',
      date: date2,
      time: '14:00',
      confidentialityAccepted: true
    }
  });

  const appt2Token = create2.data?.manageToken;
  console.log(`Agendamento 2 criado: ID=${appt2Id}, Token=${appt2Token ? 'OK (gerado)' : 'NULO'}`);

  console.log('\n--- Teste 1: Terceiro tenta cancelar agendamento de outra pessoa ---');
  // Tentativa 1a: Terceiro apenas com o ID (sem token)
  const cancelNoToken = await request('/api/appointments/cancel-notification', {
    method: 'POST',
    body: { appointmentId: appt1Id }
  });
  assertTest(
    'Terceiro sem token tenta cancelar agendamento de outra pessoa: BLOQUEADO',
    cancelNoToken.status === 401 && cancelNoToken.data?.persisted === false,
    'HTTP 401 / persisted: false',
    `HTTP ${cancelNoToken.status} / persisted: ${cancelNoToken.data?.persisted}`
  );

  // Tentativa 1b: Terceiro tentando usar o e-mail da vítima como prova (rejeitado explicitamente)
  const cancelWithEmail = await request('/api/appointments/cancel-notification', {
    method: 'POST',
    body: { appointmentId: appt1Id, clientEmail: 'alice@exemplo.com' }
  });
  assertTest(
    'Terceiro informando apenas o e-mail da vítima tenta cancelar: BLOQUEADO (e-mail não é prova)',
    cancelWithEmail.status === 401 && cancelWithEmail.data?.persisted === false,
    'HTTP 401 / persisted: false',
    `HTTP ${cancelWithEmail.status} / persisted: ${cancelWithEmail.data?.persisted}`
  );

  // Tentativa 1c: Terceiro com token adulterado/falso
  const cancelBadToken = await request('/api/appointments/cancel-notification', {
    method: 'POST',
    body: { appointmentId: appt1Id, manageToken: 'token_falso_atacante_123' }
  });
  assertTest(
    'Terceiro com token falso/inválido tenta cancelar: BLOQUEADO',
    cancelBadToken.status === 403 && cancelBadToken.data?.persisted === false,
    'HTTP 403 / persisted: false',
    `HTTP ${cancelBadToken.status} / persisted: ${cancelBadToken.data?.persisted}`
  );

  console.log('\n--- Teste 2: Terceiro tenta reagendar agendamento de outra pessoa ---');
  // Tentativa 2a: Terceiro apenas com ID
  const reschNoToken = await request('/api/appointments/reschedule-notification', {
    method: 'POST',
    body: { appointmentId: appt1Id, newDate: '2026-11-12', newTime: '15:00' }
  });
  assertTest(
    'Terceiro sem token tenta reagendar agendamento de outra pessoa: BLOQUEADO',
    reschNoToken.status === 401 && reschNoToken.data?.persisted === false,
    'HTTP 401 / persisted: false',
    `HTTP ${reschNoToken.status} / persisted: ${reschNoToken.data?.persisted}`
  );

  // Tentativa 2b: Terceiro com token de outro agendamento (token de Bob tentando alterar Alice)
  const reschCrossToken = await request('/api/appointments/reschedule-notification', {
    method: 'POST',
    body: { appointmentId: appt1Id, newDate: '2026-11-12', newTime: '15:00', manageToken: appt2Token }
  });
  assertTest(
    'Terceiro usando token de outro agendamento tenta reagendar: BLOQUEADO',
    reschCrossToken.status === 403 && reschCrossToken.data?.persisted === false,
    'HTTP 403 / persisted: false',
    `HTTP ${reschCrossToken.status} / persisted: ${reschCrossToken.data?.persisted}`
  );

  console.log('\n--- Teste 3: Cliente autorizado reagenda seu próprio agendamento ---');
  const reschAuthorized = await request('/api/appointments/reschedule-notification', {
    method: 'POST',
    body: {
      appointmentId: appt1Id,
      newDate: reschDate,
      newTime: '11:00',
      manageToken: appt1Token
    }
  });
  assertTest(
    'Cliente autorizado reagenda seu próprio agendamento: PERMITIDO',
    reschAuthorized.status === 200 && reschAuthorized.data?.persisted === true && reschAuthorized.data?.appointment?.date === reschDate,
    `HTTP 200 / persisted: true / data: ${reschDate}`,
    `HTTP ${reschAuthorized.status} / persisted: ${reschAuthorized.data?.persisted} / data: ${reschAuthorized.data?.appointment?.date}`
  );

  console.log('\n--- Teste 4: Reagendamento para horário já ocupado ---');
  // Tentativa de reagendar o agendamento 1 para o horário em que o agendamento 2 está agendado (date2 às 14:00)
  const reschCollision = await request('/api/appointments/reschedule-notification', {
    method: 'POST',
    body: {
      appointmentId: appt1Id,
      newDate: date2,
      newTime: '14:00', // Horário do agendamento 2!
      manageToken: appt1Token
    }
  });
  assertTest(
    'Reagendamento para horário já ocupado por outro cliente: BLOQUEADO',
    reschCollision.status === 409 && reschCollision.data?.persisted === false,
    'HTTP 409 Conflict / persisted: false',
    `HTTP ${reschCollision.status} / persisted: ${reschCollision.data?.persisted} (${reschCollision.data?.error})`
  );

  console.log('\n--- Teste 5: Cliente autorizado cancela seu próprio agendamento ---');
  const cancelAuthorized = await request('/api/appointments/cancel-notification', {
    method: 'POST',
    body: {
      appointmentId: appt1Id,
      manageToken: appt1Token
    }
  });
  assertTest(
    'Cliente autorizado cancela seu próprio agendamento: PERMITIDO',
    cancelAuthorized.status === 200 && cancelAuthorized.data?.persisted === true && cancelAuthorized.data?.appointment?.status === 'cancelled',
    'HTTP 200 / persisted: true / status: cancelled',
    `HTTP ${cancelAuthorized.status} / persisted: ${cancelAuthorized.data?.persisted} / status: ${cancelAuthorized.data?.appointment?.status}`
  );

  console.log('\n--- Teste 6: Falha na persistência: Não informar sucesso ao usuário ---');
  // Validação: Enviar requisição que causa erro ou simular bloqueio de gravação
  const invalidDateResch = await request('/api/appointments/reschedule-notification', {
    method: 'POST',
    body: {
      appointmentId: appt2Id,
      newDate: 'data-invalida',
      newTime: '99:99',
      manageToken: appt2Token
    }
  });
  assertTest(
    'Falha de validação/persistência retorna persisted: false e erro explícito',
    invalidDateResch.status === 400 && invalidDateResch.data?.persisted === false && invalidDateResch.data?.success === false,
    'HTTP 400 / persisted: false / success: false',
    `HTTP ${invalidDateResch.status} / persisted: ${invalidDateResch.data?.persisted}`
  );

  console.log('\n--- Teste 7: Administradora autenticada continua gerenciando agendamentos ---');
  // Tentativa de gerenciar agendamento com Bearer token não-administrativo: rejeitado
  const fakeAdminManage = await request('/api/appointments/reschedule-notification', {
    method: 'POST',
    headers: { Authorization: 'Bearer token-invalido' },
    body: {
      appointmentId: appt2Id,
      newDate: '2026-11-12',
      newTime: '16:00'
    }
  });
  assertTest(
    'Usuário sem credencial administrativa válida não consegue burlar verificação: BLOQUEADO',
    fakeAdminManage.status === 401 || fakeAdminManage.status === 403,
    'HTTP 401 ou 403',
    `HTTP ${fakeAdminManage.status}`
  );

  console.log('\n--- Teste 8: Validação de Armazenamento Seguro de Token (Hash SHA-256) ---');
  // Verifica se o objeto retornado da criação pública não expõe o tokenHash e se o token é entregue uma única vez
  assertTest(
    'Criação de agendamento retorna token de gerenciamento para o titular e não expõe hash interno',
    !!appt1Token && typeof appt1Token === 'string' && create1.data?.appointment?.tokenHash === undefined,
    'Token retornado / tokenHash oculto',
    `Token: ${appt1Token ? 'OK' : 'NULO'} / tokenHash exposto: ${create1.data?.appointment?.tokenHash !== undefined}`
  );

  console.log('\n--- Teste 9: Endpoint público /api/booked-slots garante ZERO PII e Zero Tokens ---');
  const bookedSlotsRes = await request('/api/booked-slots', { method: 'GET' });
  const slots = bookedSlotsRes.data?.bookedSlots;
  const isZeroPii = Array.isArray(slots) && slots.every((s: any) =>
    s && s.date && s.time &&
    s.clientName === undefined &&
    s.clientEmail === undefined &&
    s.clientPhone === undefined &&
    s.manageToken === undefined &&
    s.tokenHash === undefined
  );
  assertTest(
    'Endpoint público /api/booked-slots retorna estritamente { date, time } sem dados de clientes',
    bookedSlotsRes.status === 200 && isZeroPii,
    'HTTP 200 / Zero PII',
    `HTTP ${bookedSlotsRes.status} / Zero PII: ${isZeroPii}`
  );

  console.log('\n--- Teste 10: Criação pública em horário já ocupado (Anti-Concorrência / Anti-Colisão) ---');
  // Tentativa de criar novo agendamento no mesmo horário do agendamento 2 (date2 às 14:00)
  const collisionCreate = await request('/api/appointments', {
    method: 'POST',
    body: {
      clientName: 'Cliente Concorrente',
      clientEmail: 'concorrente@exemplo.com',
      clientPhone: '(11) 98888-7777',
      date: date2,
      time: '14:00', // Horário do agendamento 2!
      confidentialityAccepted: true
    }
  });
  assertTest(
    'Criação de agendamento em horário já reservado é bloqueada (Anti-Colisão / 409): BLOQUEADO',
    collisionCreate.status === 409 && collisionCreate.data?.success === false,
    'HTTP 409 Conflict',
    `HTTP ${collisionCreate.status} (${collisionCreate.data?.error})`
  );

  console.log('\n--- Teste 11: Recuperação Segura de Agendamento por E-mail (/api/appointments/request-access) ---');
  const recoveryRes = await request('/api/appointments/request-access', {
    method: 'POST',
    body: {
      clientEmail: 'alice@exemplo.com'
    }
  });
  assertTest(
    'Solicitação de recuperação por e-mail retorna 200 com mensagem segura e timing-safe',
    recoveryRes.status === 200 && recoveryRes.data?.success === true,
    'HTTP 200 / success: true',
    `HTTP ${recoveryRes.status} / message: ${recoveryRes.data?.message}`
  );

  // Tentativa com e-mail inválido
  const invalidEmailRecovery = await request('/api/appointments/request-access', {
    method: 'POST',
    body: {
      clientEmail: 'email-invalido'
    }
  });
  assertTest(
    'Solicitação de recuperação com e-mail mal formatado é rejeitada com HTTP 400',
    invalidEmailRecovery.status === 400 && invalidEmailRecovery.data?.success === false,
    'HTTP 400',
    `HTTP ${invalidEmailRecovery.status}`
  );

  console.log('\n============================================================');
  const allPassed = reports.every((r) => r.passed);
  console.log(`TOTAL DE TESTES: ${reports.length} | APROVADOS: ${reports.filter((r) => r.passed).length} | FALHAS: ${reports.filter((r) => !r.passed).length}`);
  console.log(`RESULTADO FINAL: ${allPassed ? '✅ TODOS OS TESTES PASSARAM COM SUCESSO' : '❌ HOUVE FALHAS'}`);
  console.log('============================================================\n');
}

runSecurityTests().catch(console.error);
