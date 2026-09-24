import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import Philosophy from './components/Philosophy';
import Solutions from './components/Solutions';
import TargetAudience from './components/TargetAudience';
import UseCases from './components/UseCases';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ConversationModal from './components/ConversationModal';
import AdminModal from './components/AdminModal';

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [conversationInitialTab, setConversationInitialTab] = useState<'hub' | 'whatsapp' | 'meeting'>('hub');
  const [prefilledNeed, setPrefilledNeed] = useState<string>('');
  const [prefilledSolution, setPrefilledSolution] = useState<string>('');

  const handleOpenConversation = (tab: 'hub' | 'whatsapp' | 'meeting' = 'hub') => {
    setConversationInitialTab(tab);
    setIsConversationOpen(true);
  };

  const handleSelectSolutionForContact = (solutionTitle: string) => {
    setPrefilledSolution(solutionTitle);
    const diagnosticEl = document.querySelector('#agendamento') || document.querySelector('#diagnostico-final');
    if (diagnosticEl) {
      diagnosticEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F8] text-[#1A1A1A] font-sans selection:bg-[#E5A93B]/20 selection:text-[#1A1A1A]">
      {/* Top Main Navigation */}
      <Header
        onOpenConversation={() => handleOpenConversation('hub')}
      />

      {/* Main Page Flow: Strictly the 8 Defined Sections */}
      <main className="flex-1">
        {/* 1. Início (Hero) */}
        <Hero
          onOpenDiagnostic={() => {
            const el = document.querySelector('#agendamento') || document.querySelector('#diagnostico-final');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenConversation={() => handleOpenConversation('hub')}
        />

        {/* 2. Quem Somos: Citação, Perfil da Regina e 6 Competências */}
        <AboutUs onOpenConversation={() => handleOpenConversation('hub')} />

        {/* 3. Filosofia & Manifesto: Ideia ➔ Forma ➔ Solução */}
        <Philosophy />

        {/* 4. O Que Fazemos: Soluções Digitais Sob Medida */}
        <Solutions onSelectSolutionForContact={handleSelectSolutionForContact} />

        {/* 5. Para Quem: Perfis de Negócios e Desafios Reais */}
        <TargetAudience />

        {/* 6. Projetos Reais: Histórias e Casos Práticos */}
        <UseCases onSelectSolutionForContact={handleSelectSolutionForContact} />

        {/* 7. Página Final & Agendamento: Agendamento Google Meet, Diagnóstico e WhatsApp */}
        <ContactSection
          prefilledNeed={prefilledNeed}
          prefilledSolution={prefilledSolution}
          onOpenMeeting={() => handleOpenConversation('meeting')}
          onOpenWhatsApp={() => handleOpenConversation('whatsapp')}
        />
      </main>

      {/* 8. Footer with Password-Protected Admin Access (Painel Administrativo & Configurações) */}
      <Footer
        onOpenConversation={() => handleOpenConversation('hub')}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Interactive Conversation & Scheduling Modal (with autonomous reschedule/cancel & email automation) */}
      <ConversationModal
        isOpen={isConversationOpen}
        onClose={() => setIsConversationOpen(false)}
        initialTab={conversationInitialTab}
      />

      {/* 8. Painel Administrativo (ADM) e Configurações */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
