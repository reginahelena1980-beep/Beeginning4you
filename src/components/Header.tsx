import { useState, useEffect, type MouseEvent } from 'react';
import { Menu, X, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';

interface HeaderProps {
  onOpenConversation: () => void;
}

export default function Header({ onOpenConversation }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Início', href: '#inicio' },
    { label: 'Quem Somos', href: '#quem-somos' },
    { label: 'Filosofia', href: '#filosofia' },
    { label: 'O Que Fazemos', href: '#solucoes' },
    { label: 'Para Quem', href: '#para-quem' },
    { label: 'Projetos Reais', href: '#historias' },
  ];

  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#F9F9F8]/90 backdrop-blur-md shadow-xs border-b border-[#E8E8E5]'
          : 'bg-transparent py-2 sm:py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 w-full">
          {/* Desktop Navigation: Aligned from the left boundary matching the hero panel below */}
          <nav
            className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 pointer-events-auto -ml-2"
            aria-label="Navegação Principal"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                id={`nav-link-${link.href.replace('#', '')}`}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 xl:px-4 py-2 text-xs xl:text-sm font-medium text-[#3A3A3A] hover:text-[#1A1A1A] hover:bg-[#EBEBE8]/60 rounded-lg transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Button (Desktop) - Unified Vamos conversar? / Fale Conosco */}
          <div className="hidden sm:flex items-center gap-2 xl:gap-2.5 shrink-0 z-10 -mr-1 sm:mr-0">
            <button
              id="header-cta-btn"
              type="button"
              onClick={onOpenConversation}
              className="inline-flex items-center gap-2 px-4 py-2 xl:px-5 xl:py-2.5 text-xs xl:text-sm font-semibold text-[#1A1A1A] bg-[#E5A93B] hover:bg-[#D99B26] active:scale-98 rounded-xl shadow-xs transition-all duration-200 whitespace-nowrap cursor-pointer"
            >
              <span>Vamos conversar?</span>
              <ArrowRight className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              id="mobile-header-conv-btn"
              onClick={onOpenConversation}
              className="p-2 text-[#1A1A1A] bg-[#E5A93B] rounded-lg shadow-xs"
              title="Vamos conversar?"
              aria-label="Abrir conversa"
            >
              <MessageCircle className="w-4 h-4" />
            </button>

            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-[#2D2D2D] hover:bg-[#EAEAE7] focus:outline-none focus:ring-2 focus:ring-[#D99B26]"
              aria-expanded={mobileMenuOpen}
              aria-label="Alternar menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-panel"
          className="lg:hidden bg-[#F9F9F8] border-b border-[#E8E8E5] px-4 pt-2 pb-6 space-y-2 shadow-lg"
        >
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                id={`mobile-link-${link.href.replace('#', '')}`}
                onClick={(e) => handleNavClick(e, link.href)}
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-[#2D2D2D] hover:bg-[#EBEBE8] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E8E8E5] flex flex-col gap-2.5">
            <button
              id="mobile-menu-contact-cta"
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConversation();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-[#1A1A1A] bg-[#E5A93B] hover:bg-[#D99B26] rounded-xl shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Vamos conversar?</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
