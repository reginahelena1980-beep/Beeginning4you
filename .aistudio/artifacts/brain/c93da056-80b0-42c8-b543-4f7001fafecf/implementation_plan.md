# BEEginning 4 You — Fase 1.3: Plano de Migração dos Agendamentos para Firestore

Este documento apresenta a análise de engenharia de software e segurança da informação para a consolidação do Cloud Firestore como **fonte única de verdade** (Single Source of Truth - SSOT) dos agendamentos da plataforma BEEginning 4 You, eliminando qualquer dependência de arquivos JSON locais (`admin_app_data.json`) ou reconciliação descentralizada no frontend.

> [!IMPORTANT]
> **Etapa Exclusivamente de Planejamento — Nenhuma linha de código ou infraestrutura foi alterada.**  
> Este plano detalha os pré-requisitos, a auditoria da infraestrutura real, a estratégia de transações atômicas, os padrões de segurança criptográfica para tokens de clientes e o veredito técnico **GO/NO-GO** antes de qualquer execução.

---

## 1. Verificação da Infraestrutura Real

### 1.1 Local de Execução do Backend Express
* **Ambiente de Desenvolvimento & AI Studio Preview (`ais-dev-...run.app`)**:
  * O backend Express é executado diretamente via processo Node/TypeScript (`tsx server.ts` na porta 3000).
  * O servidor monta o middleware Vite em tempo de execução (`app.use(vite.middlewares)`), permitindo que tanto os endpoints de API (`/api/*`) quanto a aplicação SPA React compartilhem a mesma porta e processo.
* **Ambiente de Produção (GitHub Actions & Firebase Hosting)**:
  * **Diagnóstico Crítico de Infraestrutura**: O arquivo `.github/workflows/firebase-hosting-merge.yml` compila apenas o frontend (`npm run build` gerando a pasta `dist/`) e implanta no **Firebase Hosting** com `action-hosting-deploy`.
  * O arquivo `firebase.json` possui rewrite estático para a SPA:
    ```json
    "hosting": {
      "public": "dist",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
    ```
  * **Conclusão Técnica**: O Firebase Hosting é um serviço de arquivos estáticos. **O Express (`server.ts`) NÃO está sendo executado em produção pelo Firebase Hosting.** Se o domínio público acessar diretamente o Firebase Hosting sem um serviço de backend acoplado, requisições para `/api/*` retornarão o `index.html` (HTTP 200 SPA), quebrando chamadas de API.
  * **Resolução Necessária**: Para que o backend Express opere em produção, ele deve ser implantado no **Google Cloud Run** (ou Cloud Functions 2nd Gen) e conectado ao Firebase Hosting através da regra de rewrite:
    ```json
    "rewrites": [
      { "source": "/api/**", "run": { "serviceId": "beeginning4you-server", "region": "us-east1" } },
      { "source": "**", "destination": "/index.html" }
    ]
    ```

### 1.2 Suporte ao Firebase Admin SDK
* O pacote `firebase-admin` (versão 14.5.0) já está instalado e presente no `package.json`.
* O Firebase Hosting estático **não executa** código Node.js.
* O Cloud Run e instâncias Node.js suportam nativamente o Firebase Admin SDK com acesso de baixa latência ao Firestore da mesma região Google Cloud (`us-east1`).

### 1.3 Autenticação de Serviço sem Exposição de Credenciais
* **No Google Cloud (Cloud Run / Cloud Functions)**: Utiliza-se **Application Default Credentials (ADC)**. A conta de serviço do Cloud Run recebe a role IAM `roles/datastore.user` e `roles/firebaseauth.admin`. A chamada `initializeApp({ projectId: FIREBASE_PROJECT_ID })` autentica automaticamente sem chaves privadas JSON e sem variáveis de ambiente secretas.
* **No ambiente de desenvolvimento / preview**: A chave privada é fornecida via Secret Manager ou variável de ambiente segura no servidor (`FIREBASE_SERVICE_ACCOUNT_KEY`), estritamente protegida no processo do servidor e **nunca exposta ao bundle client-side** (sem prefixo `VITE_`).

### 1.4 Roteamento das APIs `/api`
* **Em dev/preview**: Roteado nativamente por `server.ts` antes dos middlewares estáticos.
* **Em produção**: Requer configuração de Cloud Run + rewrite no `firebase.json`.

---

## 2. Planejamento da Persistência (Firestore SSOT)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITETURA ATUAL (HÍBRIDA)                          │
├────────────────────────────────────────────────────────────────────────────────┤
│  Cliente (Browser)                                                             │
│    ├── POST /api/appointments ──────► server.ts ───► admin_app_data.json       │
│    └── saveAppointmentToFirestore ─► Firestore (appointments collection)      │
│                                                                                │
│  Admin (Painel)                                                                │
│    └── loadAdminCrmData ────────────► Reconciliação manual JSON vs Firestore   │
└────────────────────────────────────────────────────────────────────────────────┘

                                        ▼

┌────────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA PROPOSTA (SSOT)                            │
├────────────────────────────────────────────────────────────────────────────────┤
│  Cliente (Browser)                                                             │
│    └── POST /api/appointments ──────► server.ts                                │
│                                         │                                      │
│                                         ├── Transação Atômica (Firestore)      │
│                                         │   ├── 1. Lê Bloqueios Admin          │
│                                         │   ├── 2. Verifica Conflito de Slot   │
│                                         │   ├── 3. Grava Token Hash (SHA-256)  │
│                                         │   └── 4. Cria Registro Oficial       │
│                                         └── Disparo de E-mail de Confirmação   │
│                                                                                │
│  Firestore Security Rules                                                      │
│    └── match /appointments/{id} ──► allow read, write: if isAdmin(); (Backend) │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Firestore como Fonte Oficial dos Agendamentos
* A coleção `appointments` no Cloud Firestore passa a ser o único local de armazenamento de agendamentos.
* O arquivo `admin_app_data.json` é descontinuado para agendamentos e demandas de produção.

### 2.2 Operações Exclusivamente pelo Backend
* **Criação** (`POST /api/appointments`): Valida slots, bloqueios, gera token de gerenciamento, calcula hash e persiste no Firestore via Admin SDK.
* **Reagendamento** (`POST /api/appointments/reschedule-notification`): Valida token fornecido contra o hash gravado, valida novo slot atômico e atualiza no Firestore.
* **Cancelamento** (`POST /api/appointments/cancel-notification`): Valida token contra o hash, altera status para `cancelled` e libera o horário atomicamente.
* **Firestore Security Rules**: O SDK cliente Web não terá mais permissão de escrita pública direta (`allow create: if isPublicValidAppointment()` será restrito a `allow read, write: if isAdmin();`). Visitantes anônimos interagem exclusivamente através dos endpoints do backend Express.

### 2.3 Transações Atômicas para Evitar Reservas Simultâneas (Race Conditions)
Para garantir que dois clientes não reservem o mesmo slot no mesmo milissegundo:
* Usar `db.runTransaction()` do Firebase Admin SDK:
  1. A transação consulta documentos com `date == targetDate`, `time == targetTime` e `status != 'cancelled'`.
  2. Se encontrar qualquer registro ativo no mesmo horário, aborta a transação e retorna `HTTP 409 Conflict`.
  3. Para concorrência extrema em alto volume, criar documento de bloqueio rápido na coleção de índice de slots:
     `slots/{YYYY-MM-DD_HH:mm}` contendo `{ appointmentId, createdAt }`. O Firestore garante lock por documento dentro da transação.

### 2.4 Validação de Bloqueios Administrativos na Mesma Fonte
* O backend Express, durante a transação de agendamento/reagendamento, lê o documento `settings/contact_config` no Firestore.
* Se `availability.blockedSlots` contiver a data como `ALL_DAY` ou o horário específico, o backend rejeita a solicitação com erro claro (`HTTP 409 Conflict`).

### 2.5 Remoção da Reconciliação Automática
* Eliminar a função de mesclagem complexa existente em `src/utils/adminStorage.ts` (`loadAdminCrmData`), que mesclava o estado de `admin_app_data.json` com o Firestore. O painel admin passa a escutar exclusivamente a coleção `appointments` do Firestore em tempo real.

### 2.6 Estratégia de Migração e Preservação dos Registros Existentes
1. Criar script de migração idempotente (`scripts/migrate-json-to-firestore.ts`).
2. Para cada registro em `admin_app_data.json`:
   * Verificar se já existe no Firestore pelo `id`.
   * Se existir, preservar o registro do Firestore (já contém dados enriquecidos de diagnóstico e CRM).
   * Se não existir, calcular o hash do token (`tokenHash = sha256(manageToken)`), normalizar os campos e inserir no Firestore.
3. Fazer backup prévio do arquivo `admin_app_data.json` (`admin_app_data.backup.<timestamp>.json`).

---

## 3. Planejamento da Segurança & Tokens de Gerenciamento

```
┌────────────────────────────────────────────────────────────────────────────────┐
│               FLUXO SEGURO DE GERAÇÃO E VERIFICAÇÃO DE TOKENS                  │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  1. Agendamento Criado:                                                        │
│     Token em texto puro:  tok_live_7a8f9c1b4e2d0a3f... (32 bytes aleatórios)   │
│     Cálculo no Backend:   tokenHash = SHA256(manageToken + serverPepper)       │
│     Gravado no Firestore: { id: "meet-123", tokenHash: "e3b0c442...", ... }    │
│     Retornado ao Cliente: manageToken via HTTPS apenas na resposta da criação │
│     Enviado por E-mail:   Link de gestão com token embutido                    │
│                                                                                │
│  2. Reagendamento / Cancelamento:                                              │
│     Cliente envia:        Header "x-appointment-token: tok_live_7a8f..."       │
│     Backend calcula:      inputHash = SHA256(tokenRecebido + serverPepper)     │
│     Comparação Segura:    crypto.timingSafeEqual(inputHash, storedHash)        │
│     Resultado:            Autorizado sem expor o segredo a invasores           │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Verificação de Administrador Exclusivamente no Backend
* Mantida via middleware `requireAdminAuth`:
  * Valida Firebase ID Token com `getAuth().verifyIdToken(token)`.
  * Exige expressamente `email === 'beeginning4you@gmail.com'` e `email_verified === true`.
  * Princípio fail-closed: se o Firebase Admin estiver indisponível ou o token for inválido, rejeita com HTTP 401/403/503.

### 3.2 Token Individual de Gerenciamento
* Cada agendamento recebe um token opaco criptograficamente seguro gerado com `crypto.randomBytes(32).toString('hex')` com prefixo identificador (`tok_live_...`).
* Entropia mínima de 256 bits, impossibilitando ataques de força bruta.

### 3.3 Armazenamento com Hash Criptográfico
* **Nunca salvar o token em texto puro no Firestore.**
* O Firestore armazena apenas:
  * `tokenHash`: SHA-256 com pepper interno do servidor.
  * `tokenCreatedAt`: Timestamp ISO.
  * `tokenExpiresAt`: Data da reunião + 24 horas.
* A comparação do token nas rotas de reagendamento e cancelamento é feita com `crypto.timingSafeEqual` para prevenir ataques de análise de tempo (timing attacks).

### 3.4 Proteção de Dados e Respostas Públicas
* **Endpoint `/api/booked-slots`**: Retorna estritamente `[{ date: "YYYY-MM-DD", time: "HH:mm" }]`. Zero PII (sem nomes, sem e-mails, sem telefones, sem IDs, sem tokens).
* **Endpoint `/api/appointments`** (Admin): Retorna dados dos clientes para gestão da Regina, mas **não retorna o segredo do token** (retorna apenas flag booleana `hasValidToken: true`).
* **Logs do Servidor**: O middleware de logging sanitiza os headers `x-appointment-token` e campos `manageToken`, substituindo por `[REDACTED]`.

### 3.5 Recuperação Segura de Acesso por E-mail
Se o cliente perder o link da reunião ou o token de gerenciamento:
1. Endpoint público seguro: `POST /api/appointments/request-access` com `{ clientEmail: "cliente@email.com" }`.
2. O servidor pesquisa no Firestore por agendamentos futuros não-cancelados vinculados ao e-mail.
3. Se encontrar:
   * Gera um novo token efêmero de acesso.
   * Atualiza o `tokenHash` no Firestore.
   * Dispara um e-mail oficial para `cliente@email.com` com o link seguro de gerenciamento.
4. Resposta genérica à API (prevenção de enumeração de usuários): *"Se houver agendamentos ativos para este e-mail, as instruções de acesso foram enviadas."*

### 3.6 Expiração, Revogação e Proteção contra Abuso
* **Expiração**: O token expira automaticamente 24 horas após o término do horário da reunião.
* **Revogação**: Ao cancelar a reunião, o token é marcado como revogado (`revokedAt: new Date().toISOString()`), impedindo novas ações.
* **Rate Limiting**: Limite de 5 tentativas por minuto por IP em rotas sensíveis de agendamento e cancelamento.

---

## 4. Preservação de Todas as Funcionalidades Existentes

| Funcionalidade | Estado Atual | Estado Pós-Migração |
| :--- | :--- | :--- |
| **Formulário de Contato** | Grava em Firestore (`demands`) e JSON | Grava em Firestore (`demands`) exclusivamente |
| **Solicitação de Diagnóstico** | Integrado ao agendamento e CRM | Preservado no Firestore (`diagnosticNotes`) |
| **Agendamento de Reuniões** | Gravação dupla (Cliente Firestore + Servidor JSON) | Gravação exclusiva via Backend Transaction no Firestore |
| **Reagendamento Autônomo** | Validação no servidor com JSON | Validação no servidor via Firestore com Token Hash |
| **Cancelamento Autônomo** | Validação no servidor com JSON | Validação no servidor via Firestore com Token Hash |
| **E-mails de Confirmação** | Disparados pelo backend (Nodemailer Gmail) | Mantidos idênticos, disparados pelo backend |
| **CRM Administrativo** | Carrega via mesclagem JSON + Firestore | Carrega diretamente do Firestore autenticado com snapshot em tempo real |
| **Bloqueio de Horários** | Salvo em `settings/contact_config` | Mantido e validado atomicamente pelo backend |
| **Links Google Calendar & Meet** | Gerados no frontend com sala oficial fixa | Mantidos idênticos |
| **Deep Links WhatsApp** | Direcionados para Regina e para clientes | Mantidos idênticos |

---

## 5. Entregáveis da Fase 1.3

### Entregável 1: Arquitetura Atual vs. Arquitetura Proposta
* **Atual**: Modelo híbrido frágil com escrita direta descentralizada pelo cliente no Firestore e no arquivo local `admin_app_data.json`, necessitando reconciliação manual e sujeito a race conditions em horários simultâneos.
* **Proposta**: Backend Express como autoridade exclusiva e centralizada de escrita em `appointments`. Firestore acessado com privilégios de Admin SDK através de transações atômicas isoladas. Token individual protegido por hash criptográfico unidirecional.

### Entregável 2: Arquivos a Serem Modificados na Fase 1.4 (Execução)
1. `server.ts`:
   * Adicionar transações atômicas com `getFirestore()` do Firebase Admin SDK.
   * Substituir `admin_app_data.json` por consultas diretas à coleção `appointments` do Firestore.
   * Implementar geração de token com SHA-256 hash e comparação com `timingSafeEqual`.
   * Implementar endpoint de recuperação de acesso `POST /api/appointments/request-access`.
2. `src/utils/adminStorage.ts`:
   * Remover reconciliação bidirecional manual entre JSON e Firestore.
   * Manter listeners em tempo real (`onSnapshot`) diretamente para o painel administrativo.
3. `src/utils/calendar.ts`:
   * Ajustar para enviar o token de gerenciamento e consumir endpoints transacionais.
4. `src/components/ConversationModal.tsx`:
   * Tratar as respostas de sucesso/erro atômico (`HTTP 409`) informando slots concorrentes.
5. `firestore.rules`:
   * Bloquear escrita pública direta em `/appointments/{appointmentId}`, permitindo escrita apenas para o backend autenticado como Admin.
6. `firebase.json`:
   * Adicionar rewrite de `/api/**` para o serviço de backend Cloud Run.
7. `scripts/migrate-json-to-firestore.ts` (novo):
   * Script de migração dos registros históricos de `admin_app_data.json` para o Firestore.

### Entregável 3: Sequência Mínima de Implementação
```
Etapa 1: Script de Migração de Dados
  └─ Testar cópia segura de admin_app_data.json para o Firestore sem sobrescrever nada existente.

Etapa 2: Backend Express Firestore Admin (Transações & Hash de Tokens)
  └─ Implementar transações atômicas e validações criptográficas no server.ts.

Etapa 3: Validação com Testes Automatizados Locais
  └─ Executar suíte de testes de concorrência, colisão de slots e segurança de tokens.

Etapa 4: Adaptação do Frontend SPA
  └─ Atualizar ConversationModal e adminStorage para consumir a nova API transacional.

Etapa 5: Atualização e Deploy das Firestore Security Rules
  └─ Fechar a escrita pública direta em /appointments/{appointmentId}.

Etapa 6: Configuração de Infraestrutura e Rewrite do Cloud Run
  └─ Assegurar roteamento correto de /api no ambiente de produção.
```

### Entregável 4: Plano de Migração dos Dados Existentes
1. **Auditoria de Dados**: Ler `admin_app_data.json` (atualmente com 0 agendamentos em produção, pronto para migração limpa).
2. **Normalização**: Mapear campos faltantes, gerar `tokenHash` para agendamentos sem token.
3. **Upsert Não-Destrutivo**: Usar `db.collection('appointments').doc(item.id).set(item, { merge: true })`.
4. **Validação de Integridade**: Comparar contagem de registros e integridade dos campos.
5. **Backup Residual**: Arquivar `admin_app_data.json` como cópia de segurança estática.

### Entregável 5: Plano de Testes Automatizados e Funcionais
* **Testes Automatizados de API (`test-security-appointments.ts`)**:
  1. Criação de agendamento retorna token em texto puro apenas na criação.
  2. Documento gravado no Firestore contém apenas `tokenHash`, nunca o segredo em texto puro.
  3. Tentativa de cancelamento ou reagendamento sem token: `HTTP 401`.
  4. Tentativa com token adulterado/falso: `HTTP 403`.
  5. Tentativa com token válido de outro cliente: `HTTP 403`.
  6. Reagendamento com token válido do titular: `HTTP 200` com persistência durável no Firestore.
  7. Cancelamento com token válido do titular: `HTTP 200` com status alterado para `cancelled`.
  8. Teste de Concorrência: 5 requisições paralelas simultâneas para o mesmo slot `(data, hora)` garantem exatamente 1 sucesso e 4 rejeições com `HTTP 409 Conflict`.
* **Testes Automatizados de Regras Firestore (`test-firestore-rules.ts`)**:
  1. Cliente anônimo não consegue criar/editar/excluir diretamente em `/appointments`.
  2. Administrador autenticado lê e gerencia normalmente.
* **Testes Manuais de Ponta a Ponta**:
  1. Agendar pelo modal público do site ➔ Verificar chegada do e-mail oficial com o link de gestão.
  2. Clicar no link de gestão ➔ Reagendar para outro horário ➔ Confirmar atualização no painel e novo e-mail.
  3. Cancelar a reunião ➔ Confirmar liberação imediata do horário na grade pública.

### Entregável 6: Riscos de Regressão & Mitigação
1. **Risco**: Regressão no disparo de e-mails caso as credenciais `GMAIL_APP_PASSWORD` sejam afetadas.  
   * *Mitigação*: Manter o serviço de e-mail isolado, disparado de forma assíncrona pós-transação de persistência.
2. **Risco**: Clientes antigos sem token não conseguirem reagendar pelo link.  
   * *Mitigação*: Script de migração gerará tokens retroativos e o mecanismo de recuperação por e-mail permitirá emitir novos links a qualquer momento.
3. **Risco**: Concorrência excessiva ou latência no Firestore.  
   * *Mitigação*: Transações atômicas com locks rápidos por slot e índices compostos otimizados.

### Entregável 7: Estratégia de Rollback
* **Rollback de Código**: Em caso de falha durante a Fase 1.4, os commits serão organizados em branches atômicas (`feature/firestore-migration-fase-1-4`), permitindo `git revert` imediato para o estado da Fase 1.2.
* **Rollback de Dados**: Os dados existentes em `admin_app_data.json` serão mantidos intactos como backup estático de leitura. Nenhuma exclusão de dados antigos será executada durante a migração.
* **Rollback de Regras de Segurança**: As regras anteriores do `firestore.rules` (que permitiam criação pública temporária) serão mantidas em arquivo de backup (`firestore.rules.bak`) para restauração em caso de indisponibilidade da API Express.

### Entregável 8: Pré-Requisitos de Infraestrutura
1. Definição do host de produção para o backend Express: Configuração de container no **Google Cloud Run** apontando para o projeto `beegining4you`.
2. Conexão do Firebase Hosting ao Cloud Run via rewrite no `firebase.json`.
3. Concessão de permissão IAM `Cloud Datastore User` à conta de serviço do Cloud Run (para uso do ADC sem segredos manuais).
4. Configuração das variáveis de ambiente de produção no Cloud Run: `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `FIREBASE_PROJECT_ID`.

---

## 9. Veredito GO/NO-GO

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VEREDITO TÉCNICO OFICIAL                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   STATUS: [ NO-GO ] PARA PRODUÇÃO IMEDIATA                             │
│           [ GO COM RESSALVA ] PARA IMPLEMENTAÇÃO EM AMBIENTE DEV       │
│                                                                        │
│   JUSTIFICATIVA DE SEGURANÇA E ARQUITETURA:                            │
│   1. No ambiente de DEV / PREVIEW: O backend Express já está ativo     │
│      e apto a receber a implementação com Firebase Admin SDK e         │
│      transações atômicas.                                              │
│   2. No ambiente de PRODUÇÃO (Firebase Hosting): O servidor Express    │
│      NÃO é implantado pelo workflow atual do GitHub Actions.           │
│      Implantar as regras restritivas do Firestore sem o Cloud Run      │
│      ativo em produção quebraria os agendamentos públicos no domínio   │
│      final (retornando 404/200 SPA para chamadas de API).              │
│                                                                        │
│   CONDIÇÃO PARA O "GO" DEFINITIVO:                                     │
│   - Aprovação deste plano arquitetural pela liderança.                 │
│   - Alinhamento de infraestrutura para hospedar o backend Express      │
│     no Google Cloud Run antes de apontar o domínio oficial.            │
└────────────────────────────────────────────────────────────────────────┘
```

> **Aguardando aprovação explícita para prosseguir com qualquer implementação de código.**
