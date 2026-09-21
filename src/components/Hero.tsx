import { ArrowRight } from 'lucide-react';
import BeeLogo from './BeeLogo';
import workspacePhoto from '../assets/images/vivobook_rose_workspace_1789572652740.jpg';

interface HeroProps {
  onOpenDiagnostic: () => void;
  onSelectChallenge?: (challengeId: string) => void;
}

export default function Hero({ onOpenDiagnostic }: HeroProps) {
  const scrollToSection = (id: string) => {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="inicio"
      className="relative pt-24 sm:pt-28 pb-16 sm:pb-20 overflow-hidden bg-[#FAF8F5]"
    >
      {/* Background Soft Glow - dots removed for clean minimalism */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-br from-[#E5A93B]/6 via-[#1E3A47]/3 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Master Showcase Board: Clean Minimalist Presentation */}
        <div
          id="master-brand-board"
          className="rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E2DDD5] shadow-xl bg-white"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] sm:min-h-[500px] lg:min-h-[540px]">
            {/* Left Quadrant: The Beeginning 4 You Logo on Warm Off-White Canvas */}
            <div className="lg:col-span-5 bg-[#F5F2EA] p-8 sm:p-12 lg:p-14 flex flex-col items-center justify-center text-center relative border-b lg:border-b-0 lg:border-r border-[#E2DDD5]">
              <div className="w-full flex items-center justify-center py-4">
                <BeeLogo size="xl" layout="stacked" theme="light" showTagline={false} />
              </div>

              {/* Minimalist Action Prompt */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3">
                <button
                  id="hero-board-solutions"
                  onClick={() => scrollToSection('#servicos')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#181B1E] hover:bg-[#D99B26] text-white hover:text-[#181B1E] text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95 group"
                >
                  <span>Nossas Soluções</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  id="hero-board-diagnostic"
                  onClick={onOpenDiagnostic}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-transparent hover:bg-black/5 text-[#181B1E] border border-[#181B1E]/20 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <span>Diagnóstico</span>
                </button>
              </div>
            </div>

            {/* Right Quadrant: Photographic Scene of Laptop, Coffee & Window Light */}
            <div className="lg:col-span-7 relative min-h-[360px] sm:min-h-[420px] lg:min-h-[540px] p-8 sm:p-12 lg:p-14 flex items-center justify-start overflow-hidden">
              {/* Authentic photographic scene */}
              <img
                src={workspacePhoto}
                alt="Espaço de trabalho inspirador com notebook ASUS Vivobook rosé e café na mesa de madeira"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-right sm:object-center select-none"
              />
              {/* Soft warm light-linen gradient for maximum text contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#F5F2EA]/92 via-[#F5F2EA]/65 to-transparent sm:from-[#F5F2EA]/85 sm:via-[#F5F2EA]/40 sm:to-transparent pointer-events-none" />

              {/* Overlaid Handwritten Script Slogan */}
              <div className="relative z-10 space-y-2 max-w-sm sm:max-w-md select-none">
                <p className="font-baguet text-4xl sm:text-5xl lg:text-6xl text-[#181B1E] font-normal leading-[1.12]">
                  Você traz<br />a ideia.
                </p>
                <div className="inline-block relative mt-1 sm:mt-2">
                  <p className="font-baguet text-4xl sm:text-5xl lg:text-6xl text-[#D99B26] font-normal leading-[1.12]">
                    Nós criamos<br />a solução.
                  </p>
                  {/* Expressive hand-drawn yellow underline curve */}
                  <svg
                    className="w-48 sm:w-60 h-4 sm:h-5 text-[#D99B26] mt-1"
                    viewBox="0 0 240 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 10 C 65 3, 145 2, 236 11"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
