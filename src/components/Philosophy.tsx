import { useState } from 'react';
import { PHILOSOPHY_STEPS } from '../data/content';
import {
  Lightbulb,
  MonitorSmartphone,
  TrendingUp,
  Heart,
  Compass,
  Rocket,
  CheckCircle2,
  PenTool,
  ArrowRight
} from 'lucide-react';

export default function Philosophy() {
  const [activeTab, setActiveTab] = useState<'ideia' | 'forma' | 'solucao'>('forma');

  const stepDetails = {
    ideia: {
      title: 'Ideia',
      quote: 'Todo negócio começa com uma inquietação e o desejo de fazer melhor.',
      description: 'Ouvimos atentamente a sua história, filtramos o que é essencial e eliminamos o excesso para clarear o ponto de partida.',
      action: 'Diagnóstico da dor real e foco prioritário.'
    },
    forma: {
      title: 'Construção & Forma',
      quote: 'Uma boa ideia precisa de contorno para ser compreendida e desejada.',
      description: 'Desenhamos uma presença limpa, objetiva e acolhedora, com processos intuitivos que seus clientes usam sem esforço.',
      action: 'Prototipação prática e identidade funcional.'
    },
    solucao: {
      title: 'Solução & Possibilidade',
      quote: 'Tecnologia que trabalha para você, não você trabalhando para ela.',
      description: 'Entregamos ferramentas vivas, rápidas e integradas à sua rotina, devolvendo tempo livre e previsibilidade financeira.',
      action: 'Autonomia real sem dependência técnica.'
    }
  };

  return (
    <section
      id="filosofia"
      className="py-20 sm:py-28 bg-[#FAF8F5] border-y border-[#EAE6DF] relative overflow-hidden"
    >
      {/* Clean background without dots */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Top Header Tag */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A47]/8 text-[#1E3A47] text-xs font-bold uppercase tracking-wider">
            <PenTool className="w-3.5 h-3.5 text-[#D99B26]" />
            Construção e Recomeços
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#181B1E] tracking-tight">
            Nossa Visão & Compromisso
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#555555]">
            Para pequenos negócios que precisam de soluções digitais humanas, bonitas e eficientes.
          </p>
        </div>

        {/* The Exact Split Layout From The Reference Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-md border border-[#E5E0D8]">
          {/* Left Column: NOSSA FILOSOFIA (Warm Off-white tone) */}
          <div className="lg:col-span-6 bg-[#FAF7F2] p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E8E3DA]">
            <div className="space-y-6">
              {/* Header with yellow accent line */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#181B1E]">
                  NOSSA FILOSOFIA
                </h3>
                <div className="w-12 h-1 bg-[#E5A93B] mt-2 rounded-full" />
              </div>

              {/* Manifesto Text */}
              <div className="space-y-4 text-[#2E3136] text-base sm:text-lg leading-relaxed">
                <p className="font-semibold text-[#181B1E]">
                  Todo negócio começa com uma ideia.<br />
                  Uma ideia precisa de forma.<br />
                  E uma boa solução transforma essa forma em possibilidade.
                </p>

                <p className="text-[#55585D] text-sm sm:text-base leading-relaxed pt-2">
                  A <strong>Beeginning 4 You</strong> existe para ajudar pequenos negócios a dar esse primeiro passo — criando ferramentas digitais simples, bonitas, práticas e pensadas para a realidade de quem empreende.
                </p>
              </div>

              {/* Interactive Path: Ideia ➔ Construção ➔ Solução */}
              <div className="pt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#8A8F98] mb-3 flex items-center justify-between">
                  <span>O Caminho de Transformação</span>
                  <span className="text-[11px] text-[#D99B26] font-semibold">Clique para explorar</span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-1.5 bg-white/80 backdrop-blur-xs rounded-xl border border-[#E8E3DA]">
                  {(['ideia', 'forma', 'solucao'] as const).map((stepKey) => {
                    const isCurrent = activeTab === stepKey;
                    return (
                      <button
                        key={stepKey}
                        onClick={() => setActiveTab(stepKey)}
                        className={`px-2 sm:px-3 py-2 text-xs font-bold rounded-lg transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                          isCurrent
                            ? 'bg-[#181B1E] text-white shadow-xs'
                            : 'text-[#55585D] hover:bg-[#F2EFE8] hover:text-[#181B1E]'
                        }`}
                      >
                        <span className="text-[10px] opacity-75 uppercase">
                          {stepKey === 'ideia' ? '01' : stepKey === 'forma' ? '02' : '03'}
                        </span>
                        <span className="capitalize">{stepDetails[stepKey].title.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Micro Step Insight */}
                <div className="mt-3 p-3.5 rounded-xl bg-white/70 border border-[#E8E3DA] text-xs text-[#444444] space-y-1">
                  <span className="font-bold text-[#1E3A47] block">
                    {stepDetails[activeTab].title}:
                  </span>
                  <p className="italic text-[#555555]">
                    &ldquo;{stepDetails[activeTab].quote}&rdquo;
                  </p>
                  <p className="text-[#333333] pt-0.5">
                    {stepDetails[activeTab].description}
                  </p>
                </div>
              </div>
            </div>

            {/* Handwritten Script Callout with Golden Underline (Exact match to reference image) */}
            <div className="pt-8 sm:pt-10">
              <div className="relative inline-block">
                <p className="font-script text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-[#181B1E] leading-[1.25]">
                  Ideias são o começo.<br />
                  Soluções fazem acontecer.
                </p>
                {/* Organic curved underline */}
                <svg
                  className="w-full max-w-[280px] h-3 text-[#E5A93B] mt-1"
                  viewBox="0 0 280 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 8.5C65 3.5 160 2.5 277 8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Column: POR QUE ESCOLHER A Beeginning 4 You? (Deep Graphite / Dark Charcoal) */}
          <div className="lg:col-span-6 bg-[#181B1E] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
            <div className="space-y-8">
              {/* Header with yellow accent line */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#F3F4F6]">
                  POR QUE ESCOLHER A Beeginning 4 You?
                </h3>
                <div className="w-12 h-1 bg-[#E5A93B] mt-2 rounded-full" />
              </div>

              {/* 4 Core Pillars from the reference image */}
              <div className="space-y-6 sm:space-y-7">
                {/* 1. Soluções sob medida */}
                <div className="flex items-start gap-4 group">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#E5A93B] shrink-0 group-hover:scale-105 group-hover:bg-[#E5A93B]/10 transition-all">
                    <Lightbulb className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white">
                      Soluções sob medida
                    </h4>
                    <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5 leading-relaxed">
                      Cada negócio é único. A gente cria o que você realmente precisa.
                    </p>
                  </div>
                </div>

                {/* 2. Tecnologia acessível */}
                <div className="flex items-start gap-4 group">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#E5A93B] shrink-0 group-hover:scale-105 group-hover:bg-[#E5A93B]/10 transition-all">
                    <MonitorSmartphone className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white">
                      Tecnologia acessível
                    </h4>
                    <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5 leading-relaxed">
                      Ferramentas modernas, simples de usar e fáceis de administrar.
                    </p>
                  </div>
                </div>

                {/* 3. Visão de resultado */}
                <div className="flex items-start gap-4 group">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#E5A93B] shrink-0 group-hover:scale-105 group-hover:bg-[#E5A93B]/10 transition-all">
                    <TrendingUp className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white">
                      Visão de resultado
                    </h4>
                    <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5 leading-relaxed">
                      Mais do que um site, entregamos dados e insights para o seu crescimento.
                    </p>
                  </div>
                </div>

                {/* 4. Parceria de verdade */}
                <div className="flex items-start gap-4 group">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#E5A93B] shrink-0 group-hover:scale-105 group-hover:bg-[#E5A93B]/10 transition-all">
                    <Heart className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white">
                      Parceria de verdade
                    </h4>
                    <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5 leading-relaxed">
                      Estamos com você em cada etapa, com escuta, clareza e suporte.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Question Quote Banner */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-[#E5A93B] font-semibold uppercase tracking-wider mb-1">
                  Não é tecnologia pela tecnologia.
                </p>
                <p className="text-sm sm:text-base font-bold text-white">
                  &ldquo;O que esse negócio realmente precisa?&rdquo;
                </p>
                <p className="text-xs text-[#A0A5AE] mt-1">
                  E então construir isso com carinho e precisão.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Callout from reference: "Seu negócio começa aqui..." in Baguet Script */}
        <div className="mt-8 flex justify-end px-2 sm:px-6">
          <div className="inline-flex items-center gap-3">
            <span className="w-12 h-px bg-[#D99B26]/60" />
            <p className="font-baguet text-3xl sm:text-4xl lg:text-5xl text-[#181B1E] tracking-normal">
              Seu negócio começa aqui...
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
