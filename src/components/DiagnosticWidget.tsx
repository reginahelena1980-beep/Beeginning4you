import { useState } from 'react';
import { DIAGNOSTIC_OPTIONS } from '../data/content';
import {
  Sparkles,
  MessageSquare,
  Globe,
  Table,
  Calendar,
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react';

interface DiagnosticWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (recommendation: string, pain: string) => void;
}

export default function DiagnosticWidget({ isOpen, onClose, onSelectResult }: DiagnosticWidgetProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedOption = DIAGNOSTIC_OPTIONS.find((opt) => opt.id === selectedOptionId);

  const getOptionIcon = (iconName: string) => {
    const props = { className: 'w-5 h-5 text-[#D99B26]' };
    switch (iconName) {
      case 'MessageSquare':
        return <MessageSquare {...props} />;
      case 'Globe':
        return <Globe {...props} />;
      case 'Table':
        return <Table {...props} />;
      case 'Calendar':
        return <Calendar {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  const handleConfirm = () => {
    if (selectedOption) {
      onSelectResult(selectedOption.recommendedSolution, selectedOption.title);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FFFFFF] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E8E5] relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#777777] hover:text-[#1A1A1A] hover:bg-[#F2F2EF] transition-colors"
          aria-label="Fechar diagnóstico"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-left space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5A93B]/20 text-[#8F6413] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#D99B26]" />
            <span>Diagnóstico Rápido em 1 Minuto</span>
          </div>
          <h3 className="text-2xl font-display font-extrabold text-[#1A1A1A]">
            O que seu negócio realmente precisa hoje?
          </h3>
          <p className="text-xs sm:text-sm text-[#555555]">
            Selecione a situação que mais se aproxima da sua dor atual para descobrirmos a ferramenta exata:
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-3 mb-6">
          {DIAGNOSTIC_OPTIONS.map((opt) => {
            const isSelected = opt.id === selectedOptionId;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedOptionId(opt.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFF9EE] border-[#D99B26] ring-2 ring-[#D99B26]/30 shadow-xs'
                    : 'bg-[#FBFBFA] border-[#E8E8E5] hover:border-[#D0D0CB] hover:bg-white'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 transition-colors ${
                    isSelected ? 'bg-[#E5A93B]/30' : 'bg-[#EFEFEA]'
                  }`}
                >
                  {getOptionIcon(opt.iconName)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm font-bold ${
                        isSelected ? 'text-[#8F6413]' : 'text-[#1A1A1A]'
                      }`}
                    >
                      {opt.title}
                    </p>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#D99B26] shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-xs text-[#666666] mt-1">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Real-time Recommendation Preview */}
        {selectedOption && (
          <div className="p-4 rounded-xl bg-[#1E3A47] text-white space-y-2 mb-6 animate-fadeIn">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#E5A93B]">
              Recomendação Beeginning para você:
            </span>
            <p className="text-sm font-bold text-white">
              {selectedOption.recommendedSolution}
            </p>
            <p className="text-xs text-white/80">
              Vamos estruturar exatamente isso no formulário para você receber uma proposta direta e realista.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#EAEAE7]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-[#666666] hover:text-[#1A1A1A]"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!selectedOptionId}
            onClick={handleConfirm}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedOptionId
                ? 'bg-[#E5A93B] hover:bg-[#D99B26] text-[#1A1A1A] shadow-xs active:scale-98 cursor-pointer'
                : 'bg-[#E0E0DB] text-[#999999] cursor-not-allowed'
            }`}
          >
            <span>Aplicar ao meu orçamento</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
