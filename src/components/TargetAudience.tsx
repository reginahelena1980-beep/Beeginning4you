import { getAudienceProfiles } from '../data/content';
import { useLanguage } from '../context/LanguageContext';
import { TRANSLATIONS } from '../data/translations';
import {
  Store,
  Briefcase,
  Palette,
  TrendingUp,
  CheckCircle,
  XCircle,
  Sparkles,
  HeartHandshake
} from 'lucide-react';

export default function TargetAudience() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const t = TRANSLATIONS[language].audience;
  const audienceList = getAudienceProfiles(language);

  const getProfileIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6' };
    switch (iconName) {
      case 'Store':
        return <Store {...props} />;
      case 'Briefcase':
        return <Briefcase {...props} />;
      case 'Palette':
        return <Palette {...props} />;
      case 'TrendingUp':
        return <TrendingUp {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <section id="para-quem" className="py-20 sm:py-28 bg-white border-y border-[#EAEAE7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5A93B]/15 text-[#8F6413] text-xs font-bold uppercase tracking-wider">
            <span>{isEn ? "Who is Beeginning 4 You For?" : "Para Quem é a Beeginning 4 You?"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#1A1A1A] tracking-tight">
            {isEn ? "For Those Who Want to Grow Without Technical Headaches" : "Para Quem Quer Crescer Sem Complicação Técnica"}
          </h2>

          <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
            {isEn
              ? "If you don't have an internal IT team, don't want to spend fortunes on corporate consultancies, and just need things to work cleanly and quickly, you are in the right place."
              : "Se você não tem uma equipe de TI, não quer gastar fortunas com consultorias corporativas e só precisa que as coisas funcionem bem e rápido, você está no lugar certo."}
          </p>
        </div>

        {/* Profile Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {audienceList.map((profile) => (
            <div
              key={profile.id}
              className="p-6 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E5] hover:border-[#D99B26] transition-all flex flex-col justify-between shadow-2xs hover:shadow-sm"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5E2] text-[#1E3A47] flex items-center justify-center mb-4 shadow-2xs">
                  {getProfileIcon(profile.iconName)}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D99B26] block mb-1">
                  {profile.highlightTag}
                </span>

                <h3 className="text-lg font-bold font-display text-[#1A1A1A] mb-1">
                  {profile.title}
                </h3>

                <p className="text-xs text-[#666666] mb-4">{profile.subtitle}</p>

                {/* The struggle vs outcome */}
                <div className="space-y-3 pt-3 border-t border-[#EAEAE7]">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-[#666666] leading-relaxed">
                      <strong className="text-[#333333]">{t.struggleLabel}</strong> {profile.commonStruggle}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#D99B26] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#222222] leading-relaxed">
                      <strong className="text-[#1E3A47]">{t.outcomeLabel}</strong> {profile.solutionOutcome}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
