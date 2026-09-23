import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowDown, 
  Infinity, 
  Sparkles, 
  CheckCircle2, 
  Puzzle, 
  Lightbulb, 
  BarChart3, 
  Laptop, 
  Search, 
  Users2, 
  Compass, 
  Workflow, 
  Heart,
  Quote
} from 'lucide-react';
import BeeLogo from './BeeLogo';
import reginaPhoto from '../assets/images/regina_portrait_1790082408093.jpg';
import { getContactConfig, STORAGE_CHANGE_EVENT } from '../utils/adminStorage';
import { useLanguage } from '../context/LanguageContext';
import { TRANSLATIONS } from '../data/translations';

interface AboutUsProps {
  onOpenConversation?: () => void;
}

export default function AboutUs({ onOpenConversation }: AboutUsProps) {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language].about;
  const isEn = language === 'en';

  const [photoUrl, setPhotoUrl] = useState<string>(() => {
    const cfg = getContactConfig();
    return cfg.profilePhotoUrl || reginaPhoto;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const cfg = getContactConfig();
      setPhotoUrl(cfg.profilePhotoUrl || reginaPhoto);
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handleUpdate);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handleUpdate);
  }, []);

  const handleCtaClick = () => {
    if (onOpenConversation) {
      onOpenConversation();
    } else {
      const el = document.querySelector('#diagnostico-final') || document.querySelector('#contato');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="quem-somos"
      className="py-20 sm:py-28 bg-[#FAF8F5] border-b border-[#E8E4DD] relative overflow-hidden"
    >
      {/* Soft Ambient Background Elements */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#E5A93B]/6 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-1/4 left-10 w-[400px] h-[400px] bg-[#1E3A47]/4 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-24 sm:space-y-32">

        {/* =========================================================================
            A Beeginning
        ========================================================================== */}
        <div id="a-beeginning" className="text-center max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5A93B]/15 text-[#9E6B08] text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#D99B26]" />
            <span>{t.badge1}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#181B1E] tracking-tight leading-[1.2]">
            {isEn ? (
              <>
                "It's not about having all the answers.<br className="hidden sm:inline" />
                <span className="text-[#D99B26] relative inline-block mt-1 sm:mt-0 ml-0 sm:ml-2">
                  It's about starting.
                  <svg
                    className="w-full h-3 text-[#D99B26]/60 absolute -bottom-2 left-0"
                    viewBox="0 0 200 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M2 6 C 50 2, 150 2, 198 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>"
              </>
            ) : (
              <>
                "Não é sobre ter todas as respostas.<br className="hidden sm:inline" />
                <span className="text-[#D99B26] relative inline-block mt-1 sm:mt-0 ml-0 sm:ml-2">
                  É sobre começar.
                  <svg
                    className="w-full h-3 text-[#D99B26]/60 absolute -bottom-2 left-0"
                    viewBox="0 0 200 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M2 6 C 50 2, 150 2, 198 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>"
              </>
            )}
          </h2>

          <p className="mt-8 text-base sm:text-lg text-[#55585D] leading-relaxed max-w-2xl mx-auto">
            {isEn
              ? 'Every meaningful accomplishment was born from a simple first step: shaping an aspiration, bringing it to life, and building side by side without friction.'
              : 'Toda grande realização nasceu de um primeiro passo simples: dar contorno a uma inquietação, colocar no papel e construir lado a lado sem complicação.'}
          </p>
        </div>


        {/* =========================================================================
            Quem está por trás (Regina)
        ========================================================================== */}
        <div
          id="quem-esta-por-tras"
          className="bg-white rounded-3xl p-6 sm:p-10 lg:p-14 border border-[#E8E4DD] shadow-sm relative overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Foto profissional e humana da Regina */}
            <div className="lg:col-span-5 flex flex-col items-center text-center">
              <div className="relative w-full max-w-xs sm:max-w-sm rounded-2xl overflow-hidden border-2 border-[#FAF8F5] shadow-md group">
                <img
                  src={photoUrl}
                  alt={isEn ? "Regina, founder of Beeginning 4 you — Warm, authentic portrait" : "Regina, fundadora da Beeginning 4 you — Foto profissional, acolhedora e humana"}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto aspect-[3/4] object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181B1E]/80 via-transparent to-transparent opacity-90" />
                
                {/* Legenda na foto */}
                <div className="absolute bottom-4 left-4 right-4 text-left text-white">
                  <p className="font-display font-bold text-lg leading-tight text-white">Regina</p>
                  <p className="text-xs text-[#E5A93B] font-medium mt-0.5">{t.subtitle2}</p>
                  <p className="text-[11px] text-[#E0E0DB] mt-1 leading-snug">
                    {t.photoLegend}
                  </p>
                </div>
              </div>

              {/* Selo de proximidade humana */}
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E8E4DD] text-xs text-[#55585D]">
                <Heart className="w-3.5 h-3.5 text-[#D99B26]" />
                <span>{t.humanSeal}</span>
              </div>
            </div>

            {/* Texto de Apresentação da Regina */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A47]/8 text-[#1E3A47] text-xs font-semibold uppercase tracking-wider">
                <Users2 className="w-3.5 h-3.5 text-[#D99B26]" />
                <span>{t.badge2}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[#181B1E] leading-snug">
                {t.title2}
              </h3>

              <div className="space-y-4 text-sm sm:text-base text-[#404348] leading-relaxed">
                <p>
                  {isEn
                    ? "I've always loved understanding how things work — and, above all, discovering how they could work so much better."
                    : "Eu sempre gostei de entender como as coisas funcionam — e, principalmente, de descobrir como poderiam funcionar melhor."}
                </p>
                <p>
                  {isEn ? (
                    <>For more than <strong>22 years in the corporate environment</strong>, I worked directly with business processes, financial metrics, systems, technology, and people.</>
                  ) : (
                    <>Foram mais de <strong>22 anos vivendo o mundo corporativo</strong>, trabalhando com processos, números, tecnologia, sistemas e pessoas.</>
                  )}
                </p>
                <p>
                  {isEn
                    ? "Along this journey, I learned to look at challenges through multiple lenses: pinpointing what truly needs fixing, decluttering complexity, and transforming an abstract idea into something that reliably works."
                    : "Nesse caminho, aprendi a olhar para um problema por diferentes ângulos: entender o que realmente precisa ser resolvido, organizar a complexidade e transformar uma ideia em algo que funcione de verdade."}
                </p>
                <p>
                  {isEn
                    ? "Yet I also realized that this practical skill didn't belong solely inside enterprise giants."
                    : "Mas também descobri que essa habilidade não precisava ficar restrita às grandes empresas."}
                </p>
                <p className="text-[#181B1E] font-medium bg-[#FAF8F5] p-4 rounded-xl border-l-4 border-[#D99B26]">
                  {isEn ? (
                    <><strong>Beeginning 4 you</strong> was born from that exact spark: the desire to channel this wealth of experience to help people and small businesses bring ideas to life — in a way that is simpler, closer, and genuinely achievable.</>
                  ) : (
                    <>A <strong>Beeginning 4 you</strong> nasceu daí. Da vontade de usar toda essa experiência para ajudar pessoas e pequenos negócios a tirarem ideias do papel — de um jeito mais simples, próximo e possível.</>
                  )}
                </p>
                <p className="italic text-[#55585D]">
                  {isEn
                    ? '"Because I believe a great solution does not have to be convoluted. It simply needs to make sense for whoever uses it."'
                    : '"Porque eu acredito que uma boa solução não precisa ser complicada. Ela precisa fazer sentido para quem vai usá-la."'}
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* =========================================================================
            O que eu trago comigo
        ========================================================================== */}
        <div id="o-que-eu-trago" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5A93B]/15 text-[#9E6B08] text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#D99B26]" />
              <span>{t.badge3}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[#181B1E]">
              {t.title3}
            </h3>
            <p className="mt-2 text-sm sm:text-base text-[#55585D]">
              {t.subtitle3}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: 🧩 Visão de processos */}
            <div
              id="card-trago-processos"
              className="p-6 rounded-2xl bg-white border border-[#E8E4DD] hover:border-[#D99B26]/50 hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                🧩
              </div>
              <h4 className="text-base sm:text-lg font-bold text-[#181B1E] flex items-center gap-2">
                {t.cards3[0].title}
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-[#55585D] leading-relaxed">
                {t.cards3[0].desc}
              </p>
            </div>

            {/* Card 2: 💡 Pensamento criativo */}
            <div
              id="card-trago-criativo"
              className="p-6 rounded-2xl bg-white border border-[#E8E4DD] hover:border-[#D99B26]/50 hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                💡
              </div>
              <h4 className="text-base sm:text-lg font-bold text-[#181B1E] flex items-center gap-2">
                {t.cards3[1].title}
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-[#55585D] leading-relaxed">
                {t.cards3[1].desc}
              </p>
            </div>

            {/* Card 3: 📊 Experiência com negócios */}
            <div
              id="card-trago-negocios"
              className="p-6 rounded-2xl bg-white border border-[#E8E4DD] hover:border-[#D99B26]/50 hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                📊
              </div>
              <h4 className="text-base sm:text-lg font-bold text-[#181B1E] flex items-center gap-2">
                {t.cards3[2].title}
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-[#55585D] leading-relaxed">
                {t.cards3[2].desc}
              </p>
            </div>

            {/* Card 4: 💻 Tecnologia e sistemas */}
            <div
              id="card-trago-tecnologia"
              className="p-6 rounded-2xl bg-white border border-[#E8E4DD] hover:border-[#D99B26]/50 hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                💻
              </div>
              <h4 className="text-base sm:text-lg font-bold text-[#181B1E] flex items-center gap-2">
                {isEn ? "Technology & Systems" : "Tecnologia e sistemas"}
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-[#55585D] leading-relaxed">
                {isEn
                  ? "Modern web tools, lean automations, and light architecture in service of human beings — never the other way around."
                  : "Ferramentas modernas, automações e arquiteturas leves colocadas a serviço das pessoas — e nunca o contrário."}
              </p>
            </div>

            {/* Card 5: 🔎 Olhar para detalhes */}
            <div
              id="card-trago-detalhes"
              className="p-6 rounded-2xl bg-white border border-[#E8E4DD] hover:border-[#D99B26]/50 hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                🔎
              </div>
              <h4 className="text-base sm:text-lg font-bold text-[#181B1E] flex items-center gap-2">
                {t.cards3[3].title}
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-[#55585D] leading-relaxed">
                {t.cards3[3].desc}
              </p>
            </div>

            {/* Card 6: 🤝 Construção lado a lado */}
            <div
              id="card-trago-lado-a-lado"
              className="p-6 rounded-2xl bg-white border border-[#E8E4DD] hover:border-[#D99B26]/50 hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                🤝
              </div>
              <h4 className="text-base sm:text-lg font-bold text-[#181B1E] flex items-center gap-2">
                {t.cards3[4].title}
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-[#55585D] leading-relaxed">
                {t.cards3[4].desc}
              </p>
            </div>
          </div>
        </div>


        {/* =========================================================================
            Linha do Tempo / Trajetória
        ========================================================================== */}
        <div id="trajetoria" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A47]/8 text-[#1E3A47] text-xs font-semibold uppercase tracking-wider mb-3">
              <Workflow className="w-3.5 h-3.5 text-[#D99B26]" />
              <span>{t.badge4}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[#181B1E]">
              {t.title4}
            </h3>
            <p className="mt-2 text-sm sm:text-base text-[#55585D]">
              {t.subtitle4}
            </p>
          </div>

          <div className="max-w-2xl mx-auto flex flex-col items-center">
            {/* Step 1 */}
            <div
              id="trajetoria-etapa-1"
              className="w-full bg-white rounded-2xl p-6 border border-[#E8E4DD] shadow-xs text-center relative hover:border-[#D99B26]/40 transition-colors"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-[#FAF8F5] text-xs font-bold text-[#D99B26] uppercase tracking-wider mb-2">
                {isEn ? "Step 01 • Background" : "Passo 01 • Bagagem"}
              </span>
              <p className="text-lg sm:text-xl font-display font-bold text-[#181B1E]">
                {t.timeline4[0].period}
              </p>
              <p className="text-xs sm:text-sm text-[#55585D] mt-1">
                {t.timeline4[0].text}
              </p>
            </div>

            {/* Conexão ↓ */}
            <div className="my-3 flex flex-col items-center">
              <div className="w-0.5 h-6 bg-[#D99B26]/40" />
              <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#D99B26]/40 text-[#D99B26] flex items-center justify-center text-sm shadow-xs">
                <ArrowDown className="w-4 h-4 text-[#D99B26]" />
              </div>
              <div className="w-0.5 h-6 bg-[#D99B26]/40" />
            </div>

            {/* Step 2 */}
            <div
              id="trajetoria-etapa-2"
              className="w-full bg-white rounded-2xl p-6 border border-[#E8E4DD] shadow-xs text-center relative hover:border-[#D99B26]/40 transition-colors"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-[#FAF8F5] text-xs font-bold text-[#1E3A47] uppercase tracking-wider mb-2">
                {isEn ? "Step 02 • Foundations" : "Passo 02 • Fundamentos"}
              </span>
              <p className="text-lg sm:text-xl font-display font-bold text-[#181B1E]">
                {isEn ? "Processes • numbers • systems • technology" : "Processos • números • sistemas • tecnologia"}
              </p>
              <p className="text-xs sm:text-sm text-[#55585D] mt-1">
                {isEn
                  ? "Mastering logic, organizing business data, and structuring resilient systems that run smoothly."
                  : "Dominar a lógica, organizar dados e arquitetar estruturas sólidas que funcionam sem quebrar."}
              </p>
            </div>

            {/* Conexão ↓ */}
            <div className="my-3 flex flex-col items-center">
              <div className="w-0.5 h-6 bg-[#D99B26]/40" />
              <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#D99B26]/40 text-[#D99B26] flex items-center justify-center text-sm shadow-xs">
                <ArrowDown className="w-4 h-4 text-[#D99B26]" />
              </div>
              <div className="w-0.5 h-6 bg-[#D99B26]/40" />
            </div>

            {/* Step 3 */}
            <div
              id="trajetoria-etapa-3"
              className="w-full bg-white rounded-2xl p-6 border border-[#E8E4DD] shadow-xs text-center relative hover:border-[#D99B26]/40 transition-colors"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-[#FAF8F5] text-xs font-bold text-[#2D7A4B] uppercase tracking-wider mb-2">
                {isEn ? "Step 03 • Reality" : "Passo 03 • Realidade"}
              </span>
              <p className="text-lg sm:text-xl font-display font-bold text-[#181B1E]">
                {isEn ? "Projects • people • real challenges" : "Projetos • pessoas • problemas reais"}
              </p>
              <p className="text-xs sm:text-sm text-[#55585D] mt-1">
                {isEn
                  ? "Understanding that technology only holds true value when solving real struggles of everyday human beings."
                  : "Entender que ferramentas só têm valor quando resolvem a dor real de seres humanos no dia a dia."}
              </p>
            </div>

            {/* Conexão ↓ */}
            <div className="my-3 flex flex-col items-center">
              <div className="w-0.5 h-6 bg-[#D99B26]/40" />
              <div className="w-8 h-8 rounded-full bg-[#E5A93B]/20 border border-[#D99B26] text-[#D99B26] flex items-center justify-center text-sm shadow-xs">
                <ArrowDown className="w-4 h-4 text-[#D99B26]" />
              </div>
              <div className="w-0.5 h-6 bg-[#D99B26]/40" />
            </div>

            {/* Step 4: Beeginning 4 you */}
            <div
              id="trajetoria-etapa-4"
              className="w-full bg-gradient-to-br from-[#181B1E] to-[#252A30] rounded-2xl p-8 text-center text-white shadow-lg border border-[#323842] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E5A93B]/15 rounded-full blur-2xl pointer-events-none" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5A93B]/20 text-[#E5A93B] text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isEn ? "Destination & Purpose" : "O Destino & Missão"}</span>
              </span>
              <h4 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                Beeginning <span className="text-[#E5A93B]">4 you</span>
              </h4>
              <p className="text-base sm:text-lg text-[#F0EDE6] font-medium mt-2">
                {t.timeline4[2].headline}
              </p>
              <p className="text-xs sm:text-sm text-[#9CA3AF] mt-2 max-w-lg mx-auto">
                {t.timeline4[2].text}
              </p>
            </div>
          </div>
        </div>


        {/* =========================================================================
            O lado pessoal e criativo
        ========================================================================== */}
        <div
          id="lado-pessoal-criativo"
          className="bg-white rounded-3xl p-8 sm:p-12 lg:p-14 border border-[#E8E4DD] shadow-sm relative overflow-hidden"
        >
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5A93B]/15 text-[#9E6B08] text-xs font-semibold uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-[#D99B26]" />
              <span>{t.badge5}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[#181B1E]">
              {t.title5}
            </h3>

            {/* Texto autêntico */}
            <div className="space-y-4 text-base sm:text-lg text-[#404348] leading-relaxed text-left sm:text-center">
              <p>
                {isEn
                  ? "Beeginning also carries a lot of who I am personally. I am genuinely curious. I love exploring new possibilities, and looking under the hood of tools we use every single day."
                  : "Mas a Beeginning também tem muito de mim. Eu sou curiosa. Gosto de aprender coisas novas, testar possibilidades e entender o que existe por trás das ferramentas que usamos todos os dias."}
              </p>
              <p>
                {isEn
                  ? "I have a deeply analytical side — I adore structuring, analyzing metrics, and charting clear paths. Yet I also have an artistic, creative side that loves designing, experimenting, and turning an idea that lives only in one's head into something tangible we can see, touch, and use."
                  : "Tenho um lado bastante lógico — adoro organizar, analisar e encontrar caminhos. Mas também tenho um lado criativo que gosta de experimentar, criar e transformar uma ideia que existe apenas na cabeça em alguma coisa que podemos enxergar e usar."}
              </p>
              <p className="font-semibold text-[#181B1E] pt-2">
                {isEn
                  ? "It is precisely at this crossroads of logic and creativity that Beeginning was born."
                  : "É justamente desse encontro entre lógica e criatividade que a Beeginning nasceu."}
              </p>
            </div>

            {/* Visual Duality: Lógica & Criatividade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 text-left">
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF]">
                <span className="text-xs font-bold text-[#1E3A47] uppercase tracking-wider block mb-1">
                  {isEn ? "The Logical Mind 📐" : "O Lado Lógico 📐"}
                </span>
                <p className="text-xs sm:text-sm text-[#55585D]">
                  {isEn
                    ? "Structuring, calculating, mapping operational routines, forecasting scenarios, and ensuring stability in every built feature."
                    : "Estruturar, calcular, mapear rotinas, prever cenários e garantir estabilidade em cada linha construída."}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF]">
                <span className="text-xs font-bold text-[#D99B26] uppercase tracking-wider block mb-1">
                  {isEn ? "The Creative Spirit 🎨" : "O Lado Criativo 🎨"}
                </span>
                <p className="text-xs sm:text-sm text-[#55585D]">
                  {isEn
                    ? "Experimenting, shaping inviting visual interfaces, designing smooth user flows, and giving aesthetic life to your vision."
                    : "Experimentar, desenhar interfaces agradáveis, criar soluções fluidas e dar vida estética ao que você sonhou."}
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* =========================================================================
            Como eu penso
        ========================================================================== */}
        <div
          id="como-eu-penso"
          className="bg-gradient-to-r from-[#F5F2EA] via-[#FAF8F5] to-[#F5F2EA] rounded-3xl p-8 sm:p-12 lg:p-16 border border-[#E2DDD5] text-center relative overflow-hidden shadow-xs"
        >
          <Quote className="w-12 h-12 text-[#D99B26]/30 mx-auto mb-4" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181B1E]/6 text-[#181B1E] text-xs font-semibold uppercase tracking-wider mb-6">
            <span>{t.badge6}</span>
          </div>

          <p className="font-display font-bold text-2xl sm:text-3xl lg:text-4.5xl text-[#181B1E] max-w-3xl mx-auto leading-snug tracking-tight">
            {isEn ? (
              <>
                "I don't start with the tool.<br className="hidden sm:inline" />
                <span className="text-[#D99B26]"> I start with the problem.</span>"
              </>
            ) : (
              <>
                "Eu não começo pela ferramenta.<br className="hidden sm:inline" />
                <span className="text-[#D99B26]"> Começo pelo problema.</span>"
              </>
            )}
          </p>

          <p className="mt-6 text-sm sm:text-base text-[#55585D] max-w-xl mx-auto leading-relaxed">
            {isEn
              ? "Most of the time you don't need a thousand-dollar enterprise software. You need a clear workflow, an honest landing page, or a focused automation that actually solves today's bottleneck."
              : "Muitas vezes você não precisa de um software complexo de milhares de reais. Você precisa de um fluxo claro, de uma boa página ou de uma automação que realmente resolva o gargalo de hoje."}
          </p>
        </div>


        {/* =========================================================================
            Por que Beeginning 4 you?
        ========================================================================== */}
        <div
          id="por-que-beeginning"
          className="bg-white rounded-3xl p-8 sm:p-12 lg:p-14 border border-[#E8E4DD] shadow-sm relative overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Logo Mark Presentation */}
            <div className="lg:col-span-5 flex flex-col items-center text-center bg-[#FAF8F5] rounded-2xl p-8 border border-[#ECE7DF]">
              <div className="p-4 bg-white rounded-2xl border border-[#EAE6DF] shadow-xs mb-5">
                <BeeLogo size="lg" layout="stacked" theme="light" showTagline={false} />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5A93B]/20 text-[#9E6B08] text-xs font-bold mb-3">
                <Infinity className="w-4 h-4" />
                <span>{isEn ? "The Continuous Line & Infinity" : "O Traço Contínuo & O Infinito"}</span>
              </div>

              <p className="text-xs text-[#55585D] leading-relaxed">
                {t.p7_wings}
              </p>
            </div>

            {/* Explicação da Essência */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5A93B]/15 text-[#9E6B08] text-xs font-semibold uppercase tracking-wider">
                <Infinity className="w-3.5 h-3.5 text-[#D99B26]" />
                <span>{t.badge7}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#181B1E]">
                {t.title7}
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-[#55585D]">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFECE6]">
                  <span className="font-bold text-[#D99B26] block uppercase tracking-wider text-xs">
                    Bee ({isEn ? "The Worker Bee" : "A Abelha"})
                  </span>
                  <p className="mt-1 text-[#404348]">
                    {isEn
                      ? "Inspired by the dedicated and collaborative labor of bees: each pollination links points and blossoms into results that nurture the wider community."
                      : "Inspirada no trabalho dedicado e colaborativo das abelhas: cada polinização conecta pontos e floresce resultados que sustentam a comunidade."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFECE6]">
                  <span className="font-bold text-[#181B1E] block uppercase tracking-wider text-xs">
                    🌱 Beginning ({isEn ? "The Fresh Start" : "O Começo"})
                  </span>
                  <p className="mt-1 text-[#404348]">
                    {isEn
                      ? "The courage to take the first step. You do not need everything in perfection to begin; what matters is bringing the idea into the physical world with tangible contours."
                      : "A coragem de dar o primeiro passo. Você não precisa ter tudo perfeito para começar; o importante é tirar a ideia da cabeça e dar-lhe contorno tangível."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFECE6]">
                  <span className="font-bold text-[#9E6B08] block uppercase tracking-wider text-xs">
                    ✨ 4 You ({isEn ? "For You" : "Para Você"})
                  </span>
                  <p className="mt-1 text-[#404348]">
                    {isEn
                      ? "The number 4 in warm mustard symbolizes tailored, handcrafted solutions. No generic templates or rigid packages: we engineer what genuinely makes sense for your operational reality."
                      : "O número 4 em mostarda acolhedor simboliza soluções feitas sob medida. Nada de fórmulas genéricas ou pacotes engessados: pensamos no que faz sentido especificamente para a sua realidade."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* =========================================================================
            BLOCO 08 — Chamada para Ação (CTA)
        ========================================================================== */}
        <div
          id="bloco-08-cta-final"
          className="bg-[#181B1E] text-white rounded-3xl p-8 sm:p-12 lg:p-14 text-center relative overflow-hidden shadow-xl"
        >
          {/* Subtle gold glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#E5A93B]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5A93B]/20 text-[#E5A93B] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEn ? "The Next Step" : "O Próximo Passo"}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
              {t.ctaTitle1}<br />
              <span className="text-[#E5A93B]">{t.ctaTitle2}</span>
            </h3>

            <p className="text-sm sm:text-base text-[#D1D5DB] leading-relaxed">
              {isEn
                ? "Have a project on pause, a chaotic workflow in your business, or a vision waiting to emerge? Let's talk calmly, without tech buzzwords, to uncover the optimal path."
                : "Tem um projeto parado, um processo confuso no seu negócio ou uma ideia esperando para nascer? Vamos conversar com calma, sem jargões e descobrir o melhor caminho."}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                id="btn-conte-sua-ideia"
                onClick={handleCtaClick}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#E5A93B] hover:bg-[#D99B26] text-[#181B1E] text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <span>{isEn ? "SHARE YOUR IDEA" : "CONTE SUA IDEIA"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
