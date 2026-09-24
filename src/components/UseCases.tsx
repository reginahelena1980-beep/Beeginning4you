import { getRealProjectExamples } from '../data/content';
import { useLanguage } from '../context/LanguageContext';
import {
  Sparkles,
  ShoppingBag,
  Cpu,
  ShieldCheck,
  Workflow,
  Wallet,
  Calculator,
  Globe
} from 'lucide-react';

interface UseCasesProps {
  onSelectSolutionForContact?: (solutionTitle: string) => void;
}

export default function UseCases({ onSelectSolutionForContact: _onSelectSolutionForContact }: UseCasesProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const projects = getRealProjectExamples(language);

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-4 h-4' };
    switch (iconName) {
      case 'ShoppingBag':
        return <ShoppingBag {...props} />;
      case 'Cpu':
        return <Cpu {...props} />;
      case 'Wallet':
        return <Wallet {...props} />;
      case 'Calculator':
        return <Calculator {...props} />;
      case 'Globe':
        return <Globe {...props} />;
      default:
        return <Workflow {...props} />;
    }
  };

  return (
    <section id="historias" className="py-12 sm:py-16 lg:py-20 bg-[#F9F9F8] relative scroll-mt-20">
      <div id="projetos-reais" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Delicate Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1E3A47]/8 text-[#1E3A47] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#D99B26]" />
            <span>{isEn ? "Real Projects in Practice" : "Projetos Reais na Prática"}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-[#1A1A1A] tracking-tight">
            {isEn ? "Real Businesses, Concrete Results" : "Negócios Reais, Resultados Concretos"}
          </h2>

          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
            {isEn
              ? "See how we develop tailor-made solutions to meet our clients' needs — with complete confidentiality and focus on efficiency."
              : "Veja como desenvolvemos soluções sob medida para atender às necessidades dos nossos clientes — com total sigilo e foco em eficiência."}
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#E8E8E5] text-[11px] text-[#666666] shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D99B26] shrink-0" />
            <span>{isEn ? "Tailored projects with confidential data and brand privacy preserved" : "Projetos sob medida com dados e identidades preservados"}</span>
          </div>
        </div>

        {/* Delicate & Compact Real Projects Grid (Screenshot 8) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => {
            return (
              <div
                key={project.id}
                id={`project-showcase-${project.id}`}
                className="bg-white rounded-2xl border border-[#E8E8E5] hover:border-[#D99B26]/60 p-6 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 group"
              >
                <div className="space-y-4">
                  {/* Header: Micro-Icon, Badge & Number */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] group-hover:bg-[#E5A93B]/20 text-[#1E3A47] group-hover:text-[#8F6413] border border-[#EAE7DF] flex items-center justify-center transition-colors shrink-0">
                        {renderIcon(project.iconName)}
                      </div>
                      <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-[#1E3A47]/6 text-[#1E3A47] tracking-wider uppercase">
                        {project.badge.replace(/Projeto Real • |Real Project • /, '')}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-[#888888] bg-[#F7F7F5] px-2.5 py-0.5 rounded-md">
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-display text-[#1A1A1A] group-hover:text-[#1E3A47] transition-colors leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-xs text-[#666666] mt-1 font-normal leading-relaxed">
                      {project.tagline}
                    </p>
                  </div>

                  {/* Unified Challenge & Solution Micro-Panel */}
                  <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#EEEEEC] space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F6413] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D99B26]" />
                        {isEn ? "Challenge" : "Desafio"}
                      </span>
                      <p className="text-xs text-[#555555] mt-1 leading-relaxed">
                        {project.challenge}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#EAEAEA]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A47] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A47]" />
                        {isEn ? "Tailored Solution" : "Solução Sob Medida"}
                      </span>
                      <p className="text-xs text-[#222222] font-medium mt-1 leading-relaxed">
                        {project.solution}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer: Results Note */}
                <div className="mt-4 pt-3 border-t border-[#F0F0EE]">
                  <p className="text-xs text-[#666666] italic leading-relaxed">
                    {project.resultsNote}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
