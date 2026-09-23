import {
  PhilosophyStep,
  SolutionItem,
  RealProjectExample,
  AudienceProfile,
  UseCaseStory,
  DiagnosticOption
} from '../types';

export const PHILOSOPHY_STEPS: PhilosophyStep[] = [
  {
    id: 'ideia',
    number: '01',
    title: 'A Ideia',
    tagline: 'Todo negócio começa com uma ideia.',
    quote: 'A coragem de começar nasce de uma inquietação genuína.',
    description:
      'Tudo começa quando você percebe que pode fazer algo melhor, diferente ou com mais carinho. Mas ideias na cabeça geram ansiedade quando não têm por onde começar.',
    practicalExample: 'Exemplo: "Quero abrir uma marca autoral de doces artesanais, mas ainda anoto encomendas em guardanapos e perco mensagens no WhatsApp."',
    iconName: 'Sparkles',
    deliverables: ['Escuta atenta das suas dores', 'Filtro do que é essencial agora', 'Clareza de próximos passos']
  },
  {
    id: 'forma',
    number: '02',
    title: 'A Forma',
    tagline: 'Uma ideia precisa de forma.',
    quote: 'Sem contorno e estrutura, a melhor das ideias se perde na rotina.',
    description:
      'Dar forma não é complicar. É desenhar como seu cliente vai te encontrar, entender o que você faz, confiar no seu trabalho e comprar sem atritos desnecessários.',
    practicalExample: 'Exemplo: Definir um catálogo visual direto, organizar a comunicação visual e estruturar o fluxo de atendimento em minutos.',
    iconName: 'LayoutGrid',
    deliverables: ['Identidade digital limpa', 'Fluxo de compra descomplicado', 'Arquitetura sem excessos']
  },
  {
    id: 'solucao',
    number: '03',
    title: 'A Solução',
    tagline: 'E uma boa solução transforma essa forma em possibilidade.',
    quote: 'Tecnologia boa é aquela que trabalha em silêncio para você crescer.',
    description:
      'Aqui a mágica pragmática acontece: sistemas leves, automações pontuais e páginas que funcionam no bolso do seu cliente e te devolvem horas de descanso.',
    practicalExample: 'Exemplo: O cliente faz o pedido sozinho, recebe a confirmação automática no WhatsApp e você só se preocupa em produzir com qualidade.',
    iconName: 'CheckCircle2',
    deliverables: ['Ferramentas que você domina em 5 minutos', 'Autonomia real para o empreendedor', 'Escalabilidade sem dor de cabeça']
  }
];

export const REAL_PROJECT_EXAMPLES: RealProjectExample[] = [
  {
    id: 'gestao-financeira',
    title: 'Gestão Financeira Descomplicada & Fluxo de Caixa',
    badge: 'Projeto Real • Finanças Enxutas',
    tagline: 'Controle de entradas, saídas, previsão de lucro e alertas sem planilhas confusas',
    iconName: 'Wallet',
    challenge:
      'Empreendedores perdiam horas tentando consolidar extratos bancários, cadernos e planilhas quebradas, sem saber com precisão a margem de lucro líquida no final do mês ou quanto poderiam reinvestir.',
    solution:
      'Desenvolvemos um painel financeiro visual e limpo, acessível pelo celular e computador, que registra receitas e despesas em 2 toques, gera relatórios automáticos e prevê o fluxo de caixa com zero complicações.',
    highlights: [
      'Registro ultrarrápido de entradas e saídas pelo celular',
      'Painel visual com faturamento real, custos fixos e margem líquida',
      'Categorização automática de despesas sem jargões contábeis',
      'Alertas de contas a pagar e vencimentos com antecedência',
      'Exportação instantânea para o contador com apenas um clique'
    ],
    resultsNote: 'Total clareza sobre o destino de cada centavo e paz mental no fechamento do mês.'
  },
  {
    id: 'calculo-preco-inteligente',
    title: 'Cálculo de Preço Inteligente & Margem Real',
    badge: 'Projeto Real • Precificação Segura',
    tagline: 'Formação de preços precisa considerando custos fixos, insumos, impostos e lucro desejado',
    iconName: 'Calculator',
    challenge:
      'Muitos negócios cobravam valores baseados no achismo ou no preço da concorrência, descobrindo tarde demais que estavam tendo prejuízo oculto em cada venda por ignorar custos variáveis e horas produtivas.',
    solution:
      'Criamos uma calculadora inteligente sob medida onde o empreendedor insere os insumos ou serviços e o sistema calcula instantaneamente o preço de venda ideal, sugerindo faixas de desconto e ponto de equilíbrio.',
    highlights: [
      'Cálculo automático de custo de insumos, embalagens e tempo de produção',
      'Simulação de taxas de maquininha, comissões e impostos em tempo real',
      'Sugestão inteligente de preço mínimo, preço médio e margem ideal',
      'Tabela dinâmica de preços exportável para orçamentos e cardápios',
      'Eliminação total do risco de "pagar para trabalhar"'
    ],
    resultsNote: 'Aumento imediato de até 28% na rentabilidade com preços justos e sustentáveis.'
  },
  {
    id: 'desenvolvimento-desta-pagina',
    title: 'Desenvolvimento Desta Plataforma Web (Beeginning 4 you)',
    badge: 'Projeto Real • Plataforma Autoral',
    tagline: 'Arquitetura digital refinada, agendamento de reuniões, compromisso LGPD e banco de demandas',
    iconName: 'Globe',
    challenge:
      'Apresentar a proposta de valor humanizada da Beeginning 4 you através de uma interface elegante, de alta velocidade e com governança de dados: sem formulários pesados, integrando agendamento Google Calendar e painel administrativo de controle de demandas.',
    solution:
      'Concepção e desenvolvimento completo desta aplicação moderna em React e TypeScript, dotada de compromisso de sigilo e LGPD, agendamento de reuniões ao vivo e sistema interno de gestão para o administrador.',
    highlights: [
      'Design minimalista, tipografia artesanal vetorizada e identidade autoral',
      'Compromisso rigoroso de sigilo comercial e conformidade integral com a LGPD',
      'Agendamento inteligente sincronizado ao Google Agenda e Google Meet',
      'Painel administrativo discreto com controle de formulários e personalização de contatos',
      'Velocidade de carregamento instantânea em dispositivos móveis'
    ],
    resultsNote: 'Uma presença digital que transmite credibilidade, acolhimento e tecnologia sob medida.'
  },
  {
    id: 'ecommerce-automatizado',
    title: 'Plataforma de E-commerce Completa e Automatizada',
    badge: 'Projeto Real • Loja Própria',
    tagline: 'Operação digital enxuta, segura e de alta conversão sem sistemas inchados',
    iconName: 'ShoppingBag',
    challenge:
      'Criar uma loja virtual ágil, com identidade visual própria (tipografia exclusiva vetorizada), integrada a múltiplos meios de pagamento (como gateways e links diretos), calculadora de frete e automação de e-mails transacionais.',
    solution:
      'Uma operação digital enxuta, segura e pronta para receber pedidos, processar pagamentos de forma fluida e encantar os clientes desde o primeiro clique.',
    highlights: [
      'Identidade visual própria com tipografia exclusiva vetorizada',
      'Múltiplos meios de pagamento (gateways integrados e links diretos)',
      'Calculadora de frete dinâmica e transparente',
      'Automação completa de e-mails transacionais (pedido, pagamento e envio)',
      'Plataforma ágil, segura e livre de taxas ou plataformas pesadas'
    ],
    resultsNote: 'Engrenagem comercial rodando macia, do primeiro clique até a entrega.'
  },
  {
    id: 'sistema-gestao-agenda',
    title: 'Sistemas Web Interativos e Gestão de Alunos/Agenda',
    badge: 'Projeto Real • Sistema Web',
    tagline: 'Gestão inteligente de rotinas, painéis separados e sincronização em tempo real',
    iconName: 'Cpu',
    challenge:
      'Desenvolver uma aplicação web sob medida para gerenciamento de serviços e rotinas, contando com painéis separados para clientes e prestadores, além de sincronização direta de horários e agendamentos.',
    solution:
      'Um ambiente digital inteligente e integrado que simplifica a rotina operacional, elimina processos manuais e eleva a experiência do usuário final.',
    highlights: [
      'Painéis dedicados e intuitivos para clientes e prestadores',
      'Sincronização direta de horários e agendamentos sem atritos',
      'Gestão centralizada de alunos/clientes, presenças e histórico',
      'Eliminação completa de controles manuais e planilhas paralelas',
      'Experiência do usuário final refinada e acolhedora'
    ],
    resultsNote: 'Rotina operacional descomplicada para você focar no que faz de melhor.'
  }
];

export const SOLUTIONS: SolutionItem[] = [
  {
    id: 'ecommerce-completo',
    title: 'Plataforma de E-commerce Completa e Automatizada',
    shortDesc: 'Operação digital enxuta, segura e pronta para receber pedidos, processar pagamentos de forma fluida e encantar os clientes desde o primeiro clique.',
    badge: 'Projeto Real • E-commerce',
    iconName: 'ShoppingBag',
    practicalPain: 'Criar uma loja virtual ágil, com identidade visual própria (tipografia exclusiva vetorizada), integrada a múltiplos meios de pagamento (como gateways e links diretos), calculadora de frete e automação de e-mails transacionais.',
    ourSolution: 'Uma operação digital enxuta, segura e pronta para receber pedidos, processar pagamentos de forma fluida e encantar os clientes desde o primeiro clique.',
    features: [
      'Identidade visual própria e tipografia exclusiva vetorizada',
      'Múltiplos meios de pagamento (gateways e links diretos)',
      'Calculadora de frete integrada em tempo real',
      'Automação de e-mails transacionais e notificações',
      'Zero inchaço operacional ou taxas abusivas por transação'
    ],
    estimatedDelivery: '10 a 20 dias úteis',
    idealFor: 'Marcas autorais, pequenas confecções, lojistas e criadores que desejam canal próprio e profissional.'
  },
  {
    id: 'sistemas-web-agenda',
    title: 'Sistemas Web Interativos e Gestão de Alunos/Agenda',
    shortDesc: 'Um ambiente digital inteligente e integrado que simplifica a rotina operacional, elimina processos manuais e eleva a experiência do usuário final.',
    badge: 'Projeto Real • Sistema Web',
    iconName: 'Cpu',
    practicalPain: 'Desenvolver uma aplicação web sob medida para gerenciamento de serviços e rotinas, contando com painéis separados para clientes e prestadores, além de sincronização direta de horários e agendamentos.',
    ourSolution: 'Um ambiente digital inteligente e integrado que simplifica a rotina operacional, elimina processos manuais e eleva a experiência do usuário final.',
    features: [
      'Painéis separados para clientes e prestadores',
      'Sincronização direta de horários e agendamentos',
      'Gestão de rotinas, histórico de atendimentos e alunos',
      'Eliminação de processos manuais e retrabalho',
      'Acesso seguro de qualquer dispositivo celular ou PC'
    ],
    estimatedDelivery: '12 a 25 dias úteis',
    idealFor: 'Professores, escolas, estúdios, consultorias e negócios de serviços que precisam de organização precisa.'
  },
  {
    id: 'presenca-digital',
    title: 'Landing Pages & Presença Digital Sob Medida',
    shortDesc: 'Páginas rápidas, elegantes e direto ao ponto que transformam visitantes casuais em clientes reais.',
    badge: 'Mais Procurado',
    iconName: 'Globe',
    practicalPain: 'Seus clientes pedem seu site, mas você só tem um link solto no Instagram que não transmite a real qualidade do seu trabalho.',
    ourSolution: 'Construímos páginas leves, responsivas e visualmente profissionais com botão direto para WhatsApp, formulário rápido e catálogo essencial.',
    features: [
      'Carregamento ultra-rápido no celular',
      'Design elegante alinhado à sua marca',
      'Botão inteligente integrado ao WhatsApp',
      'Otimização para buscas locais no Google (SEO)'
    ],
    estimatedDelivery: '5 a 10 dias úteis',
    idealFor: 'Prestadores de serviço, consultorias, clínicas e comércios que querem passar credibilidade imediata.'
  },
  {
    id: 'automacoes-whatsapp',
    title: 'Automações Simples de Atendimento & Rotina',
    shortDesc: 'Elimine respostas repetitivas, confirmações manuais e tarefas que roubam seu tempo livre.',
    badge: 'Economia de Tempo',
    iconName: 'Zap',
    practicalPain: 'Passar 3 horas por dia respondendo as mesmas dúvidas no WhatsApp e esquecer de confirmar horários com clientes.',
    ourSolution: 'Fluxos automáticos acolhedores (sem parecer robô frio) para agendamentos, lembretes de pagamento e confirmação de pedidos.',
    features: [
      'Lembretes automáticos que reduzem faltas em até 70%',
      'Mensagens personalizadas com o tom da sua marca',
      'Integração direta com Google Agenda ou planilha',
      'Disparo de orientações pós-atendimento'
    ],
    estimatedDelivery: '3 a 7 dias úteis',
    idealFor: 'Salões, terapeutas, pequenos escritórios e negócios que dependem de agendamentos e orçamentos rápidos.'
  },
  {
    id: 'paineis-descomplicados',
    title: 'Painéis de Gestão Enxutos sem Sofrimento',
    shortDesc: 'Apenas o que você precisa ver: vendas do dia, clientes fiéis e produtos mais pedidos, sem planilhas confusas.',
    badge: 'Clareza nos Negócios',
    iconName: 'BarChart3',
    practicalPain: 'Sua gestão está dividida em 5 cadernos, 3 planilhas do Excel corrompidas e você nunca sabe ao certo o lucro do mês.',
    ourSolution: 'Criamos um painel visual limpo e intuitivo feito exclusivamente para o seu fluxo de trabalho. Zero botões inúteis.',
    features: [
      'Visão rápida do fluxo de caixa e pedidos',
      'Cadastro simples de produtos e clientes',
      'Acessível do celular ou computador',
      'Exportação com um clique para seu contador'
    ],
    estimatedDelivery: '7 a 15 dias úteis',
    idealFor: 'Lojistas, comércios locais e pequenas confecções que abandonaram os ERPs complexos e caros.'
  },
  {
    id: 'integracoes-processos',
    title: 'Conexão & Sincronização de Ferramentas',
    shortDesc: 'Faça suas ferramentas atuais conversarem: formulários, e-mails, WhatsApp, planilhas e pagamentos.',
    badge: 'Produtividade',
    iconName: 'Layers',
    practicalPain: 'Copiar e colar dados de um lugar para o outro manualmente o dia inteiro, com alto risco de erro humano.',
    ourSolution: 'Conectamos seus pontos de contato para que cada venda ou cadastro alimente sua lista, notifique seu time e emita o recibo automaticamente.',
    features: [
      'Integrações via Webhooks e APIs seguras',
      'Notificações instantâneas no seu Telegram ou WhatsApp',
      'Backup automático de leads e clientes',
      'Redução drástica de falhas operacionais'
    ],
    estimatedDelivery: '4 a 8 dias úteis',
    idealFor: 'Negócios que já usam algumas ferramentas mas perdem tempo fazendo pontes manuais.'
  }
];

export const AUDIENCE_PROFILES: AudienceProfile[] = [
  {
    id: 'comercio-local',
    title: 'Comércio',
    subtitle: 'Mercados, cafeterias, confeitarias e pequenas lojas físicas',
    iconName: 'Store',
    commonStruggle: 'Dependem do movimento da calçada ou sofrem com comissões de até 27% em marketplaces.',
    solutionOutcome: 'Criam canal próprio de pedidos rápidos, fidelizam a vizinhança e vendem com lucro integral.',
    highlightTag: 'Canal Próprio de Vendas'
  },
  {
    id: 'prestadores-servico',
    title: 'Prestadores de Serviço & Autônomos',
    subtitle: 'Consultores, terapeutas, advogados, designers e arquitetos',
    iconName: 'Briefcase',
    commonStruggle: 'Passam o dia mandando mensagens avulsas e perdem oportunidades por falta de apresentação profissional.',
    solutionOutcome: 'Ganham páginas elegantes com portfólio claro e agendamento sem fricção.',
    highlightTag: 'Credibilidade Imediata'
  },
  {
    id: 'marcas-autorais',
    title: 'Marcas Autorais & Pequenos Criadores',
    subtitle: 'Artesanato fino, confecções próprias, cosméticos naturais e papelaria',
    iconName: 'Palette',
    commonStruggle: 'Tempo gasto organizando tabelas de pedidos em vez de focar na criação e na qualidade dos produtos.',
    solutionOutcome: 'Catálogo digital encantador onde o cliente compra fácil e você só aprova e produz.',
    highlightTag: 'Foco na Criação'
  },
  {
    id: 'negocios-em-crescimento',
    title: 'Empreendedores em Transição',
    subtitle: 'Negócios que começaram no improviso e agora precisam se organizar',
    iconName: 'TrendingUp',
    commonStruggle: 'O negócio cresceu, mas os processos continuam os mesmos do primeiro dia e estão à beira do caos.',
    solutionOutcome: 'Fluxos enxutos, painéis de controle claros e tecnologia que sustenta o próximo salto com calma.',
    highlightTag: 'Estrutura para Crescer'
  }
];

export const USE_CASES: UseCaseStory[] = [
  {
    id: 'case-1',
    clientName: 'Carla Silveira',
    businessName: 'Doce Afeto Confeitaria',
    segment: 'Alimentação Artesanal',
    before: 'Anotava pedidos em 2 cadernos e no chat do WhatsApp. Já teve entregas trocadas e perdia horas conferindo comprovantes.',
    after: 'Catálogo digital exclusivo com fotos reais, seleção de sabores, data de entrega e envio direto para a cozinha.',
    quote: '"Antes eu passava as noites conferindo mensagem por mensagem. Hoje o cliente monta o bolo certinho e eu ganhei meus domingos de volta."',
    metric: 'Zero pedidos perdidos em 6 meses'
  },
  {
    id: 'case-2',
    clientName: 'Rodrigo Mendes',
    businessName: 'Mendes Reparos & Climatização',
    segment: 'Serviços Técnicos',
    before: 'Clientes ligavam pedindo orçamento sem dar detalhes e muitos esqueciam a visita agendada na véspera.',
    after: 'Página profissional rápida com formulário de triagem de defeitos e confirmação automática de presença por WhatsApp.',
    quote: '"O cliente já me chama sabendo exatamente o valor da visita técnica e a taxa de cancelamento despencou."',
    metric: '-80% de faltas em visitas'
  },
  {
    id: 'case-3',
    clientName: 'Dra. Luísa Faria',
    businessName: 'Espaço Integrar Terapias',
    segment: 'Saúde & Bem-Estar',
    before: 'Gastava R$ 600/mês num software de clínica do qual só usava a agenda e achava a interface terrível.',
    after: 'Painel sob medida leve e seguro, com prontuário simples e lembretes amigáveis para os pacientes.',
    quote: '"A Beeginning entendeu que eu não precisava de um monstro tecnológico, mas sim de paz mental na recepção."',
    metric: 'Economia de R$ 7.200/ano'
  }
];

export const DIAGNOSTIC_OPTIONS: DiagnosticOption[] = [
  {
    id: 'whatsapp-overload',
    title: 'Perco horas respondendo as mesmas mensagens e pedidos no WhatsApp',
    description: 'Você passa o dia digitando preços, formas de pagamento e conferindo se a mensagem foi respondida.',
    recommendedSolution: 'Automação Amigável de Atendimento & Catálogo Direto no WhatsApp',
    iconName: 'MessageSquare'
  },
  {
    id: 'no-professional-site',
    title: 'Preciso de uma presença digital séria e profissional para passar confiança',
    description: 'Quando o cliente pede seu site ou portfólio, você sente que sua imagem atual não reflete o valor do seu trabalho.',
    recommendedSolution: 'Landing Page Sob Medida com Posicionamento e Conversão',
    iconName: 'Globe'
  },
  {
    id: 'messy-sheets',
    title: 'Minhas informações estão espalhadas em cadernos e planilhas confusas',
    description: 'Você quer saber quanto vendeu, quais clientes precisam de retorno e o que tem no estoque sem quebrar a cabeça.',
    recommendedSolution: 'Painel de Gestão Descomplicado & Dashboard Enxuto',
    iconName: 'Table'
  },
  {
    id: 'manual-schedule',
    title: 'Muitos clientes faltam aos horários ou perco tempo marcando na mão',
    description: 'A agenda de atendimentos exige dezenas de mensagens de confirmação diárias para evitar horários ociosos.',
    recommendedSolution: 'Sistema Inteligente de Agendamento com Lembrete Automático',
    iconName: 'Calendar'
  },
  {
    id: 'custom-need',
    title: 'Tenho um fluxo de trabalho muito particular e nenhuma ferramenta pronta resolve',
    description: 'Seu negócio tem uma dinâmica própria e você quer algo construído especificamente para você.',
    recommendedSolution: 'Ferramenta Sob Medida (Desenvolvida exatamente para o seu caso)',
    iconName: 'Sparkles'
  }
];

// ==========================================
// ENGLISH DATASETS & BILINGUAL GETTERS
// ==========================================

export const PHILOSOPHY_STEPS_EN: PhilosophyStep[] = [
  {
    id: 'ideia',
    number: '01',
    title: 'The Idea',
    tagline: 'Every business begins with an idea.',
    quote: 'The courage to begin is born from genuine restlessness.',
    description:
      'It all starts when you realize you can do something better, different, or with deeper care. But ideas in your head generate anxiety when they lack a clear starting point.',
    practicalExample: 'Example: "I want to launch an artisanal bakery brand, but I still scribble orders on napkins and miss crucial WhatsApp messages."',
    iconName: 'Sparkles',
    deliverables: ['Empathetic listening to your pains', 'Filtering what is essential right now', 'Clarity on tangible next steps']
  },
  {
    id: 'forma',
    number: '02',
    title: 'The Shape',
    tagline: 'An idea needs shape.',
    quote: 'Without contour and structure, even the finest ideas get lost in daily friction.',
    description:
      'Giving shape does not mean complicating. It means mapping out how your customer discovers you, understands what you do, trusts your craft, and buys with zero friction.',
    practicalExample: 'Example: Establishing a clear visual catalog, streamlining communications, and structuring client intake in minutes.',
    iconName: 'LayoutGrid',
    deliverables: ['Clean digital brand presence', 'Uncomplicated checkout experience', 'Architecture without unnecessary noise']
  },
  {
    id: 'solucao',
    number: '03',
    title: 'The Solution',
    tagline: 'And a sound solution transforms that shape into possibility.',
    quote: 'Great technology works silently so you can thrive and rest.',
    description:
      'This is where pragmatic magic happens: agile systems, punctual automations, and web tools that operate seamlessly on your client\'s phone while giving you hours back.',
    practicalExample: 'Example: The customer places their order smoothly, gets instant automatic confirmation on WhatsApp, and you focus on delivering quality.',
    iconName: 'CheckCircle2',
    deliverables: ['Tools you can master in 5 minutes', 'Authentic autonomy for the business owner', 'Scalability without operational headaches']
  }
];

export const REAL_PROJECT_EXAMPLES_EN: RealProjectExample[] = [
  {
    id: 'gestao-financeira',
    title: 'Streamlined Financial Management & Cash Flow',
    badge: 'Real Project • Lean Finance',
    tagline: 'Income, expense, and profit forecasting without confusing spreadsheets',
    iconName: 'Wallet',
    challenge:
      'Small business owners were wasting hours trying to reconcile bank statements, scattered notebooks, and broken spreadsheets, never knowing true net profit margins at month end.',
    solution:
      'We engineered a clean, visual financial cockpit accessible from mobile and desktop, logging transactions in 2 taps, generating automated reports, and projecting cash flow with zero hassle.',
    highlights: [
      'Ultra-fast entry of income and expenses on mobile',
      'Visual dashboard displaying real revenue, fixed costs, and net margin',
      'Automated expense categorization without accounting jargon',
      'Timely reminders for payables and receivables in advance',
      'One-click export tailored for your accountant'
    ],
    resultsNote: 'Absolute clarity over every cent and genuine peace of mind when closing the books.'
  },
  {
    id: 'calculo-preco-inteligente',
    title: 'Smart Pricing & Real Margin Calculator',
    badge: 'Real Project • Confident Pricing',
    tagline: 'Accurate price setting considering fixed costs, materials, taxes, and target profit',
    iconName: 'Calculator',
    challenge:
      'Many creators charged prices based on guesswork or competitor rates, discovering too late that they were losing money on each order by overlooking variable costs and labor hours.',
    solution:
      'We built a tailored smart calculator where the entrepreneur inputs supplies or service hours, instantly computing the ideal selling price with suggested discount tiers and break-even points.',
    highlights: [
      'Automatic calculation of supplies, packaging, and labor time',
      'Real-time simulation of card processing fees, commissions, and taxes',
      'Intelligent floor price, target average price, and ideal margin suggestions',
      'Exportable dynamic price lists for quotes and menus',
      'Complete elimination of the risk of working at a hidden loss'
    ],
    resultsNote: 'Immediate increase of up to 28% in bottom-line profitability with fair, sustainable pricing.'
  },
  {
    id: 'desenvolvimento-desta-pagina',
    title: 'Development of This Web Platform (Beeginning 4 you)',
    badge: 'Real Project • Custom Platform',
    tagline: 'Refined digital architecture, appointment booking, privacy compliance, and intake desk',
    iconName: 'Globe',
    challenge:
      'Showcasing Beeginning 4 you\'s humanized value proposition through an ultra-fast, elegant interface with strict data privacy: no heavy forms, seamless Google Calendar integration, and a discreet admin hub.',
    solution:
      'Full concept and engineering of this modern React & TypeScript application, equipped with confidentiality pledges, live meeting scheduling, and an internal demand tracking system for the founder.',
    highlights: [
      'Minimalist aesthetic, bespoke vector typography, and authentic visual branding',
      'Strict commercial confidentiality and full compliance with data privacy regulations',
      'Smart booking synchronized directly with Google Calendar and Google Meet',
      'Discreet administrative dashboard with client inquiry log and channel customization',
      'Instant loading speed on mobile devices'
    ],
    resultsNote: 'A digital home that radiates credibility, warmth, and tailored technology.'
  },
  {
    id: 'ecommerce-automatizado',
    title: 'Automated & Turnkey E-Commerce Storefront',
    badge: 'Real Project • Own Store',
    tagline: 'Lean, secure, high-converting digital retail without bloated platform fees',
    iconName: 'ShoppingBag',
    challenge:
      'Launching an agile online store with custom visual identity, integrated payment gateways and direct checkout links, dynamic shipping calculation, and automated transactional emails.',
    solution:
      'A streamlined, secure digital storefront ready to capture orders, process payments effortlessly, and delight buyers from their very first visit.',
    highlights: [
      'Distinctive visual branding with exclusive vectorized typography',
      'Multiple payment methods (integrated gateways and direct links)',
      'Dynamic real-time shipping calculator',
      'Full automation for transactional emails (order, payment, dispatch)',
      'Fast, independent platform free of abusive marketplace commissions'
    ],
    resultsNote: 'A smooth commercial engine running effortlessly from first tap to doorstep.'
  },
  {
    id: 'sistema-gestao-agenda',
    title: 'Interactive Web Systems & Schedule/Client Portal',
    badge: 'Real Project • Web Application',
    tagline: 'Intelligent routine management, separated portals, and live calendar synchronization',
    iconName: 'Cpu',
    challenge:
      'Building a bespoke web tool for managing service routines, featuring dedicated portals for clients and providers, plus direct calendar synchronization.',
    solution:
      'An intelligent, connected digital environment that simplifies operational routines, eradicates manual checklists, and elevates the end-user experience.',
    highlights: [
      'Dedicated, intuitive dashboards for clients and staff',
      'Frictionless real-time calendar and appointment sync',
      'Centralized client database, attendance log, and history',
      'Total removal of paper logbooks and broken parallel sheets'
    ],
    resultsNote: 'Uncomplicated day-to-day operations so you can focus on your craft.'
  }
];

export const SOLUTIONS_EN: SolutionItem[] = [
  {
    id: 'ecommerce-completo',
    title: 'Turnkey Automated E-Commerce Platform',
    shortDesc: 'A lean, secure digital storefront ready to receive orders, process payments smoothly, and delight buyers from the first click.',
    badge: 'Real Project • E-commerce',
    iconName: 'ShoppingBag',
    practicalPain: 'Need a fast online shop with custom visual identity, multi-gateway payments, instant shipping quotes, and transactional notifications.',
    ourSolution: 'A streamlined, secure digital storefront built for high conversion without bloated monthly fees or complex operational weight.',
    features: [
      'Distinctive visual brand with custom vector typography',
      'Integrated payment gateways and direct checkout links',
      'Dynamic real-time shipping calculator',
      'Automated transactional emails and order updates',
      'Zero platform bloat or predatory per-sale commissions'
    ],
    estimatedDelivery: '10 to 20 business days',
    idealFor: 'Independent makers, boutique apparel, local retailers, and creators wanting their own professional channel.'
  },
  {
    id: 'sistemas-web-agenda',
    title: 'Interactive Web Systems & Client/Booking Portals',
    shortDesc: 'A smart, cohesive digital hub that simplifies your operational routine, eliminates manual tasks, and elevates the customer experience.',
    badge: 'Real Project • Web System',
    iconName: 'Cpu',
    practicalPain: 'Struggling to coordinate appointments, client notes, and schedules across messy group chats and paper diaries.',
    ourSolution: 'A tailored web application with dedicated views for customers and providers, with real-time schedule syncing and intake history.',
    features: [
      'Dedicated views for clients and service providers',
      'Direct calendar booking without double-booking risk',
      'Intake records, client history, and attendance tracking',
      'Elimination of manual spreadsheets and repetitive rework',
      'Secure access from any smartphone, tablet, or desktop'
    ],
    estimatedDelivery: '12 to 25 business days',
    idealFor: 'Educators, studios, consultants, clinics, and service providers who need pristine organization.'
  },
  {
    id: 'presenca-digital',
    title: 'Bespoke Landing Pages & High-Trust Web Presence',
    shortDesc: 'Fast, elegant, and focused web pages that convert curious visitors into genuine paying clients.',
    badge: 'Most Popular',
    iconName: 'Globe',
    practicalPain: 'Clients ask for your website, but you only have a generic Instagram link that doesn\'t convey the true quality of your work.',
    ourSolution: 'We build lightweight, mobile-first pages with instant WhatsApp booking, clean service catalogs, and authentic social proof.',
    features: [
      'Ultra-fast load times on mobile devices',
      'Refined design true to your brand\'s personality',
      'Smart WhatsApp inquiry button with pre-filled context',
      'Search engine optimization (SEO) for local discovery'
    ],
    estimatedDelivery: '5 to 10 business days',
    idealFor: 'Consultants, therapists, legal practitioners, architects, and boutique services wanting instant credibility.'
  },
  {
    id: 'automacoes-whatsapp',
    title: 'Warm & Simple WhatsApp & Routine Automations',
    shortDesc: 'Eliminate repetitive replies, manual confirmations, and time-draining administrative chores.',
    badge: 'Time Saver',
    iconName: 'Zap',
    practicalPain: 'Spending 3 hours a day copying and pasting the same price list in WhatsApp and forgetting to confirm tomorrow\'s appointments.',
    ourSolution: 'Warm automated workflows (never sounding like a cold robot) for appointment reminders, payment prompts, and order confirmations.',
    features: [
      'Automatic reminders that cut no-shows by up to 70%',
      'Customized tone of voice reflecting your personal warmth',
      'Direct integration with Google Calendar or spreadsheets',
      'Automated post-service follow-ups and care instructions'
    ],
    estimatedDelivery: '3 to 7 business days',
    idealFor: 'Salons, therapists, independent clinics, and studios relying on punctuality and rapid quotes.'
  },
  {
    id: 'paineis-descomplicados',
    title: 'Lean, Stress-Free Business Management Dashboards',
    shortDesc: 'Only what you need to see: daily sales, loyal customers, and top products — with zero confusing spreadsheet formulas.',
    badge: 'Business Clarity',
    iconName: 'BarChart3',
    practicalPain: 'Your business numbers are split across 5 notebooks and corrupted spreadsheets, and you never know your real monthly profit.',
    ourSolution: 'We build an intuitive, clutter-free dashboard designed exclusively around your specific operational rhythm. Zero unnecessary buttons.',
    features: [
      'Quick glance at cash flow, margin, and pending orders',
      'Simple client and product registry',
      'Accessible anywhere from your phone or laptop',
      'One-click clean export for your tax accountant'
    ],
    estimatedDelivery: '7 to 15 business days',
    idealFor: 'Shop owners, makers, and local businesses that have outgrown manual notebooks but dread bloated enterprise ERPs.'
  },
  {
    id: 'integracoes-processos',
    title: 'Tool Synchronization & Workflow Bridges',
    shortDesc: 'Make your existing apps talk to each other: forms, emails, WhatsApp, spreadsheets, and payment processors.',
    badge: 'Productivity',
    iconName: 'Layers',
    practicalPain: 'Spending half your day copying customer details from WhatsApp into sheets and typing emails by hand.',
    ourSolution: 'We wire your touchpoints so each sale automatically records the client, notifies your phone, and issues the receipt seamlessly.',
    features: [
      'Secure webhooks and API connections',
      'Instant alerts on your phone (WhatsApp or Telegram)',
      'Automated lead and customer backups',
      'Drastic reduction of manual human error'
    ],
    estimatedDelivery: '4 to 8 business days',
    idealFor: 'Businesses already using several digital tools but losing precious time bridging them manually.'
  }
];

export const AUDIENCE_PROFILES_EN: AudienceProfile[] = [
  {
    id: 'comercio-local',
    title: 'Commerce',
    subtitle: 'Markets, bakeries, cafes, confectioneries, and boutique retail',
    iconName: 'Store',
    commonStruggle: 'Overly reliant on foot traffic or losing up to 27% in delivery marketplace commissions.',
    solutionOutcome: 'Establish an independent quick-order channel, nurture neighborhood loyalty, and retain 100% of profit.',
    highlightTag: 'Independent Sales Channel'
  },
  {
    id: 'prestadores-servico',
    title: 'Service Providers & Solo Specialists',
    subtitle: 'Consultants, therapists, designers, attorneys, and architects',
    iconName: 'Briefcase',
    commonStruggle: 'Sending scattered text messages all day and missing deals due to a lack of professional presentation.',
    solutionOutcome: 'Gain an elegant landing page with clear offerings and frictionless booking.',
    highlightTag: 'Instant Credibility'
  },
  {
    id: 'marcas-autorais',
    title: 'Artisan Brands & Independent Creators',
    subtitle: 'Handmade crafts, apparel, natural cosmetics, and creative goods',
    iconName: 'Palette',
    commonStruggle: 'Hours lost organizing order spreadsheets instead of dedicating time to craft and quality.',
    solutionOutcome: 'A charming digital catalog where clients order with ease, leaving you free to produce.',
    highlightTag: 'Focus on Craft'
  },
  {
    id: 'negocios-em-crescimento',
    title: 'Transitioning Entrepreneurs',
    subtitle: 'Businesses that started casually and now need solid operational structure',
    iconName: 'TrendingUp',
    commonStruggle: 'Revenue grew, but processes remain improvised since day one and are nearing operational breaking points.',
    solutionOutcome: 'Lean workflows, clear control cockpits, and calm digital foundations that support your next leap.',
    highlightTag: 'Structure to Scale'
  }
];

export const USE_CASES_EN: UseCaseStory[] = [
  {
    id: 'case-1',
    clientName: 'Carla Silveira',
    businessName: 'Doce Afeto Confectionery',
    segment: 'Artisanal Food & Bakery',
    before: 'Wrote orders across 2 notebooks and chaotic WhatsApp threads. Experienced mixed-up deliveries and spent hours checking payment slips.',
    after: 'Exclusive digital catalog with real photos, flavor selection, delivery date picker, and direct dispatch to the kitchen.',
    quote: '"I used to spend my late evenings reading message by message. Now the customer configures their cake perfectly and I got my Sundays back."',
    metric: 'Zero lost orders in 6 months'
  },
  {
    id: 'case-2',
    clientName: 'Rodrigo Mendes',
    businessName: 'Mendes HVAC & Technical Services',
    segment: 'Technical Services',
    before: 'Clients called requesting quotes without basic details, and many forgot the technician visit booked the previous week.',
    after: 'Fast professional landing page with an issue diagnosis form and automatic SMS/WhatsApp appointment reminders.',
    quote: '"Clients now reach out already aware of the site-visit fee, and no-shows have plummeted drastically."',
    metric: '-80% fewer missed appointments'
  },
  {
    id: 'case-3',
    clientName: 'Dr. Luísa Faria',
    businessName: 'Espaço Integrar Wellness & Therapy',
    segment: 'Health & Well-being',
    before: 'Spent $120/month on clinical software of which she only used the calendar and found the interface frustratingly slow.',
    after: 'Lightweight, secure bespoke dashboard with simple intake records and warm automated appointment reminders for patients.',
    quote: '"Beeginning understood that I didn\'t need a tech monster, but rather peace of mind at my front desk."',
    metric: 'Over $1,400 saved annually'
  }
];

export const DIAGNOSTIC_OPTIONS_EN: DiagnosticOption[] = [
  {
    id: 'whatsapp-overload',
    title: 'I lose hours answering repetitive messages and inquiries on WhatsApp',
    description: 'You spend the whole day typing out pricing, payment details, and checking if inquiries were responded to.',
    recommendedSolution: 'Warm WhatsApp Customer Service Automation & Direct Catalog',
    iconName: 'MessageSquare'
  },
  {
    id: 'no-professional-site',
    title: 'I need a serious, professional web presence to inspire trust in potential clients',
    description: 'When potential clients ask for your website or portfolio, you feel your current link doesn\'t do justice to your work.',
    recommendedSolution: 'Bespoke High-Conversion Landing Page & Positioning',
    iconName: 'Globe'
  },
  {
    id: 'messy-sheets',
    title: 'My business records are scattered across notebooks and broken spreadsheets',
    description: 'You want to know your daily sales, which customers need follow-up, and inventory status without a headache.',
    recommendedSolution: 'Lean, Stress-Free Management Dashboard',
    iconName: 'Table'
  },
  {
    id: 'manual-schedule',
    title: 'Too many clients miss booked times or I waste hours scheduling by hand',
    description: 'Your booking schedule requires dozens of manual confirmation texts every single day to avoid empty slots.',
    recommendedSolution: 'Smart Appointment Booking System with Automated Reminders',
    iconName: 'Calendar'
  },
  {
    id: 'custom-need',
    title: 'I have a very unique operational workflow and no off-the-shelf software fits',
    description: 'Your business has its own rhythm and you need something engineered specifically around your way of working.',
    recommendedSolution: 'Bespoke Digital Tool (Developed precisely for your workflow)',
    iconName: 'Sparkles'
  }
];

export const getPhilosophySteps = (lang: string = 'pt'): PhilosophyStep[] =>
  lang === 'en' ? PHILOSOPHY_STEPS_EN : PHILOSOPHY_STEPS;

export const getRealProjectExamples = (lang: string = 'pt'): RealProjectExample[] =>
  lang === 'en' ? REAL_PROJECT_EXAMPLES_EN : REAL_PROJECT_EXAMPLES;

export const getSolutions = (lang: string = 'pt'): SolutionItem[] =>
  lang === 'en' ? SOLUTIONS_EN : SOLUTIONS;

export const getAudienceProfiles = (lang: string = 'pt'): AudienceProfile[] =>
  lang === 'en' ? AUDIENCE_PROFILES_EN : AUDIENCE_PROFILES;

export const getUseCases = (lang: string = 'pt'): UseCaseStory[] =>
  lang === 'en' ? USE_CASES_EN : USE_CASES;

export const getDiagnosticOptions = (lang: string = 'pt'): DiagnosticOption[] =>
  lang === 'en' ? DIAGNOSTIC_OPTIONS_EN : DIAGNOSTIC_OPTIONS;

