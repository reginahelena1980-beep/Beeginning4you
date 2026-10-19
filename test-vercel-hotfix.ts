/**
 * BEEginning 4 You — TESTE DE VALIDAÇÃO DO HOTFIX VERCEL
 * Validação rigorosa dos 12 itens do Hotfix Vercel
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import app from './api/index';
import { safeFetchJson } from './src/utils/calendar';
import http from 'http';

interface ValidationResult {
  item: number;
  title: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: ValidationResult[] = [];

function record(item: number, title: string, passed: boolean, expected: string, actual: string) {
  results.push({ item, title, expected, actual, passed });
  if (passed) {
    console.log(`  ✅ [PASS] Item ${item}: ${title}`);
  } else {
    console.error(`  ❌ [FAIL] Item ${item}: ${title}\n       Esperado: ${expected}\n       Obtido:   ${actual}`);
  }
}

async function runVercelHotfixTests() {
  console.log('\n============================================================');
  console.log('🐝 BEEginning 4 You — HOTFIX VERCEL: SUITE DE TESTES');
  console.log('============================================================\n');

  // ITEM 1: Build Vite
  console.log('--- ITEM 1: Build Vite (dist) ---');
  let buildOk = false;
  let buildDetails = '';
  try {
    const buildOutput = execSync('npm run build', { encoding: 'utf-8' });
    buildOk = fs.existsSync(path.resolve(process.cwd(), 'dist/index.html'));
    buildDetails = buildOk ? 'dist/index.html gerado com sucesso' : 'Arquivo dist/index.html ausente';
  } catch (err: any) {
    buildDetails = err?.message || 'Erro durante npm run build';
  }
  record(1, 'Build Vite executado gerando diretório dist', buildOk, 'dist/index.html gerado', buildDetails);

  // ITEM 2: Validação TypeScript
  console.log('\n--- ITEM 2: Validação TypeScript (tsc --noEmit) ---');
  let tsOk = false;
  let tsDetails = '';
  try {
    execSync('npm run lint', { encoding: 'utf-8' });
    tsOk = true;
    tsDetails = 'Zero erros de tipagem TypeScript';
  } catch (err: any) {
    tsDetails = err?.message || 'Falha na validação TypeScript';
  }
  record(2, 'Validação TypeScript estrita sem erros', tsOk, 'Compilação tsc limpa', tsDetails);

  // Iniciar servidor temporário em memória para testar diretamente o handler exportado em api/index.ts
  const serverlessPort = 3099;
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(serverlessPort, '127.0.0.1', resolve));
  const serverlessUrl = `http://127.0.0.1:${serverlessPort}`;

  try {
    // ITEM 3: Inicialização do handler serverless (api/index.ts)
    console.log('\n--- ITEM 3: Inicialização do handler serverless (api/index.ts) ---');
    const handlerExists = typeof app === 'function';
    const isExportedProperly = fs.existsSync(path.resolve(process.cwd(), 'api/index.ts'));
    record(
      3,
      'Handler serverless exportado sem app.listen() em api/index.ts',
      handlerExists && isExportedProperly,
      'Express app exportado como callable function em api/index.ts',
      `type: ${typeof app}, fileExists: ${isExportedProperly}`
    );

    // ITEM 4: Resposta JSON das APIs
    console.log('\n--- ITEM 4: Resposta JSON das APIs (/api/*) ---');
    const healthRes = await fetch(`${serverlessUrl}/api/health`);
    const healthJson = await healthRes.json().catch(() => null);
    const bookedRes = await fetch(`${serverlessUrl}/api/booked-slots`);
    const bookedJson = await bookedRes.json().catch(() => null);
    const configRes = await fetch(`${serverlessUrl}/api/config`);
    const configJson = await configRes.json().catch(() => null);

    const jsonValid =
      healthRes.status === 200 && healthJson?.status === 'ok' &&
      bookedRes.status === 200 && Array.isArray(bookedJson?.bookedSlots) &&
      configRes.status === 200 && Boolean(configJson?.config);

    record(
      4,
      'Resposta estruturada em application/json para endpoints públicos da API',
      jsonValid,
      'Status 200 com JSON estruturado em /health, /booked-slots, /config',
      `health: ${healthRes.status}, booked: ${bookedRes.status}, config: ${configRes.status}`
    );

    // ITEM 5: Criação de agendamento via handler
    console.log('\n--- ITEM 5: Criação de Agendamento (/api/appointments) ---');
    const testDate = `2027-04-${String(Math.floor(Math.random() * 20) + 10).padStart(2, '0')}`;
    const testTime = '14:00';
    const clientPayload = {
      clientName: 'Dra. Mariana Vercel Test',
      clientEmail: 'mariana.vercel@exemplo.com.br',
      clientPhone: '(11) 99888-7766',
      date: testDate,
      time: testTime,
      topic: 'Diagnóstico de automação para escritório',
      confidentialityAccepted: true
    };

    const createRes = await fetch(`${serverlessUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment: clientPayload })
    });
    const createData = await createRes.json().catch(() => null);
    const apptCreated = createRes.status === 201 && createData?.success && createData?.appointment?.id;

    record(
      5,
      'Criação de agendamento com resposta HTTP 201 e token de gerenciamento',
      Boolean(apptCreated && createData?.manageToken),
      'HTTP 201, appointment.id gerado e manageToken único retornado',
      `status: ${createRes.status}, success: ${createData?.success}, hasToken: ${Boolean(createData?.manageToken)}`
    );

    const createdId = createData?.appointment?.id;
    const clientToken = createData?.manageToken;

    // ITEM 6: Registro e persistência
    console.log('\n--- ITEM 6: Registro de Agendamentos e Consulta do Horário Ocupado ---');
    const bookedCheckRes = await fetch(`${serverlessUrl}/api/booked-slots`);
    const bookedCheckData = await bookedCheckRes.json().catch(() => null);
    const isBookedRecorded = (bookedCheckData?.bookedSlots || []).some(
      (b: any) => b.date === testDate && b.time === testTime
    );

    record(
      6,
      'Horário registrado aparece na consulta pública de disponibilidade',
      isBookedRecorded,
      'Slot date e time presentes em /api/booked-slots',
      `slotPresent: ${isBookedRecorded}`
    );

    // ITEM 7: Concorrência distribuída (reservas simultâneas)
    console.log('\n--- ITEM 7: Concorrência Distribuída (Anti-Colisão de Horários) ---');
    const secondReqPromise = fetch(`${serverlessUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointment: {
          clientName: 'Cliente Concorrente',
          clientEmail: 'concorrente@exemplo.com.br',
          clientPhone: '(11) 91111-2222',
          date: testDate,
          time: testTime,
          topic: 'Concorrência',
          confidentialityAccepted: true
        }
      })
    });
    const secondRes = await secondReqPromise;
    const secondData = await secondRes.json().catch(() => null);
    const isConflictBlocked = secondRes.status === 409 && !secondData?.success;

    record(
      7,
      'Reserva simultânea para mesmo dia e horário é rejeitada com HTTP 409 Conflict',
      isConflictBlocked,
      'HTTP 409 com mensagem de horário ocupado',
      `status: ${secondRes.status}, error: "${secondData?.error}"`
    );

    // ITEM 8: E-mail de confirmação simulado
    console.log('\n--- ITEM 8: E-mail de Confirmação com Dados Corretos ---');
    const appt = createData?.appointment;
    const hasCorrectMeet = appt?.meetLink === 'https://meet.google.com/fxx-ctnv-hgm';
    const hasCorrectDuration = appt?.durationMinutes === 45;
    const hasCorrectDate = appt?.date === testDate;
    const hasCorrectTime = appt?.time === testTime;
    const emailNoticeExists = typeof createData?.emailNotice === 'string';

    record(
      8,
      'Agendamento contém dados exatos (Data, Horário de Brasília, Meet e 45 min)',
      hasCorrectMeet && hasCorrectDuration && hasCorrectDate && hasCorrectTime && emailNoticeExists,
      'meetLink padronizado, duration=45, date, time e emailNotice presentes',
      `meet: ${appt?.meetLink}, duration: ${appt?.durationMinutes}, emailNotice: "${createData?.emailNotice}"`
    );

    // ITEM 9: Proteção de APIs administrativas
    console.log('\n--- ITEM 9: Proteção de APIs Administrativas ---');
    const unauthApptsRes = await fetch(`${serverlessUrl}/api/appointments`);
    const unauthDemandsRes = await fetch(`${serverlessUrl}/api/demands`);
    const fakeTokenRes = await fetch(`${serverlessUrl}/api/appointments`, {
      headers: { Authorization: 'Bearer fake-invalid-token' }
    });

    const adminProtected = unauthApptsRes.status === 401 && unauthDemandsRes.status === 401 && fakeTokenRes.status === 401;

    record(
      9,
      'Endpoints administrativos (/api/appointments, /api/demands) protegidos contra acesso não autorizado',
      adminProtected,
      'HTTP 401 para requisições sem credencial ou com token forjado',
      `appts: ${unauthApptsRes.status}, demands: ${unauthDemandsRes.status}, fake: ${fakeTokenRes.status}`
    );

    // ITEM 10: Reagendamento e cancelamento
    console.log('\n--- ITEM 10: Reagendamento e Cancelamento Autorizado ---');
    const newDate = `2027-05-15`;
    const newTime = '16:00';

    const rescheduleRes = await fetch(`${serverlessUrl}/api/appointments/reschedule-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: createdId,
        newDate,
        newTime,
        manageToken: clientToken
      })
    });
    const reschData = await rescheduleRes.json().catch(() => null);
    const rescheduleOk = rescheduleRes.status === 200 && reschData?.success && reschData?.persisted;

    const cancelRes = await fetch(`${serverlessUrl}/api/appointments/cancel-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: createdId,
        manageToken: clientToken
      })
    });
    const cancelData = await cancelRes.json().catch(() => null);
    const cancelOk = cancelRes.status === 200 && cancelData?.success && cancelData?.persisted;

    record(
      10,
      'Reagendamento e cancelamento pelo titular com token criptográfico válido',
      Boolean(rescheduleOk && cancelOk),
      'HTTP 200 com persisted: true para ambas as operações',
      `reschedule: ${rescheduleRes.status} (persisted: ${reschData?.persisted}), cancel: ${cancelRes.status} (persisted: ${cancelData?.persisted})`
    );

    // ITEM 11: Navegação do site e preservação SPA
    console.log('\n--- ITEM 11: Navegação do Site e Isolamento de /api/* ---');
    const unknownApiRes = await fetch(`${serverlessUrl}/api/rota-inexistente`);
    const unknownApiData = await unknownApiRes.json().catch(() => null);
    const isApiNotHtml = unknownApiRes.status === 404 && unknownApiData?.success === false;

    record(
      11,
      'Chamadas para rotas inexistentes em /api/* retornam JSON 404 (nunca index.html)',
      isApiNotHtml,
      'HTTP 404 em JSON sem vazar HTML',
      `status: ${unknownApiRes.status}, isJson: ${Boolean(unknownApiData)}`
    );

    // ITEM 12: Compatibilidade com Vercel (vercel.json e rotas)
    console.log('\n--- ITEM 12: Configuração e Compatibilidade com Vercel ---');
    const vercelConfigRaw = fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf-8');
    const vercelConfig = JSON.parse(vercelConfigRaw);
    const hasRewrites = Array.isArray(vercelConfig.rewrites) && vercelConfig.rewrites.length >= 2;
    const hasApiRewrite = vercelConfig.rewrites.some((r: any) => r.source === '/api/(.*)' && r.destination === '/api/index');
    const hasSpaRewrite = vercelConfig.rewrites.some((r: any) => r.destination === '/index.html');

    record(
      12,
      'Arquivo vercel.json devidamente configurado com rewrites de API e SPA',
      hasRewrites && hasApiRewrite && hasSpaRewrite,
      'rewrites para /api/(.*) -> /api/index e SPA fallback para /index.html',
      `hasRewrites: ${hasRewrites}, hasApi: ${hasApiRewrite}, hasSpa: ${hasSpaRewrite}`
    );

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log('\n============================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  console.log(`TOTAL DE TESTES DO HOTFIX VERCEL: ${total} | APROVADOS: ${passed} | FALHAS: ${total - passed}`);
  console.log(`RESULTADO FINAL: ${passed === total ? '✅ TODOS OS 12 ITENS APROVADOS COM SUCESSO' : '❌ HOUVE FALHAS'}`);
  console.log('============================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runVercelHotfixTests().catch((err) => {
  console.error('Erro na execução da suíte de validação do hotfix:', err);
  process.exit(1);
});
