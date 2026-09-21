import {
  PhilosophyStep,
  SolutionItem,
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

export const SOLUTIONS: SolutionItem[] = [
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
    title: 'Painéis de Gestão sem Sofrimento',
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
    id: 'catalogos-vendas',
    title: 'Catálogos Digitais & Mini Lojas Inteligentes',
    shortDesc: 'Venda seus produtos de forma direta, bonita e sem ter que pagar taxas abusivas por transação.',
    badge: 'Vendas Diretas',
    iconName: 'ShoppingBag',
    practicalPain: 'Plataformas de e-commerce tradicionais cobram mensalidades caras e são difíceis demais para quem tem poucos produtos.',
    ourSolution: 'Uma vitrine digital ágil onde o cliente escolhe os itens com facilidade e envia o carrinho organizado diretamente no seu WhatsApp.',
    features: [
      'Carrinho intuitivo com cálculo de frete ou retirada',
      'Atualização de preços e estoque em segundos',
      'Sem taxas percentuais sobre suas vendas',
      'Funciona perfeitamente em 3G/4G'
    ],
    estimatedDelivery: '7 a 12 dias úteis',
    idealFor: 'Confeitarias, marcas autorais, floriculturas, bazares e pequenos restaurantes.'
  },
  {
    id: 'ferramentas-sob-medida',
    title: 'Ferramentas & Sistemas Sob Medida',
    shortDesc: 'Quando nenhuma solução de prateleira atende a singularidade do seu método de trabalho.',
    badge: 'Exclusivo',
    iconName: 'Cpu',
    practicalPain: 'Você gasta com 3 ferramentas diferentes que não conversam entre si e sua equipe vive retrabalhando.',
    ourSolution: 'Sentamos com você, mapeamos seu processo e desenvolvemos a engrenagem exata para resolver o problema específico.',
    features: [
      'Desenvolvido para caber no seu orçamento',
      'Treinamento prático de uso da ferramenta',
      'Código limpo, moderno e sustentável',
      'Suporte humano e contínuo'
    ],
    estimatedDelivery: 'Consulte escopo',
    idealFor: 'Negócios com operações particulares que necessitam de diferenciação competitiva.'
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
