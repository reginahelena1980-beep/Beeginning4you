import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import {
  Send,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Video,
  ShieldCheck,
  X,
  ArrowRight
} from 'lucide-react';
import { ContactFormData } from '../types';
import { saveDemandForm, getContactConfig, STORAGE_CHANGE_EVENT } from '../utils/adminStorage';
import { useLanguage } from '../context/LanguageContext';
import { TRANSLATIONS } from '../data/translations';
import { maskPhoneOrEmail } from '../utils/phoneMask';

interface ContactSectionProps {
  prefilledNeed?: string;
  prefilledSolution?: string;
  onOpenMeeting?: () => void;
  onOpenWhatsApp?: () => void;
  isOpenDirectly?: boolean;
}

export default function ContactSection({
  prefilledNeed = '',
  prefilledSolution = '',
  onOpenMeeting,
  onOpenWhatsApp,
  isOpenDirectly = false
}: ContactSectionProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const t = TRANSLATIONS[language].contact;
  const [isModalOpen, setIsModalOpen] = useState(isOpenDirectly);
  const [contactConfig, setContactConfig] = useState(getContactConfig());

  useEffect(() => {
    const handleConfigChange = () => setContactConfig(getContactConfig());
    window.addEventListener(STORAGE_CHANGE_EVENT, handleConfigChange);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handleConfigChange);
  }, []);

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    businessName: '',
    segment: 'comercio',
    contactMethod: 'whatsapp',
    contactValue: '',
    biggestNeed: '',
    projectStage: 'rodando'
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prefilledNeed || prefilledSolution) {
      const combined = [
        prefilledSolution ? (isEn ? `Interest in: ${prefilledSolution}` : `Interesse em: ${prefilledSolution}`) : '',
        prefilledNeed ? (isEn ? `Main challenge: ${prefilledNeed}` : `Desafio principal: ${prefilledNeed}`) : ''
      ]
        .filter(Boolean)
        .join('. ');

      setFormData((prev) => ({
        ...prev,
        biggestNeed: prev.biggestNeed ? `${prev.biggestNeed}\n\n${combined}` : combined
      }));
      setIsModalOpen(true);
    }
  }, [prefilledNeed, prefilledSolution, isEn]);

  useEffect(() => {
    if (isOpenDirectly) {
      setIsModalOpen(true);
    }
  }, [isOpenDirectly]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'contactValue') {
      setFormData((prev) => ({ ...prev, [name]: maskPhoneOrEmail(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    saveDemandForm({
      id: `demand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: formData.name.trim(),
      email: formData.contactValue.includes('@') ? formData.contactValue.trim() : '',
      phone: formData.contactValue.trim(),
      businessDescription: `${formData.businessName ? `[${formData.businessName} - ${formData.segment}] ` : ''}${formData.biggestNeed.trim()}`,
      mainGoal: formData.projectStage,
      urgency: formData.projectStage === 'urgente' ? 'alta' : 'media',
      origin: 'diagnostic_pedir',
      status: 'new',
      createdAt: new Date().toISOString()
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 450);
  };

  const generateWhatsAppUrl = () => {
    const stageMap: Record<string, string> = {
      ideia: isEn ? 'I have an idea I want to launch' : 'Tenho uma ideia que quero tirar do papel',
      rodando: isEn ? 'My business is already running and I want to upgrade' : 'Já tenho o negócio rodando e quero melhorar',
      urgente: isEn ? 'I need to streamline my operations urgently' : 'Preciso organizar meus processos com urgência'
    };

    const text = encodeURIComponent(
      isEn
        ? `Hello, Beeginning 4 You! I sent my request through the website contact form.\n\n` +
          `👤 *My Name:* ${formData.name || 'Not specified'}\n` +
          `🏢 *Business:* ${formData.businessName || 'Not specified'} (${formData.segment})\n` +
          `🎯 *Stage:* ${stageMap[formData.projectStage] || formData.projectStage}\n` +
          `💡 *Need:* ${formData.biggestNeed || 'I would like to explore bespoke options'}\n\n` +
          `I would love to take the next step.`
        : `Olá, Beeginning 4 You! Enviei o meu diagnóstico pelo formulário de contato do site.\n\n` +
          `👤 *Meu Nome:* ${formData.name || 'Não informado'}\n` +
          `🏢 *Negócio:* ${formData.businessName || 'Não informado'} (${formData.segment})\n` +
          `🎯 *Momento:* ${stageMap[formData.projectStage] || formData.projectStage}\n` +
          `💡 *O que preciso:* ${formData.biggestNeed || 'Gostaria de entender as opções sob medida'}\n\n` +
          `Gostaria de dar o próximo passo.`
    );

    const phone = contactConfig.whatsappNumber ? contactConfig.whatsappNumber.replace(/\D/g, '') : '5511986297916';
    return `https://wa.me/${phone}?text=${text}`;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (isSubmitted) {
      setIsSubmitted(false);
      setFormData({
        name: '',
        businessName: '',
        segment: 'comercio',
        contactMethod: 'whatsapp',
        contactValue: '',
        biggestNeed: '',
        projectStage: 'rodando'
      });
    }
  };

  return (
    <>
      <section id="agendamento" className="py-16 sm:py-24 bg-[#FFFFFF] relative scroll-mt-16 border-t border-[#EAE6DF]">
        <div id="diagnostico-final" />
        <div id="contato" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 7. Página Final & Agendamento */}
          <div className="max-w-4xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3A47]/10 text-[#1E3A47] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D99B26]" />
              <span>{isEn ? "Final Page & Scheduling" : "Página Final & Agendamento"}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-[#1A1A1A] tracking-tight">
              {isEn ? "Ready to Bring Your Idea to Life or Optimize Your Workflow?" : "Pronto para Dar o Próximo Passo no Seu Negócio?"}
            </h2>

            <p className="text-sm sm:text-base text-[#555555] max-w-2xl mx-auto leading-relaxed">
              {isEn
                ? "Choose how you prefer to get started: schedule a dedicated 45-minute Google Meet consultation, request a quick diagnostic, or connect directly on WhatsApp with total confidentiality."
                : "Escolha como prefere iniciar: agende uma reunião virtual de 45 minutos no Google Meet, solicite um diagnóstico rápido ou converse diretamente pelo WhatsApp com total sigilo e acolhimento."}
            </p>

            {/* Core Action Cards */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
              {/* Option 1: Agendamento Google Meet */}
              <div
                onClick={onOpenMeeting}
                className="p-5 rounded-2xl border-2 border-[#E5E5E2] hover:border-[#D99B26] bg-[#FDFCFB] hover:bg-white transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-[#E5A93B]/20 text-[#8F6413] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Video className="w-5 h-5 text-[#D99B26]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#8F6413] transition-colors">
                    {isEn ? "Schedule on Google Meet" : "Agendar Google Meet"}
                  </h4>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    {isEn ? "45 min video call with calendar sync." : "Encontro virtual de 45 min com sala dedicada."}
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#EAEAE7] flex items-center justify-between text-xs font-bold text-[#8F6413]">
                  <span>{isEn ? "Book slot" : "Escolher horário"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Option 2: Pedir Diagnóstico Rápido */}
              <div
                id="btn-pedir-diagnostico-card"
                onClick={() => setIsModalOpen(true)}
                className="p-5 rounded-2xl border-2 border-[#E5A93B] bg-[#FFFDF7] hover:bg-white transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-[#E5A93B] text-[#1A1A1A] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#D99B26] transition-colors">
                    {isEn ? "Quick Diagnostic" : "Pedir Diagnóstico"}
                  </h4>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    {isEn ? "Tell us your biggest challenge in 1 minute." : "Conte sua maior dor em 1 min para receber a indicação ideal."}
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#EAEAE7] flex items-center justify-between text-xs font-bold text-[#D99B26]">
                  <span>{isEn ? "Start now" : "Preencher formulário"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Option 3: WhatsApp Direto */}
              <div
                onClick={onOpenWhatsApp}
                className="p-5 rounded-2xl border-2 border-[#E5E5E2] hover:border-[#25D366] bg-[#FDFCFB] hover:bg-white transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#136C35] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5 text-[#1EBE5D]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#136C35] transition-colors">
                    {isEn ? "Direct WhatsApp" : "Falar no WhatsApp"}
                  </h4>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    {isEn ? "Direct real-time chat with Regina." : "Converse em tempo real sem intermediários."}
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#EAEAE7] flex items-center justify-between text-xs font-bold text-[#136C35]">
                  <span>{isEn ? "Send message" : "Iniciar conversa"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Confidentiality seal */}
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#666666]">
              <ShieldCheck className="w-4 h-4 text-[#D99B26]" />
              <span>{isEn ? "Strict confidentiality and personal data protection guaranteed (LGPD)" : "Sigilo absoluto garantido e proteção de dados segundo a LGPD (Lei nº 13.709/2018)"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Formulário de Contato & Diagnóstico (Exibido apenas ao clicar em Pedir Diagnóstico Rápido) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl border border-[#E5E5E2] p-5 sm:p-8 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 text-[#777777] hover:text-[#1A1A1A] hover:bg-[#F2F2EF] rounded-xl transition-colors cursor-pointer"
              aria-label={isEn ? "Close contact form" : "Fechar formulário de contato"}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="border-b border-[#EAEAE7] pb-4 mb-5 pr-8">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1E3A47]/8 text-[#1E3A47] text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-[#D99B26]" />
                  <span>{isEn ? "Tailored Diagnostic" : "Diagnóstico Sob Medida"}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#136C35] bg-[#25D366]/10 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1EBE5D]" />
                  <span>{isEn ? "Privacy & Confidentiality" : "Sigilo & LGPD"}</span>
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-[#1A1A1A]">
                {isEn ? "Contact Form & Quick Diagnostic" : "Formulário de Contato & Diagnóstico Rápido"}
              </h3>
              <p className="text-xs text-[#666666] mt-0.5">
                {isEn
                  ? "Fill out the fields below. Your details are saved securely into our private system with strict data protection."
                  : "Preencha os campos abaixo. Seus dados são salvos diretamente em nosso sistema com proteção integral."}
              </p>
            </div>

            {isSubmitted ? (
              <div className="py-6 px-4 text-center space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-lg font-bold text-[#1A1A1A]">
                    {t.successTitle}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                    {isEn
                      ? `Thank you, ${formData.name}. Our team has registered your request and will reach out shortly through your contact info (${formData.contactValue}).`
                      : `Obrigado, ${formData.name}. Nossa equipe já registrou a sua demanda e entrará em contato em breve através do canal informado (${formData.contactValue}).`}
                  </p>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <a
                    href={generateWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{isEn ? "Chat now on WhatsApp" : "Falar agora no WhatsApp"}</span>
                  </a>

                  {onOpenMeeting && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseModal();
                        onOpenMeeting();
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A47] hover:bg-[#162B34] text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>{isEn ? "Schedule on Google Meet" : "Agendar no Google Meet"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs text-[#666666] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                  >
                    {isEn ? "Close" : "Fechar"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="diag-input-name"
                      className="block text-xs font-bold uppercase tracking-wider text-[#333333] mb-1"
                    >
                      {isEn ? "Your Name *" : "Seu Nome *"}
                    </label>
                    <input
                      type="text"
                      id="diag-input-name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={isEn ? "How would you like to be called?" : "Como você prefere ser chamado(a)?"}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/20 text-xs sm:text-sm outline-none transition-all"
                    />
                  </div>

                  {/* Business Name */}
                  <div>
                    <label
                      htmlFor="diag-input-business"
                      className="block text-xs font-bold uppercase tracking-wider text-[#333333] mb-1"
                    >
                      {isEn ? "Business or Project Name" : "Nome do Negócio ou Projeto"}
                    </label>
                    <input
                      type="text"
                      id="diag-input-business"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder={isEn ? "E.g.: My Studio (or 'Just starting')" : "Ex: Meu Negócio (ou 'Ainda no início')"}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/20 text-xs sm:text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Contact Preferred */}
                  <div>
                    <label
                      htmlFor="diag-input-contact"
                      className="block text-xs font-bold uppercase tracking-wider text-[#333333] mb-1"
                    >
                      {isEn ? "WhatsApp or Email for Follow-up *" : "WhatsApp ou E-mail para Retorno *"}
                    </label>
                    <input
                      type="text"
                      id="diag-input-contact"
                      name="contactValue"
                      required
                      value={formData.contactValue}
                      onChange={handleChange}
                      placeholder={isEn ? "E.g.: (11) 98765-4321 or you@email.com" : "Ex: (11) 98765-4321 ou seu@email.com"}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/20 text-xs sm:text-sm outline-none transition-all"
                    />
                  </div>

                  {/* Project Stage */}
                  <div>
                    <label
                      htmlFor="diag-select-stage"
                      className="block text-xs font-bold uppercase tracking-wider text-[#333333] mb-1"
                    >
                      {isEn ? "What Stage Are You In?" : "Em Qual Momento Você Está?"}
                    </label>
                    <select
                      id="diag-select-stage"
                      name="projectStage"
                      value={formData.projectStage}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/20 text-xs sm:text-sm outline-none transition-all cursor-pointer"
                    >
                      <option value="ideia">{isEn ? "Idea I want to bring to life" : "Ideia que quero tirar do papel"}</option>
                      <option value="rodando">{isEn ? "Running business, looking to optimize" : "Já tenho o negócio e quero melhorar"}</option>
                      <option value="urgente">{isEn ? "Need to organize with urgency" : "Preciso organizar com urgência"}</option>
                    </select>
                  </div>
                </div>

                {/* The Core Question: What does this business really need? */}
                <div>
                  <label
                    htmlFor="diag-textarea-need"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1E3A47] mb-1"
                  >
                    {isEn ? "What does your business truly need today? *" : "O que o seu negócio realmente precisa hoje? *"}
                  </label>
                  <textarea
                    id="diag-textarea-need"
                    name="biggestNeed"
                    rows={3}
                    required
                    value={formData.biggestNeed}
                    onChange={handleChange}
                    placeholder={
                      isEn
                        ? "In your own words: which process is taking too much time? Financial clarity, pricing calculator, custom web platform, or scheduling automation?"
                        : "Conte com suas palavras: qual processo está tomando seu tempo? Precisa de controle financeiro, cálculo de preço, plataforma web ou organização de agenda?"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/20 text-xs sm:text-sm outline-none transition-all resize-y"
                  />
                  <p className="text-[11px] text-[#777777] mt-1">
                    {isEn
                      ? "Do not worry about technical jargon. Tell us about your daily reality and we will engineer the best solution."
                      : "Não se preocupe com termos técnicos. Fale da sua rotina real que nós desenhamos a solução ideal."}
                  </p>
                </div>

                {/* Mandatory Term of Confidentiality Checkbox */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E2DDD5]">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      defaultChecked
                      className="mt-0.5 w-4 h-4 rounded text-[#D99B26] focus:ring-[#D99B26] border-[#D5D5D0] cursor-pointer"
                    />
                    <span className="text-xs text-[#555555] leading-relaxed">
                      {isEn ? (
                        <>
                          I agree to Beeginning 4 you's <strong className="text-[#1A1A1A]">Confidentiality & Data Privacy Commitment</strong>. My information and ideas will be handled with strict secrecy and exclusively for this consultation.
                        </>
                      ) : (
                        <>
                          Concordo com o <strong className="text-[#1A1A1A]">Compromisso de Sigilo e LGPD</strong> da Beeginning 4 you. Minhas informações e ideias serão tratadas com total confidencialidade e exclusivamente para este atendimento.
                        </>
                      )}
                    </span>
                  </label>
                </div>

                {/* Submit CTA */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <p className="text-[11px] text-[#666666]">
                    {t.privacyNote}
                  </p>

                  <button
                    type="submit"
                    id="btn-submit-diagnostic"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-[#1A1A1A] bg-[#E5A93B] hover:bg-[#D99B26] active:scale-98 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>{t.submittingBtn}</span>
                    ) : (
                      <>
                        <span>{t.submitBtn}</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
