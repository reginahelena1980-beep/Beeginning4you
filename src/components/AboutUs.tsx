import { Infinity, Sparkles, TrendingUp, Compass, Heart, ArrowRight } from 'lucide-react';
import BeeLogo from './BeeLogo';

export default function AboutUs() {
  return (
    <section
      id="quem-somos"
      className="py-20 sm:py-28 bg-[#FFFFFF] border-b border-[#EAE6DF] relative overflow-hidden"
    >
      {/* Subtle ambient light aura */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#E5A93B]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1E3A47]/8 text-[#1E3A47] text-xs font-bold uppercase tracking-wider">
            <Infinity className="w-4 h-4 text-[#D99B26]" />
            Quem Somos
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#181B1E] tracking-tight">
            O Significado por Trás da <span className="text-[#181B1E]">Beeginning</span> <span className="text-[#D99B26]">4 You</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#55585D] leading-relaxed">
            Mais do que uma agência de soluções digitais: um movimento para transformar o primeiro passo de quem empreende em uma jornada contínua de evolução.
          </p>
        </div>

        {/* Core Presentation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: The Visual Symbol & Mathematical Concept */}
          <div className="lg:col-span-5 bg-[#FAF8F5] rounded-3xl p-8 sm:p-10 border border-[#E8E3DA] shadow-xs relative overflow-hidden flex flex-col items-center text-center">
            {/* Soft decorative background element */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#E5A93B]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Logo Mark Highlight */}
            <div className="p-6 bg-white rounded-2xl border border-[#ECE7DF] shadow-xs mb-6 inline-flex items-center justify-center">
              <BeeLogo size="lg" theme="light" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5A93B]/15 text-[#9E6B08] text-xs font-bold mb-4">
              <Infinity className="w-4 h-4" />
              <span>O Símbolo do Infinito (∞)</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#181B1E]">
              Crescimento Contínuo e Sem Limites
            </h3>

            <p className="mt-3 text-sm sm:text-base text-[#55585D] leading-relaxed">
              Na matemática, o símbolo do <strong>infinito (∞)</strong> representa aquilo que não tem fronteiras ou interrupção. No desenho da nossa abelhinha, as asinhas em formato de infinito e a linha de voo contínua simbolizam que <strong>o início nunca é um ponto final</strong>: é o disparo de um ciclo infinito de melhoria, adaptação e expansão.
            </p>

            <div className="mt-6 w-full grid grid-cols-2 gap-3 pt-6 border-t border-[#EAE6DF] text-left">
              <div className="p-3 bg-white rounded-xl border border-[#EFECE6]">
                <span className="text-xs font-bold text-[#D99B26] block uppercase tracking-wider">
                  Bee (Abelha)
                </span>
                <p className="text-xs text-[#55585D] mt-1">
                  Trabalho dedicado, cooperação comunitária e polinização que gera frutos reais.
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#EFECE6]">
                <span className="text-xs font-bold text-[#181B1E] block uppercase tracking-wider">
                  Beginning
                </span>
                <p className="text-xs text-[#55585D] mt-1">
                  A coragem de começar, recomeçar e dar forma palpável ao seu projeto.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Three Pillars of Beeginning 4 You */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-7 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] hover:border-[#D99B26]/40 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#E5A93B]/20 text-[#D99B26] flex items-center justify-center shrink-0 mt-0.5">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#181B1E]">
                    1. A Origem: Por que nascemos?
                  </h4>
                  <p className="mt-2 text-sm sm:text-base text-[#55585D] leading-relaxed">
                    Sabemos que a maioria dos pequenos negócios se sente sobrecarregada pelo excesso de jargões técnicos e soluções caras que não resolvem a dor do dia a dia. A <strong>Beeginning 4 You</strong> nasceu para ser a ponte acolhedora que descomplica a tecnologia e coloca ferramentas funcionais na mão de quem faz o negócio acontecer.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] hover:border-[#D99B26]/40 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#1E3A47]/10 text-[#1E3A47] flex items-center justify-center shrink-0 mt-0.5">
                  <Infinity className="w-5 h-5 text-[#1E3A47]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#181B1E]">
                    2. A Conexão com o Logo: O Traço Contínuo
                  </h4>
                  <p className="mt-2 text-sm sm:text-base text-[#55585D] leading-relaxed">
                    Repare na linha fluida que sai da palavra <strong>"Bee"</strong> e entra perfeitamente no corpo da abelha: ela reflete a continuidade ininterrupta entre a sua ideia inicial e o futuro do seu negócio. Não há saltos misteriosos; tudo é construído de forma orgânica, passo a passo, sem arestas soltas.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] hover:border-[#D99B26]/40 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#2D7A4B]/15 text-[#2D7A4B] flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#181B1E]">
                    3. O "4 You": Feito Sob Medida Para Você
                  </h4>
                  <p className="mt-2 text-sm sm:text-base text-[#55585D] leading-relaxed">
                    Destacamos o número <strong>4</strong> em tom mostarda acolhedor porque acreditamos em soluções personalizadas. Não vendemos templates genéricos: olhamos nos olhos, entendemos o seu processo e entregamos sistemas que respeitam seu tempo, sua equipe e seus clientes.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick quote box */}
            <div className="p-5 rounded-xl bg-[#181B1E] text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#E5A93B] shrink-0" />
                <p className="text-xs sm:text-sm text-[#E0E0DB]">
                  Pronto para dar o primeiro passo do seu crescimento contínuo?
                </p>
              </div>
              <a
                href="#contato"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E5A93B] hover:bg-[#D99B26] text-[#181B1E] text-xs font-bold transition-colors shrink-0"
              >
                <span>Falar Conosco</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
