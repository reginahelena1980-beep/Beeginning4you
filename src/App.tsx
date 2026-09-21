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
import DiagnosticWidget from './components/DiagnosticWidget';

export default function App() {
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [prefilledNeed, setPrefilledNeed] = useState<string>('');
  const [prefilledSolution, setPrefilledSolution] = useState<string>('');

  const handleOpenDiagnostic = () => {
    setIsDiagnosticOpen(true);
  };

  const handleSelectDiagnosticResult = (recommendation: string, pain: string) => {
    setPrefilledSolution(recommendation);
    setPrefilledNeed(pain);
    // Smoothly scroll down to the contact section
    const contactEl = document.querySelector('#contato');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectSolutionForContact = (solutionTitle: string) => {
    setPrefilledSolution(solutionTitle);
    const contactEl = document.querySelector('#contato');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F8] text-[#1A1A1A] font-sans selection:bg-[#E5A93B]/20 selection:text-[#1A1A1A]">
      {/* Top Main Navigation */}
      <Header onOpenDiagnostic={handleOpenDiagnostic} />

      {/* Main Page Flow */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero onOpenDiagnostic={handleOpenDiagnostic} />

        {/* 2. Quem Somos: O Conceito e o Símbolo do Infinito */}
        <AboutUs />

        {/* 3. Philosophy & Manifesto: Ideia ➔ Forma ➔ Solução */}
        <Philosophy />

        {/* 4. What We Do: Digital Solutions for Small Businesses */}
        <Solutions onSelectSolutionForContact={handleSelectSolutionForContact} />

        {/* 5. Target Audience: Para Quem é? */}
        <TargetAudience />

        {/* 6. Real Stories / Use Cases */}
        <UseCases />

        {/* 7. Contact & Practical Diagnostic Form */}
        <ContactSection
          prefilledNeed={prefilledNeed}
          prefilledSolution={prefilledSolution}
        />
      </main>

      {/* 8. Footer */}
      <Footer />

      {/* Interactive Diagnostic Quiz Modal */}
      <DiagnosticWidget
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        onSelectResult={handleSelectDiagnosticResult}
      />
    </div>
  );
}
