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
    const diagnosticEl = document.querySelector('#diagnostico-final');
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

      {/* Main Page Flow */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero onOpenDiagnostic={() => {
          const el = document.querySelector('#diagnostico-final');
          el?.scrollIntoView({ behavior: 'smooth' });
        }} />

        {/* 2. Quem Somos: O Conceito e o Símbolo do Infinito */}
        <AboutUs onOpenConversation={() => handleOpenConversation('hub')} />

        {/* 3. Philosophy & Manifesto: Ideia ➔ Forma ➔ Solução */}
        <Philosophy />

        {/* 4. What We Do: Digital Solutions for Small Businesses */}
        <Solutions onSelectSolutionForContact={handleSelectSolutionForContact} />

        {/* 5. Target Audience: Para Quem é? */}
        <TargetAudience />

        {/* 6. Real Stories / Use Cases (Projetos Reais) */}
        <UseCases onSelectSolutionForContact={handleSelectSolutionForContact} />

        {/* 7. End of page: Pedir Diagnóstico Rápido & Contact Section */}
        <ContactSection
          prefilledNeed={prefilledNeed}
          prefilledSolution={prefilledSolution}
          onOpenMeeting={() => handleOpenConversation('meeting')}
          onOpenWhatsApp={() => handleOpenConversation('whatsapp')}
        />
      </main>

      {/* 8. Footer with Password-Protected Admin Access via © 2026 */}
      <Footer
        onOpenConversation={() => handleOpenConversation('hub')}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Interactive Conversation & Scheduling Modal */}
      <ConversationModal
        isOpen={isConversationOpen}
        onClose={() => setIsConversationOpen(false)}
        initialTab={conversationInitialTab}
      />

      {/* Password-Protected Administrative Dashboard */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
