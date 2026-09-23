import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  variant?: 'pill' | 'minimal' | 'footer';
}

export default function LanguageToggle({ className = '', variant = 'pill' }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === 'footer') {
    return (
      <div className={`inline-flex items-center gap-2 text-xs ${className}`}>
        <Globe className="w-3.5 h-3.5 text-[#E5A93B]" />
        <span className="text-[#A0A5AE]">{language === 'pt' ? 'Idioma:' : 'Language:'}</span>
        <div className="inline-flex rounded-lg bg-[#262A30] p-0.5 border border-[#353A42]">
          <button
            type="button"
            onClick={() => setLanguage('pt')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              language === 'pt'
                ? 'bg-[#E5A93B] text-[#181B1E] shadow-xs'
                : 'text-[#C5CAD2] hover:text-white'
            }`}
            aria-label="Mudar para Português"
          >
            Português (BR)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-[#E5A93B] text-[#181B1E] shadow-xs'
                : 'text-[#C5CAD2] hover:text-white'
            }`}
            aria-label="Switch to English"
          >
            English (US)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-full p-0.5 bg-[#EAE8E2] border border-[#DDD9D0] text-[11px] font-bold shadow-xs select-none ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLanguage('pt')}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 ${
          language === 'pt'
            ? 'bg-[#181B1E] text-white shadow-xs'
            : 'text-[#5A5D64] hover:text-[#181B1E]'
        }`}
        title="Português"
      >
        <span>PT</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 ${
          language === 'en'
            ? 'bg-[#181B1E] text-white shadow-xs'
            : 'text-[#5A5D64] hover:text-[#181B1E]'
        }`}
        title="English"
      >
        <span>EN</span>
      </button>
    </div>
  );
}
