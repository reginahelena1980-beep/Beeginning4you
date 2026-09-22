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
    title: 'Comércio Local & Bairros',
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
