import { useState } from 'react';
import { getSolutions } from '../data/content';
import { useLanguage } from '../context/LanguageContext';
import { TRANSLATIONS } from '../data/translations';
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
  Sparkles,
  CheckCircle2,
  Workflow
} from 'lucide-react';

interface SolutionsProps {
  onSelectSolutionForContact: (solutionTitle: string) => void;
}

export default function Solutions({ onSelectSolutionForContact }: SolutionsProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const t = TRANSLATIONS[language].solutions;
  const solutionsList = getSolutions(language);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
        
        {/* Section Header & Humanized Summary */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3A47]/10 text-[#1E3A47] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#D99B26]" />
            <span>{t.tag}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#1A1A1A] tracking-tight">
            {t.title}
          </h2>

          <p className="text-base sm:text-lg text-[#4A4A48] leading-relaxed">
            {isEn
              ? "We engineer the missing piece for your business machinery to run effortlessly so you can focus on what you do best. We create agile, pragmatic digital solutions free from heavyweight platforms and hidden costs."
              : "Desenvolvemos a peça que falta para a engrenagem do seu negócio rodar macia e você focar no que faz de melhor. Criamos soluções digitais leves, práticas e livres da complexidade de plataformas pesadas e custos surpresa."}
          </p>
        </div>

        {/* Highlight Banner: Lean Philosophy & No-Bloat Commitment */}
        <div className="bg-white rounded-2xl border border-[#E8E8E5] p-6 sm:p-9 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#E5A93B]/20 text-[#8F6413] flex items-center justify-center mb-3">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">
                {isEn ? "Smooth Machinery" : "Engrenagem Macia"}
              </h3>
              <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                {isEn
                  ? "Great technology shapes itself to your working rhythm — never the opposite. We map every flow to eliminate friction and restore your valuable time."
                  : "Tecnologia boa é a que se molda ao seu ritmo de trabalho — e não o contrário. Desenhamos cada fluxo para eliminar gargalos e devolver seu tempo."}
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#1E3A47]/10 text-[#1E3A47] flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-[#D99B26]" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">
                {isEn ? "Zero Software Bloat" : "Zero Sistemas Inchados"}
              </h3>
              <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                {isEn
                  ? "No crowded screens with 80 confusing buttons where you only ever touch three. We build solely what creates tangible return for your bottom line."
                  : "Nada de telas poluídas com 80 botões dos quais você só usa três. Construímos apenas o essencial que gera resultado concreto para o seu caixa."}
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#E5A93B]/20 text-[#8F6413] flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-[#D99B26]" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">
                {isEn ? "Focus On Your Strengths" : "Foco no Que Faz de Melhor"}
              </h3>
              <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                {isEn
                  ? "Less time wasted on duplicated messages, lost notes, or tangled spreadsheets. You serve your clients, and the machinery hums along."
                  : "Menos tempo perdido com mensagens duplicadas, anotações perdidas ou planilhas confusas. Você atende seus clientes, e a engrenagem roda suave."}
              </p>
            </div>
          </div>
        </div>

        {/* Modular Solutions Catalog */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E8E5] pb-4">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A47] block mb-1">
                {isEn ? "Digital Services Catalog" : "Catálogo de Serviços Digitais"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#1A1A1A]">
                {isEn ? "Tools Built for Your Day-to-Day" : "Ferramentas Feitas para o Seu Dia a Dia"}
              </h3>
              <p className="text-xs sm:text-sm text-[#555555] mt-1.5">
                {isEn
                  ? "From complete online shops to focused integrations and automations, pick the optimal module for your routine:"
                  : "De lojas virtuais completas a integrações e automações pontuais, escolha o módulo ideal para a sua rotina:"}
              </p>
            </div>

            <a
              href="#historias"
              onClick={(e) => {
                e.preventDefault();
                const el = document.querySelector('#historias');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3A47] hover:text-[#D99B26] transition-colors whitespace-nowrap self-start sm:self-end"
            >
              <span>{isEn ? "See real projects built" : "Ver projetos reais desenvolvidos"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {solutionsList.map((item) => (
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

                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#1E3A47]/8 text-[#1E3A47] group-hover:bg-[#E5A93B]/20 group-hover:text-[#8F6413] transition-colors whitespace-nowrap">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-lg sm:text-xl font-bold font-display text-[#1A1A1A] group-hover:text-[#1E3A47] transition-colors mb-2.5">
                    {item.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-[#555555] leading-relaxed mb-5">
                    {item.shortDesc}
                  </p>

                  {/* Practical Features checklist preview */}
                  <div className="space-y-2 border-t border-[#F0F0EE] pt-4 mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888] block">
                      {isEn ? "Practical benefits:" : "Benefícios práticos:"}
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
                <div className="pt-3.5 border-t border-[#F0F0EE] flex items-center justify-between">
                  <button
                    type="button"
                    id={`btn-details-${item.id}`}
                    onClick={() => setActiveModalSolution(item)}
                    className="text-xs font-bold text-[#1E3A47] hover:text-[#D99B26] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#D99B26]" />
                    <span>{t.detailsBtn}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              className="absolute top-5 right-5 p-2 rounded-lg text-[#777777] hover:text-[#1A1A1A] hover:bg-[#F0F0ED] transition-colors cursor-pointer"
              aria-label={t.modalClose}
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
                  {isEn ? "The challenge this solves:" : "O desafio que isso resolve:"}
                </span>
                <p className="text-xs text-[#444444] leading-relaxed">{activeModalSolution.practicalPain}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F4F8FA] border border-[#1E3A47]/15">
                <span className="text-xs font-bold text-[#1E3A47] block mb-1">
                  {isEn ? "The Beeginning solution:" : "A solução Beeginning:"}
                </span>
                <p className="text-xs text-[#222222] font-medium leading-relaxed">{activeModalSolution.ourSolution}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666] block mb-2">
                  {t.featuresLabel}
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
                  <span>{t.deliveryLabel} <strong>{activeModalSolution.estimatedDelivery}</strong></span>
                </div>
                <div className="text-[11px] text-[#777777]">
                  <span>{t.idealForLabel} {activeModalSolution.idealFor}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalSolution(null)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#666666] hover:text-[#1A1A1A] transition-colors cursor-pointer"
              >
                {t.modalClose}
              </button>

              <button
                type="button"
                onClick={() => {
                  const title = activeModalSolution.title;
                  setActiveModalSolution(null);
                  onSelectSolutionForContact(title);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-[#1A1A1A] bg-[#E5A93B] hover:bg-[#D99B26] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>{isEn ? "Request proposal for this solution" : "Solicitar proposta desta solução"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
