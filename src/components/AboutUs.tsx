import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Heart,
  Users2
} from 'lucide-react';
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
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      const cfg = getContactConfig();
      setPhotoUrl(cfg.profilePhotoUrl || reginaPhoto);
      setImgError(false);
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handleUpdate);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handleUpdate);
  }, []);

  return (
    <section
      id="quem-somos"
      className="py-16 sm:py-24 bg-[#FAF8F5] border-b border-[#E8E4DD] relative overflow-hidden"
    >
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#E5A93B]/6 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#1E3A47]/4 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10 sm:space-y-12">

        {/* 1. Citação de Impacto */}
        <div id="quem-somos-citacao" className="text-center max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5A93B]/15 text-[#9E6B08] text-xs font-semibold uppercase tracking-wider mb-4">
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
        </div>

        {/* 2. Quadros Lado a Lado: Quem Está Por Trás & Competências */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* Quadro 1: Quem Está Por Trás (Tamanho reduzido e harmonizado) */}
          <div
            id="quem-esta-por-tras"
            className="bg-white rounded-3xl p-6 sm:p-7 lg:p-8 border border-[#E8E4DD] shadow-sm flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              {/* Badges superiores */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-[#F0ECE1]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3A47]/8 text-[#1E3A47] text-xs font-semibold uppercase tracking-wider">
                  <Users2 className="w-3.5 h-3.5 text-[#D99B26]" />
                  <span>{t.bioBadge}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E8E4DD] text-xs font-medium text-[#55585D]">
                  <Heart className="w-3.5 h-3.5 text-[#D99B26]" />
                  <span>{t.humanSeal}</span>
                </div>
              </div>

              {/* Apresentação com foto da Regina no dobro do tamanho */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 mt-5">
                <div className="relative w-40 h-48 sm:w-48 sm:h-56 rounded-2xl overflow-hidden border-2 border-[#FAF8F5] shadow-md shrink-0 group">
                  <img
                    src={imgError ? reginaPhoto : photoUrl}
                    alt={isEn ? "Regina, creator of Beeginning 4 you" : "Regina, criadora da Beeginning 4 you"}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181B1E]/70 via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <p className="font-display font-bold text-base leading-tight">Regina</p>
                    <p className="text-[11px] text-[#E5A93B] font-medium">
                      {t.bioPhotoRole}
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-[#181B1E] leading-tight">
                    {t.bioGreeting}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#404348] leading-relaxed pt-1">
                    {t.bioP1}
                  </p>
                  <p className="text-xs sm:text-sm text-[#404348] leading-relaxed">
                    {t.bioP2Part1}
                    <strong className="font-bold text-[#181B1E]">{t.bioP2Bold}</strong>
                    {t.bioP2Part2}
                  </p>
                </div>
              </div>

              {/* Continuação da Trajetória e Biografia */}
              <div className="space-y-2.5 text-xs sm:text-sm text-[#404348] leading-relaxed mt-4">
                <p>{t.bioP3}</p>
                <p>{t.bioP4}</p>
              </div>
            </div>

            {/* Destaque com borda mostarda */}
            <div className="mt-4 bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border-l-4 border-[#D99B26] text-[#181B1E] text-xs sm:text-sm leading-relaxed">
              {t.bioHighlightPart1}
              <strong className="font-bold">{t.bioHighlightBold}</strong>
              {t.bioHighlightPart2}
            </div>
          </div>

          {/* Quadro 2: Competências (Tamanho reduzido e harmonizado) */}
          <div
            id="competencias"
            className="bg-white rounded-3xl p-6 sm:p-7 lg:p-8 border border-[#E8E4DD] shadow-sm flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              {/* Header de Competências */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-[#F0ECE1]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5A93B]/15 text-[#9E6B08] text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#D99B26]" />
                  <span>{t.competenciesBadge}</span>
                </div>
              </div>

              <div className="mt-4 mb-4">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-[#181B1E] leading-tight">
                  {t.competenciesTitle}
                </h3>
              </div>

              {/* Grid 2 colunas com os 6 cards compactos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {t.competencies.map((card) => (
                  <div
                    key={card.id}
                    id={`competency-card-${card.id}`}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E4DD]/80 hover:border-[#D99B26]/60 hover:bg-white hover:shadow-xs transition-all duration-300 group flex flex-col justify-start"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E4DD] flex items-center justify-center text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        {card.icon}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#181B1E] leading-snug">
                        {card.title}
                      </h4>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#55585D] leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé discreto harmonizando a base dos dois quadros */}
            <div className="mt-4 pt-3.5 border-t border-[#F0ECE1] flex items-center justify-between text-[11px] sm:text-xs text-[#55585D]">
              <span className="font-medium text-[#181B1E]">{isEn ? '6 core competencies' : '6 competências integradas'}</span>
              <span className="text-[#D99B26] font-semibold">{isEn ? 'Tailored for small business' : 'Feito sob medida para você'}</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
