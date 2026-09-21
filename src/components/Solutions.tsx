import { useState } from 'react';
import { SOLUTIONS } from '../data/content';
import { SolutionItem } from '../types';
import {
  Globe,
  Zap,
  BarChart3,
  ShoppingBag,
  Cpu,
  Layers,
  Check,
  ArrowRight,
  Clock,
  HelpCircle,
  X,
  Sparkles
} from 'lucide-react';

interface SolutionsProps {
  onSelectSolutionForContact: (solutionTitle: string) => void;
}

export default function Solutions({ onSelectSolutionForContact }: SolutionsProps) {
  const [activeModalSolution, setActiveModalSolution] = useState<SolutionItem | null>(null);

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6' };
    switch (iconName) {
      case 'Globe':
        return <Globe {...props} />;
      case 'Zap':
        return <Zap {...props} />;
      case 'BarChart3':
        return <BarChart3 {...props} />;
      case 'ShoppingBag':
        return <ShoppingBag {...props} />;
      case 'Cpu':
        return <Cpu {...props} />;
      case 'Layers':
        return <Layers {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <section id="solucoes" className="py-20 sm:py-28 bg-[#F9F9F8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3A47]/10 text-[#1E3A47] text-xs font-bold uppercase tracking-wider">
            <span>O Que Fazemos</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#1A1A1A] tracking-tight">
            Ferramentas Digitais Feitas para o Dia a Dia
          </h2>

          <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
            Nada de sistemas inchados ou custos surpresa. Desenvolvemos a peça que falta para a sua
            engrenagem rodar macia e você focar no que faz de melhor.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {SOLUTIONS.map((item) => (
            <div
              key={item.id}
              id={`solution-card-${item.id}`}
              className="group bg-white rounded-2xl border border-[#E8E8E5] hover:border-[#D99B26] p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#F4F4F2] group-hover:bg-[#E5A93B]/20 text-[#1E3A47] group-hover:text-[#8F6413] flex items-center justify-center transition-colors">
                    {renderIcon(item.iconName)}
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#1E3A47]/8 text-[#1E3A47] group-hover:bg-[#E5A93B]/20 group-hover:text-[#8F6413] transition-colors">
                    {item.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold font-display text-[#1A1A1A] group-hover:text-[#1E3A47] transition-colors mb-2.5">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed mb-5">
                  {item.shortDesc}
                </p>

                {/* Practical Features checklist preview */}
                <div className="space-y-2 border-t border-[#F0F0EE] pt-4 mb-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888] block">
                    Benefícios práticos:
                  </span>
                  {item.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#333333]">
                      <Check className="w-3.5 h-3.5 text-[#D99B26] shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Area */}
              <div className="pt-4 border-t border-[#F0F0EE] flex items-center justify-between gap-2">
                <button
                  id={`btn-details-${item.id}`}
                  onClick={() => setActiveModalSolution(item)}
                  className="text-xs font-bold text-[#1E3A47] hover:text-[#D99B26] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Ver na prática</span>
                </button>

                <button
                  id={`btn-choose-${item.id}`}
                  onClick={() => onSelectSolutionForContact(item.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1A1A1A] bg-[#E5A93B] hover:bg-[#D99B26] active:scale-95 transition-all shadow-xs"
                >
                  <span>Quero essa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Solution Detail Modal */}
      {activeModalSolution && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-[#E5E5E2] relative overflow-hidden">
            {/* Close button */}
            <button
              id="close-solution-modal"
              onClick={() => setActiveModalSolution(null)}
              className="absolute top-5 right-5 p-2 rounded-lg text-[#777777] hover:text-[#1A1A1A] hover:bg-[#F0F0ED] transition-colors"
              aria-label="Fechar detalhes"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#E5A93B]/20 text-[#8F6413] flex items-center justify-center">
                {renderIcon(activeModalSolution.iconName)}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D99B26]">
                  {activeModalSolution.badge}
                </span>
                <h3 className="text-xl font-display font-extrabold text-[#1A1A1A]">
                  {activeModalSolution.title}
                </h3>
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-6 text-sm">
              <div className="p-3.5 rounded-xl bg-[#FFF8EE] border border-[#E5A93B]/30">
                <span className="text-xs font-bold text-[#8F6413] block mb-1">
                  A dor comum que isso resolve:
                </span>
                <p className="text-xs text-[#444444]">{activeModalSolution.practicalPain}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F4F8FA] border border-[#1E3A47]/15">
                <span className="text-xs font-bold text-[#1E3A47] block mb-1">
                  Como a Beeginning resolve:
                </span>
                <p className="text-xs text-[#333333]">{activeModalSolution.ourSolution}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666] block mb-2">
                  O que está incluso:
                </span>
                <ul className="space-y-1.5">
                  {activeModalSolution.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[#222222]">
                      <Check className="w-3.5 h-3.5 text-[#D99B26] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#EAEAE7] text-xs text-[#666666]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D99B26]" />
                  <span>Prazo estimado: <strong>{activeModalSolution.estimatedDelivery}</strong></span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalSolution(null)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#666666] hover:text-[#1A1A1A] transition-colors"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => {
                  const title = activeModalSolution.title;
                  setActiveModalSolution(null);
                  onSelectSolutionForContact(title);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-[#1A1A1A] bg-[#E5A93B] hover:bg-[#D99B26] rounded-xl shadow-xs transition-colors"
              >
                <span>Solicitar proposta desta solução</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
