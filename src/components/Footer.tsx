import { ArrowUp, Heart, Sparkles, Phone, Mail, MapPin } from 'lucide-react';
import BeeLogo from './BeeLogo';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#181B1E] text-[#E0E0DB] border-t border-[#262A30] relative overflow-hidden">
      {/* Decorative warm ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E5A93B]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#262A30]">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-block p-1">
              <BeeLogo size="md" theme="dark" />
            </div>

            <p className="text-sm text-[#A0A5AE] max-w-sm leading-relaxed">
              Ajudamos pequenos negócios a dar o primeiro passo através de ferramentas digitais
              simples, bonitas e pensadas para a realidade de quem empreende.
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs text-[#E5A93B] font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tecnologia pragmática com acolhimento humano.</span>
            </div>
          </div>

          {/* Fast Navigation */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#FFFFFF]">
              Navegação Rápida
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#inicio"
                  className="hover:text-[#E5A93B] transition-colors"
                >
                  Início
                </a>
              </li>
              <li>
                <a
                  href="#quem-somos"
                  className="hover:text-[#E5A93B] transition-colors"
                >
                  Quem Somos & O Conceito
                </a>
              </li>
              <li>
                <a
                  href="#filosofia"
                  className="hover:text-[#E5A93B] transition-colors"
                >
                  Nossa Filosofia (Ideia ➔ Forma ➔ Solução)
                </a>
              </li>
              <li>
                <a
                  href="#solucoes"
                  className="hover:text-[#E5A93B] transition-colors"
                >
                  O Que Fazemos
                </a>
              </li>
              <li>
                <a
                  href="#para-quem"
                  className="hover:text-[#E5A93B] transition-colors"
                >
                  Para Quem É
                </a>
              </li>
              <li>
                <a
                  href="#historias"
                  className="hover:text-[#E5A93B] transition-colors"
                >
                  Casos Reais
                </a>
              </li>
              <li>
                <a
                  href="#contato"
                  className="hover:text-[#E5A93B] transition-colors"
                >
                  Contato &amp; Diagnóstico
                </a>
              </li>
            </ul>
          </div>

          {/* Direct Support & Contact */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#FFFFFF]">
              Canais Diretos
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#A0A09B]">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#E5A93B] shrink-0" />
                <span>WhatsApp: (11) 99999-9999 (Atendimento humanizado)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#E5A93B] shrink-0" />
                <span>contato@beeginning4you.com.br</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E5A93B] shrink-0" />
                <span>Atendemos pequenos negócios em todo o Brasil</span>
              </li>
            </ul>

            <div className="pt-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#CCCCCC]">
                <p className="font-semibold text-white mb-1">Horário de acolhimento:</p>
                <p className="text-[11px] text-[#A0A09B]">
                  Segunda a Sexta das 08h30 às 18h30 · Retornos sem demora.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#80807B]">
          <div className="flex items-center gap-1.5 text-center sm:text-left">
            <span>&copy; {currentYear} Beeginning 4 You · Todos os direitos reservados.</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Digital solutions for small businesses</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              Feito com café, escuta atenta e código limpo <Heart className="w-3.5 h-3.5 text-[#E5A93B]" />
            </span>

            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-white/10 hover:bg-[#E5A93B] hover:text-[#1A1A1A] transition-colors"
              title="Voltar ao topo"
              aria-label="Voltar ao topo"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
