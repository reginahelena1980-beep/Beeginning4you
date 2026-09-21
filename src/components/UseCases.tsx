import { USE_CASES } from '../data/content';
import { Quote, Sparkles, TrendingUp } from 'lucide-react';

export default function UseCases() {
  return (
    <section id="historias" className="py-20 sm:py-28 bg-[#F9F9F8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3A47]/10 text-[#1E3A47] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#D99B26]" />
            <span>Casos Práticos de Transformação</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#1A1A1A] tracking-tight">
            Negócios Reais, Resultados Concretos
          </h2>

          <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
            Veja como a simplicidade bem pensada transformou o dia a dia de quem acorda cedo para
            fazer acontecer.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {USE_CASES.map((story) => (
            <div
              key={story.id}
              className="bg-white rounded-2xl border border-[#E8E8E5] p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative"
            >
              <div>
                <Quote className="w-8 h-8 text-[#E5A93B]/40 mb-3" />

                <blockquote className="text-sm sm:text-base font-medium text-[#1A1A1A] leading-relaxed mb-6 italic">
                  {story.quote}
                </blockquote>

                {/* Before / After Pill Box */}
                <div className="space-y-2.5 pt-4 border-t border-[#F0F0EE]">
                  <div className="text-xs">
                    <span className="font-bold text-red-600 uppercase tracking-wide block text-[10px]">
                      Como era antes:
                    </span>
                    <p className="text-[#666666] mt-0.5">{story.before}</p>
                  </div>

                  <div className="text-xs">
                    <span className="font-bold text-[#1E3A47] uppercase tracking-wide block text-[10px]">
                      A Solução Beeginning:
                    </span>
                    <p className="text-[#333333] mt-0.5">{story.after}</p>
                  </div>
                </div>
              </div>

              {/* Client Info & Metric */}
              <div className="mt-6 pt-4 border-t border-[#F0F0EE] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">{story.clientName}</p>
                  <p className="text-[11px] text-[#777777]">{story.businessName}</p>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8F6413] bg-[#E5A93B]/20 px-2.5 py-1 rounded-md">
                  <TrendingUp className="w-3 h-3 text-[#D99B26]" />
                  {story.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
