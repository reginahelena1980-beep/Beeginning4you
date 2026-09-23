import { ArrowRight } from 'lucide-react';
import BeeLogo from './BeeLogo';
import workspacePhoto from '../assets/images/vivobook_rose_workspace_1789572652740.jpg';
import { useLanguage } from '../context/LanguageContext';
import { TRANSLATIONS } from '../data/translations';

interface HeroProps {
  onOpenDiagnostic: () => void;
  onSelectChallenge?: (challengeId: string) => void;
}

export default function Hero({ onOpenDiagnostic }: HeroProps) {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];

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
              <div className="mt-6 sm:mt-8 flex items-center justify-center">
                <button
                  id="hero-board-solutions"
                  onClick={() => scrollToSection('#historias')}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#181B1E] hover:bg-[#D99B26] text-white hover:text-[#181B1E] text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95 group"
                >
                  <span>{t.hero.solutionsBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Right Quadrant: Photographic Scene of Laptop, Coffee & Window Light */}
            <div className="lg:col-span-7 relative min-h-[360px] sm:min-h-[420px] lg:min-h-[540px] p-8 sm:p-12 lg:p-14 flex items-center justify-start overflow-hidden">
              {/* Authentic photographic scene */}
              <img
                src={workspacePhoto}
                alt={t.hero.altImage}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-right sm:object-center select-none"
              />
              {/* Soft warm light-linen gradient for maximum text contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#F5F2EA]/92 via-[#F5F2EA]/65 to-transparent sm:from-[#F5F2EA]/85 sm:via-[#F5F2EA]/40 sm:to-transparent pointer-events-none" />

              {/* Overlaid Handwritten Script Slogan */}
              <div className="relative z-10 space-y-2 max-w-md sm:max-w-xl select-none">
                <p className="font-baguet text-4xl sm:text-5xl lg:text-6xl text-[#181B1E] font-normal leading-[1.12]">
                  {t.hero.sloganLine1}<br />{t.hero.sloganLine2}
                </p>
                <div className="inline-block relative mt-1 sm:mt-2">
                  <p className="font-baguet text-3xl sm:text-4.5xl lg:text-[3.25rem] text-[#D99B26] font-normal leading-[1.15]">
                    {t.hero.sloganLine3}<br className="sm:hidden" /> {t.hero.sloganLine4}
                  </p>
                  {/* Expressive hand-drawn yellow continuous underline curve */}
                  <svg
                    className="w-56 sm:w-80 lg:w-96 h-4 sm:h-5 text-[#D99B26] mt-1"
                    viewBox="0 0 320 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 10 C 80 3, 200 2, 316 11"
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

