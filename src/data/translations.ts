import {
  PhilosophyStep,
  SolutionItem,
  RealProjectExample,
  AudienceProfile,
  UseCaseStory,
  DiagnosticOption
} from '../types';

export const TRANSLATIONS = {
  pt: {
    nav: {
      home: 'Início',
      about: 'Quem Somos',
      philosophy: 'Filosofia',
      solutions: 'O Que Fazemos',
      audience: 'Para Quem',
      projects: 'Projetos Reais',
      cta: 'Vamos conversar?',
    },
    hero: {
      sloganLine1: 'Você traz',
      sloganLine2: 'a ideia.',
      sloganLine3: 'A gente faz',
      sloganLine4: 'acontecer.',
      solutionsBtn: 'Nossas Soluções',
      altImage: 'Espaço de trabalho inspirador com notebook ASUS Vivobook rosé e café na mesa de madeira',
    },
    about: {
      badge1: 'A Beeginning',
      title1: 'Não é sobre ter todas as respostas. É sobre começar.',
      p1_1: 'A maioria das boas ideias morre na gaveta porque parece difícil demais tirá-las da cabeça: falta tempo, sobram ferramentas complicadas e ninguém tem paciência para falar a língua real de quem está no campo de batalha.',
      p1_2: 'Na',
      p1_3: 'nós transformamos inquietações em ferramentas digitais úteis, leves e com a sua cara. Sem jargões técnicos, sem mensalidades desnecessárias e sem te afastar do que você ama fazer.',

      badge2: 'Quem está por trás',
      title2: 'Olá, sou a Regina.',
      subtitle2: 'Criadora da Beeginning 4 you',
      p2_1: 'Durante mais de 30 anos no universo corporativo, atuei no cruzamento entre processos, números, sistemas e pessoas. Vi de perto como grandes empresas investem milhões para automatizar tarefas simples, enquanto pequenos empreendedores muitas vezes sofrem no escuro com planilhas quebradas, cadernos perdidos e mensagens sem resposta no WhatsApp.',
      p2_2: 'Aprendi que tecnologia boa não é a mais cara nem a mais sofisticada — é aquela que você entende em cinco minutos e que te devolve a tranquilidade de fechar o caixa no final do dia com a certeza de que tudo está sob controle.',
      p2_3: 'A Beeginning 4 you nasceu para colocar essa experiência a favor de quem constrói o próprio caminho: autônomos, pequenos comerciantes, criadores e prestadores de serviço que merecem ferramentas feitas na medida exata do seu negócio.',
      humanSeal: 'Atendimento direto, humano e sem intermediários',
      photoLegend: 'Regina • Criadora da Beeginning 4 you • 30+ anos no mundo corporativo',

      badge3: 'Competências e Abordagem',
      title3: 'O que eu trago comigo',
      subtitle3: 'Mais do que linhas de código ou telas bonitas, nosso trabalho combina bagagem analítica, sensibilidade e presença lado a lado.',
      cards3: [
        {
          title: 'Visão de Processos',
          desc: 'Identificar gargalos, encurtar caminhos e organizar fluxos para que você não precise refazer a mesma tarefa duas vezes.'
        },
        {
          title: 'Pensamento Criativo',
          desc: 'Encontrar saídas elegantes e originais que valorizem a identidade autoral do seu negócio sem fórmulas prontas.'
        },
        {
          title: 'Experiência com Negócios',
          desc: 'Mais de duas décadas entendendo métricas, viabilidade, fluxo de caixa e o que realmente move o ponteiro do lucro.'
        },
        {
          title: 'Olhar para Detalhes',
          desc: 'Cuidado obsessivo com tipografia, legibilidade, clareza das mensagens e a facilidade do clique para o seu cliente.'
        },
        {
          title: 'Construção Lado a Lado',
          desc: 'Você não recebe um produto frio e um manual de 80 páginas. Construímos juntos, tirando dúvidas em tempo real.'
        }
      ],

      badge4: 'Linha do Tempo & Trajetória',
      title4: 'O fio condutor dessa jornada',
      subtitle4: 'Como duas décadas de vivência se transformaram em soluções práticas para pequenos negócios.',
      timeline4: [
        {
          period: '30+ Anos no Mundo Corporativo',
          headline: 'A base sólida em processos, governança e sistemas',
          text: 'Atuação aprofundada em ambientes corporativos de alta exigência, lidando diariamente com fluxos financeiros complexos, conciliações, integração entre departamentos e implementação de tecnologias de gestão.'
        },
        {
          period: 'O Despertar da Dor Real',
          headline: 'O contraste entre grandes empresas e quem empreende sozinho',
          text: 'A constatação clara de que os pequenos negócios — os que mais geram empregos e afeto — eram os mais desassistidos pelo mercado tech, reféns de plataformas engessadas e suporte robótico.'
        },
        {
          period: 'Hoje • Beeginning 4 you',
          headline: 'Ideias que ganham forma. Soluções que fazem sentido.',
          text: 'A união entre a maturidade técnica de processos e o calor humano da escuta atenta, criando ferramentas sob medida que dão autonomia verdadeira ao empreendedor.'
        }
      ],

      badge5: 'O Lado Pessoal e Criativo',
      title5: 'O encontro entre lógica e criatividade',
      p5_1: 'Acredito que os melhores projetos nascem quando a exatidão dos números se encontra com o design afetivo. Uma planilha não precisa ser cinza e amedrontadora; um sistema de agendamento não precisa parecer uma repartição pública.',
      p5_2: 'Por trás de cada botão ou linha de processo que criamos, existe o compromisso de encantar o seu cliente e tornar o seu dia a dia mais leve e prazeroso.',

      badge6: 'Como eu penso',
      quote6: '“Eu não começo pela ferramenta. Começo pelo problema.”',
      p6_desc: 'Não importa se vamos usar uma página web, um formulário enxuto ou uma integração simples: o ponto de partida é sempre o que está travando o seu tempo ou o seu faturamento hoje.',

      badge7: 'Por que Beeginning 4 you?',
      title7: 'A essência por trás do nome e da nossa marca',
      p7_1: 'O nome carrega o jogo de palavras entre **Bee** (a abelha trabalhadora, precisa e colaborativa) e **Beginning** (o recomeço, o primeiro passo, a coragem de começar algo novo). O **4 you** reforça que cada entrega é feita sob medida para a sua realidade única.',
      p7_wings: 'As asas da abelha são em formato de infinito (∞) e na matemática, o infinito não é um número comum, mas sim um conceito que descreve algo sem fim, sem limite ou uma quantidade que cresce para além de qualquer valor finito.',
      p7_bottom: 'Essa linha contínua reflete nosso propósito: ser o ponto de partida de um ciclo ilimitado de evolução e autonomia para o seu negócio.',

      ctaTitle1: 'Você traz a ideia.',
      ctaTitle2: 'A gente faz acontecer.',
      ctaDesc: 'Vamos conversar sobre o seu negócio sem compromisso e sem termos complicados?',
      ctaBtn: 'Agendar ou Iniciar Conversa',
    },
    philosophy: {
      tag: 'Construção e Recomeços',
      title: 'Nossa Visão & Compromisso',
      subtitle: 'Para pequenos negócios que precisam de soluções digitais humanas, bonitas e eficientes.',
      boxTitle: 'NOSSA FILOSOFIA',
      manifestoLead: 'Todo negócio começa com uma ideia.\nUma ideia precisa de forma.\nE uma boa solução transforma essa forma em possibilidade.',
      manifestoBody: 'A Beeginning 4 You existe para ajudar pequenos negócios a dar esse primeiro passo — criando ferramentas digitais simples, bonitas, práticas e pensadas para a realidade de quem empreende.',
      pathLabel: 'O Caminho de Transformação',
      pathHint: 'Clique para explorar',
      exploreBtn: 'Descobrir Nossas Soluções',
    },
    solutions: {
      tag: 'O Que Fazemos',
      title: 'Soluções Digitais Sob Medida, Ágeis e Sem Sistemas Inchados',
      subtitle: 'Desenvolvemos ferramentas leves, bonitas e acessíveis para resolver dores reais de atendimento, vendas e rotina operacional.',
      featuresLabel: 'O que está incluso:',
      deliveryLabel: 'Prazo estimado de entrega:',
      idealForLabel: 'Perfeito para:',
      interestedBtn: 'Quero Esta Solução',
      detailsBtn: 'Ver Detalhes do Projeto',
      modalClose: 'Fechar',
      bannerTitle: 'Não sabe exatamente qual solução escolher?',
      bannerDesc: 'Conte seu desafio em 1 minuto e nós sugerimos a ferramenta mais simples e econômica.',
      bannerBtn: 'Conversar com a Regina',
    },
    audience: {
      tag: 'Para Quem É',
      title: 'Construído Para Quem Faz Acontecer no Dia a Dia',
      subtitle: 'Negócios autênticos, prestadores de serviços e comerciantes que buscam profissionalismo sem burocracia.',
      struggleLabel: 'Desafio comum:',
      outcomeLabel: 'Com a Beeginning 4 you:',
      ctaBannerTitle: 'Seu negócio se encaixa em algum desses perfis?',
      ctaBannerDesc: 'Mesmo que sua rotina seja muito diferente, adaptamos cada detalhe para o seu ritmo.',
      ctaBannerBtn: 'Descobrir o que podemos fazer juntos',
    },
    projects: {
      tag: 'Casos Reais & Portfólio',
      title: 'Ideias Que Ganharam Forma no Mundo Real',
      subtitle: 'Veja na prática como soluções simples transformaram a rotina de pequenos negócios e empreendedores.',
      challengeLabel: 'O Desafio:',
      solutionLabel: 'A Solução Criada:',
      highlightsLabel: 'Destaques do Projeto:',
      resultBadge: 'Resultado Alcançado',
      ctaBtn: 'Quero um projeto parecido para meu negócio',
    },
    useCases: {
      tag: 'Histórias Reais',
      title: 'Antes e Depois na Vida de Quem Empreende',
      beforeLabel: 'Antes:',
      afterLabel: 'Depois:',
    },
    diagnostic: {
      tag: 'Diagnóstico Rápido em 1 Minuto',
      title: 'O que seu negócio realmente precisa hoje?',
      subtitle: 'Selecione a situação que mais se aproxima da sua dor atual para descobrirmos a ferramenta exata:',
      recommendedTitle: 'Solução recomendada para você:',
      confirmBtn: 'Continuar com Esta Recomendação',
      cancelBtn: 'Cancelar',
    },
    contact: {
      tag: 'Canais Diretos',
      title: 'Vamos Conversar Sobre a Sua Ideia?',
      subtitle: 'Escolha a forma mais confortável para você. Atendimento direto e acolhedor, sem intermediários.',
      badgeWhatsApp: 'WhatsApp Direto',
      badgeWhatsAppDesc: 'Mensagem rápida diretamente no celular da Regina.',
      badgeMeeting: 'Videoconferência',
      badgeMeetingDesc: 'Agende uma conversa de 45 min no Google Meet.',
      badgeForm: 'Formulário Rápido',
      badgeFormDesc: 'Envie seus dados e entraremos em contato.',
      formTitle: 'Envie uma mensagem rápida',
      nameLabel: 'Seu Nome ou Nome da Empresa *',
      contactValueLabel: 'WhatsApp ou E-mail para retorno *',
      segmentLabel: 'Segmento do Negócio',
      needLabel: 'Qual o maior desafio ou ideia hoje? *',
      submitBtn: 'Enviar Mensagem',
      submittingBtn: 'Enviando...',
      successTitle: 'Mensagem recebida com carinho!',
      successDesc: 'A Regina entrará em contato com você o mais breve possível.',
      sendAnother: 'Enviar outra mensagem',
      privacyNote: '🔒 Seus dados estão seguros e protegidos segundo a LGPD.',
    },
    footer: {
      tagline: 'Ajudamos pequenos negócios a dar o primeiro passo através de ferramentas digitais simples, bonitas e pensadas para a realidade de quem empreende.',
      seal: 'Tecnologia pragmática com acolhimento humano.',
      quickLinks: 'Navegação Rápida',
      channels: 'Canais Diretos',
      rights: 'Todos os direitos reservados. Beeginning 4 you.',
      privacyCommitment: 'Compromisso de Sigilo & Proteção de Dados (LGPD)',
    }
  },
  en: {
    nav: {
      home: 'Home',
      about: 'About Us',
      philosophy: 'Philosophy',
      solutions: 'What We Do',
      audience: 'Who It\'s For',
      projects: 'Real Projects',
      cta: 'Let\'s talk?',
    },
    hero: {
      sloganLine1: 'You bring',
      sloganLine2: 'the idea.',
      sloganLine3: 'We make it',
      sloganLine4: 'happen.',
      solutionsBtn: 'Our Solutions',
      altImage: 'Inspiring workspace with ASUS Vivobook laptop in rose gold and coffee on a wooden desk',
    },
    about: {
      badge1: 'The Beeginning',
      title1: 'It\'s not about having all the answers. It\'s about starting.',
      p1_1: 'Most great ideas die in a drawer because getting them out of your head feels too daunting: time is scarce, software is overly complicated, and nobody speaks the everyday language of small business owners.',
      p1_2: 'At',
      p1_3: 'we turn aspirations into useful, lightweight, custom digital tools with your business\'s DNA. No technical jargon, no unnecessary monthly fees, and no distraction from what you love doing most.',

      badge2: 'Who is behind it',
      title2: 'Hi, I\'m Regina.',
      subtitle2: 'Founder of Beeginning 4 you',
      p2_1: 'For over 30 years in the corporate world, I worked at the intersection of processes, numbers, systems, and people. I saw firsthand how large corporations invest millions to automate simple tasks, while small business owners struggle in the dark with broken spreadsheets, lost notebooks, and unanswered customer messages on WhatsApp.',
      p2_2: 'I learned that great technology isn\'t the most expensive or convoluted — it\'s the one you can master in five minutes and gives you the peace of mind to close your register at the end of the day knowing everything is in order.',
      p2_3: 'Beeginning 4 you was born to bring that expertise to those carving out their own path: freelancers, independent retailers, creators, and service professionals who deserve tools built precisely for their scale.',
      humanSeal: 'Direct, personal, and human care — zero middlemen',
      photoLegend: 'Regina • Founder of Beeginning 4 you • 30+ years in corporate business',

      badge3: 'Skills & Approach',
      title3: 'What I bring with me',
      subtitle3: 'More than code lines or neat screens, our work unites analytical depth, design sensitivity, and side-by-side companionship.',
      cards3: [
        {
          title: 'Process Architecture',
          desc: 'Spotting bottlenecks, trimming steps, and organizing workflows so you never have to repeat the same manual task twice.'
        },
        {
          title: 'Creative Thinking',
          desc: 'Finding elegant, original paths that showcase the authentic identity of your business without pre-packaged formulas.'
        },
        {
          title: 'Business Experience',
          desc: 'Over two decades understanding metrics, viability, cash flow, and what truly moves the needle of profit.'
        },
        {
          title: 'Attention to Detail',
          desc: 'Thoughtful care with typography, readability, message clarity, and seamless click journeys for your customers.'
        },
        {
          title: 'Side-by-Side Co-creation',
          desc: 'You won\'t receive a cold product and an 80-page manual. We build together, clarifying questions in real time.'
        }
      ],

      badge4: 'Timeline & Journey',
      title4: 'The guiding thread of this journey',
      subtitle4: 'How two decades of corporate experience turned into practical solutions for small businesses.',
      timeline4: [
        {
          period: '30+ Years in the Corporate World',
          headline: 'A solid foundation in processes, governance, and systems',
          text: 'In-depth experience in high-standard corporate environments, dealing daily with complex financial flows, reconciliations, interdepartmental integrations, and enterprise management tools.'
        },
        {
          period: 'Recognizing the Real Struggle',
          headline: 'The stark contrast between giant firms and solo entrepreneurs',
          text: 'The eye-opening realization that small businesses — the ones driving genuine human warmth and local jobs — were completely underserved by mainstream tech, trapped by bloated platforms and robotic support.'
        },
        {
          period: 'Today • Beeginning 4 you',
          headline: 'Ideas taking shape. Solutions that truly make sense.',
          text: 'Blending technical process rigor with empathetic listening, crafting bespoke tools that provide authentic autonomy to independent entrepreneurs.'
        }
      ],

      badge5: 'The Personal & Creative Side',
      title5: 'The meeting point of logic and creativity',
      p5_1: 'I believe the finest projects emerge when numeric precision joins hands with warm design. A spreadsheet doesn\'t have to be grey and intimidating; a booking system doesn\'t have to look like a tax bureau.',
      p5_2: 'Behind every button or automated step we design lies a heartfelt commitment to delight your customer and make your day-to-day work lighter and more rewarding.',

      badge6: 'How I think',
      quote6: '“I don\'t start with the tool. I start with the problem.”',
      p6_desc: 'Whether we implement a focused webpage, a streamlined intake form, or an automated workflow: the starting line is always what is draining your time or stalling your revenue right now.',

      badge7: 'Why Beeginning 4 you?',
      title7: 'The meaning behind the name and brand',
      p7_1: 'The name carries a playful blend of **Bee** (the hard-working, precise, and collaborative bee) and **Beginning** (the fresh start, the first step, the courage to begin something new). The **4 you** emphasizes that every solution is tailored to your exact reality.',
      p7_wings: 'The bee\'s wings are in the shape of infinity (∞), and in mathematics, infinity is not a common number, but rather a concept that describes something without end, without limit, or a quantity that expands beyond any finite value.',
      p7_bottom: 'This continuous loop reflects our mission: to be the launchpad of an ongoing cycle of evolution and autonomy for your venture.',

      ctaTitle1: 'You bring the idea.',
      ctaTitle2: 'We make it happen.',
      ctaDesc: 'Let\'s chat about your business with zero pressure and zero complicated buzzwords.',
      ctaBtn: 'Book or Start a Conversation',
    },
    philosophy: {
      tag: 'Crafting & Fresh Starts',
      title: 'Our Vision & Commitment',
      subtitle: 'For small businesses that need digital solutions that are human, beautiful, and efficient.',
      boxTitle: 'OUR PHILOSOPHY',
      manifestoLead: 'Every business begins with an idea.\nAn idea needs shape.\nAnd a sound solution transforms that shape into possibility.',
      manifestoBody: 'Beeginning 4 You exists to help small businesses take that first stride — creating simple, elegant, pragmatic digital tools built for the reality of those who build their own businesses.',
      pathLabel: 'The Transformation Pathway',
      pathHint: 'Click to explore',
      exploreBtn: 'Discover Our Solutions',
    },
    solutions: {
      tag: 'What We Do',
      title: 'Tailored, Agile Digital Solutions Without Software Bloat',
      subtitle: 'We build lightweight, intuitive, and accessible tools to resolve real pains in customer service, sales, and day-to-day operations.',
      featuresLabel: 'What\'s included:',
      deliveryLabel: 'Estimated turnaround time:',
      idealForLabel: 'Ideal for:',
      interestedBtn: 'I Want This Solution',
      detailsBtn: 'View Project Details',
      modalClose: 'Close',
      bannerTitle: 'Unsure which solution fits your current stage?',
      bannerDesc: 'Share your challenge in 1 minute and we will recommend the simplest, most cost-effective path.',
      bannerBtn: 'Talk to Regina',
    },
    audience: {
      tag: 'Who It\'s For',
      title: 'Built For Those Who Make Things Happen Daily',
      subtitle: 'Independent shops, service specialists, and makers seeking a professional digital edge without bureaucracy.',
      struggleLabel: 'Common struggle:',
      outcomeLabel: 'With Beeginning 4 you:',
      ctaBannerTitle: 'Does your business fit one of these profiles?',
      ctaBannerDesc: 'Even if your routine is completely unique, we tailor every detail to your pace and workflow.',
      ctaBannerBtn: 'Discover what we can build together',
    },
    projects: {
      tag: 'Real Cases & Portfolio',
      title: 'Ideas Brought to Life in the Real World',
      subtitle: 'See firsthand how straightforward solutions transformed the routines of real businesses.',
      challengeLabel: 'The Challenge:',
      solutionLabel: 'The Solution Created:',
      highlightsLabel: 'Project Highlights:',
      resultBadge: 'Outcome Delivered',
      ctaBtn: 'I want a similar solution for my business',
    },
    useCases: {
      tag: 'Real Stories',
      title: 'Before & After in Entrepreneurs\' Lives',
      beforeLabel: 'Before:',
      afterLabel: 'After:',
    },
    diagnostic: {
      tag: '1-Minute Quick Diagnostic',
      title: 'What does your business truly need today?',
      subtitle: 'Select the scenario closest to your current bottleneck to pinpoint the exact tool:',
      recommendedTitle: 'Recommended solution for you:',
      confirmBtn: 'Proceed With This Recommendation',
      cancelBtn: 'Cancel',
    },
    contact: {
      tag: 'Direct Channels',
      title: 'Shall We Talk About Your Idea?',
      subtitle: 'Pick the channel that suits you best. Warm, personal attention directly with Regina.',
      badgeWhatsApp: 'Direct WhatsApp',
      badgeWhatsAppDesc: 'Fast message straight to Regina\'s mobile phone.',
      badgeMeeting: 'Video Conference',
      badgeMeetingDesc: 'Book a 45-minute consultation via Google Meet.',
      badgeForm: 'Quick Form',
      badgeFormDesc: 'Send your project notes and we will follow up.',
      formTitle: 'Send a quick message',
      nameLabel: 'Your Name or Business Name *',
      contactValueLabel: 'WhatsApp or Email for follow-up *',
      segmentLabel: 'Business Segment',
      needLabel: 'What is your biggest bottleneck or idea today? *',
      submitBtn: 'Send Message',
      submittingBtn: 'Sending...',
      successTitle: 'Message received warmly!',
      successDesc: 'Regina will review your note and get back to you shortly.',
      sendAnother: 'Send another message',
      privacyNote: '🔒 Your data is safe and protected in full compliance with privacy laws.',
    },
    footer: {
      tagline: 'Helping small businesses take the first step with simple, beautiful digital tools crafted for the reality of entrepreneurship.',
      seal: 'Pragmatic technology infused with human warmth.',
      quickLinks: 'Quick Links',
      channels: 'Direct Channels',
      rights: 'All rights reserved. Beeginning 4 you.',
      privacyCommitment: 'Privacy & Data Protection Commitment (LGPD)',
    }
  }
};
