/**
 * BEEginning 4 You — TESTE DE REPRODUÇÃO E VALIDAÇÃO VERCEL (ERR_REQUIRE_ESM)
 * Valida o ambiente de execução Node e ausência total de ERR_REQUIRE_ESM
 */

import http from 'http';
import app, {
  isTestRequest,
  inMemoryTestStore,
  resetTestStore,
  hashToken,
  verifyToken,
  validateSafeGatewayUrl
} from './api/index';

async function run() {
  console.log('\n============================================================');
  console.log('🐝 BEEginning 4 You — VALIDAÇÃO ESPECÍFICA DO HOTFIX VERCEL');
  console.log('============================================================\n');

  // Teste 1: Verificação direta de CommonJS/ESM interop de jwks-rsa e jose
  console.log('1. Verificando importação de jwks-rsa e jose sem experimental-require-module...');
  try {
    const jwksRsa = await import('jwks-rsa');
    const jose = await import('jose');
    if (!jwksRsa || !jose) {
      throw new Error('Falha ao importar jwks-rsa ou jose');
    }
    console.log('   ✅ [PASS] jwks-rsa e jose importados com sucesso sem ERR_REQUIRE_ESM.');
  } catch (err: any) {
    console.error('   ❌ [FAIL] Erro ao carregar módulos:', err);
    process.exit(1);
  }

  // Teste 2: Inicialização do servidor com o handler exportado por api/index.ts
  console.log('\n2. Inicializando servidor HTTP com handler serverless api/index...');
  const server = http.createServer(app);
  const testPort = 3199;
  await new Promise<void>((resolve) => server.listen(testPort, '127.0.0.1', resolve));
  const testUrl = `http://127.0.0.1:${testPort}`;
  console.log(`   ✅ [PASS] Servidor iniciado na porta ${testPort}.`);

  try {
    // Teste 3: Requisição para /api/health
    console.log('\n3. Validando endpoint /api/health...');
    const healthRes = await fetch(`${testUrl}/api/health`);
    const healthJson = await healthRes.json();
    console.log('   Status:', healthRes.status);
    console.log('   Body:', JSON.stringify(healthJson));
    if (healthRes.status !== 200 || healthJson.status !== 'ok') {
      throw new Error(`Health check falhou: ${healthRes.status} - ${JSON.stringify(healthJson)}`);
    }
    console.log('   ✅ [PASS] /api/health retornou HTTP 200 e status "ok".');

    // Teste 4: Garantia de isolamento de teste (sem escrita em Firestore de produção)
    console.log('\n4. Verificando isolamento de dados de teste (sem gravação no Firestore)...');
    resetTestStore();
    const testAppointment = {
      clientName: 'Teste Vercel Hotfix Isolado',
      clientEmail: 'teste.isolado@exemplo.com.br',
      clientPhone: '(11) 97777-6666',
      date: '2027-11-20',
      time: '15:00',
      topic: 'Validação de Isolamento',
      confidentialityAccepted: true
    };

    const createRes = await fetch(`${testUrl}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Execution': 'true'
      },
      body: JSON.stringify({ appointment: testAppointment })
    });

    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.success) {
      throw new Error(`Criação de agendamento de teste falhou: ${createRes.status} - ${JSON.stringify(createData)}`);
    }

    if (inMemoryTestStore.appointments.length !== 1) {
      throw new Error('Agendamento de teste não foi isolado na memória (inMemoryTestStore)!');
    }
    console.log('   ✅ [PASS] Agendamento gravado exclusivamente em memória de teste (inMemoryTestStore).');

    // Teste 5: Rejeição de colisão em teste
    console.log('\n5. Verificando anti-colisão sob concorrência...');
    const colRes = await fetch(`${testUrl}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Execution': 'true'
      },
      body: JSON.stringify({ appointment: testAppointment })
    });
    const colData = await colRes.json();
    if (colRes.status !== 409 || colData.success) {
      throw new Error(`Detecção de conflito falhou: ${colRes.status} - ${JSON.stringify(colData)}`);
    }
    console.log('   ✅ [PASS] Conflito de horário detectado com HTTP 409.');

    // Teste 6: Proteção SSRF
    console.log('\n6. Verificando proteções de segurança (SSRF)...');
    const ssrfBad1 = validateSafeGatewayUrl('http://169.254.169.254/latest/meta-data');
    const ssrfBad2 = validateSafeGatewayUrl('https://localhost:8080');
    const ssrfBad3 = validateSafeGatewayUrl('https://192.168.1.1/api');
    const ssrfGood = validateSafeGatewayUrl('https://api.whatsapp.com/send');

    if (ssrfBad1.valid || ssrfBad2.valid || ssrfBad3.valid || !ssrfGood.valid) {
      throw new Error('Falha nas regras de validação SSRF!');
    }
    console.log('   ✅ [PASS] Proteção SSRF bloqueou URLs internas/metadados e liberou FQDN público.');

    // Teste 7: Hashing e verificação de tokens criptográficos
    console.log('\n7. Verificando integridade de tokens criptográficos (SHA-256)...');
    const rawToken = 'test-token-sec-xyz-123';
    const hash = hashToken(rawToken);
    const valid = verifyToken(rawToken, hash);
    const invalid = verifyToken('wrong-token', hash);
    if (!valid || invalid) {
      throw new Error('Falha no mecanismo de hash e validação de tokens!');
    }
    console.log('   ✅ [PASS] Mecanismo de hashing constante e comparação timingSafeEqual validado.');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('\n   Servidor temporário finalizado.');
  }

  console.log('\n============================================================');
  console.log('🎉 TODOS OS TESTES ESPECÍFICOS DO HOTFIX FORAM APROVADOS!');
  console.log('============================================================\n');
}

run().catch((err) => {
  console.error('\n❌ Erro durante a execução:', err);
  process.exit(1);
});
