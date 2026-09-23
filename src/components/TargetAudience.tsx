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
              className="p-6 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E5] hover:border-[#D99B26] transition-all flex flex-col justify-between"
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

        {/* Comparison: Agência Tradicional vs Beeginning 4 You */}
        <div className="mt-16 bg-[#F9F9F8] border border-[#E5E5E2] rounded-2xl p-6 sm:p-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-2xl font-display font-bold text-[#1A1A1A]">
              {isEn ? "Why small businesses prefer our approach?" : "Por que pequenos negócios preferem nossa abordagem?"}
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] mt-2">
              {isEn
                ? "Here is how typical market agencies compare against the way we build solutions for you:"
                : "Comparamos a experiência comum do mercado com a forma como construímos soluções para você:"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Corporate / Complex Way */}
            <div className="p-6 rounded-xl bg-white border border-red-100 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 block">
                {isEn ? "In the Traditional Market" : "No Mercado Tradicional"}
              </span>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#666666]">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    {isEn
                      ? "Proposals packed with obscure jargon to justify steep retainers."
                      : "Propostas cheias de termos técnicos difíceis para justificar orçamentos altos."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    {isEn
                      ? "Heavy software where you rely on tech support just to adjust a single price."
                      : "Sistemas pesados onde você fica dependente de suporte até para trocar um preço."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    {isEn
                      ? "Costly monthly fees for bulky suites with hundreds of features you will never use."
                      : "Mensalidades caras de ferramentas com centenas de recursos que você nunca usará."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    {isEn
                      ? "Impersonal support via slow ticketing queues."
                      : "Atendimento impessoal por tickets demorados."}
                  </span>
                </li>
              </ul>
            </div>

            {/* The Beeginning 4 You Way */}
            <div className="p-6 rounded-xl bg-[#FFF9EE] border border-[#E5A93B]/40 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8F6413] block">
                  {isEn ? "With Beeginning 4 You" : "Com a Beeginning 4 You"}
                </span>
                <HeartHandshake className="w-4 h-4 text-[#D99B26]" />
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#222222]">
                <li className="flex items-start gap-2 font-medium">
                  <span className="text-[#D99B26] font-bold">✓</span>
                  <span>
                    {isEn
                      ? "Clear, human, and transparent dialog: everything explained in plain, simple words."
                      : "Conversa clara, humana e franca: explicamos tudo em bom português."}
                  </span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <span className="text-[#D99B26] font-bold">✓</span>
                  <span>
                    {isEn
                      ? "Total independence: you learn how to update your tool in 10 easy minutes."
                      : "Você tem total autonomia e aprende a atualizar sua ferramenta em 10 minutos."}
                  </span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <span className="text-[#D99B26] font-bold">✓</span>
                  <span>
                    {isEn
                      ? "Built strictly for what you need right now, ready to scale gracefully tomorrow."
                      : "Construído estritamente para o que você precisa hoje, pronto para crescer amanhã."}
                  </span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <span className="text-[#D99B26] font-bold">✓</span>
                  <span>
                    {isEn
                      ? "Direct WhatsApp contact with the person actually engineering your solution."
                      : "Contato direto no WhatsApp com quem realmente cria a sua solução."}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
