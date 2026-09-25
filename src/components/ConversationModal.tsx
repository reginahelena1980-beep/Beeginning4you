import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Calendar,
  Video,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  ChevronLeft,
  Lock,
  User,
  Mail,
  Phone,
  AlertCircle,
  RefreshCw,
  XCircle,
  Send
} from 'lucide-react';
import { MeetingAppointment } from '../types';
import {
  getContactConfig,
  saveDemandForm,
  getAvailabilityConfig,
  STORAGE_CHANGE_EVENT
} from '../utils/adminStorage';
import {
  saveAppointment,
  generateGoogleCalendarUrl,
  getAvailableBusinessDays,
  AVAILABLE_TIME_SLOTS,
  getDailyTimeSlots,
  cancelAppointmentInStorage,
  rescheduleAppointmentInStorage,
  sendOfficialConfirmationEmail,
  sendOfficialRescheduleEmail,
  sendOfficialCancellationEmail,
  getWhatsAppUrlClientToRegina,
  validateAppointmentSlot,
  getAvailableSlotsForDate,
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP
} from '../utils/calendar';
import { useLanguage } from '../context/LanguageContext';
import { maskPhone } from '../utils/phoneMask';

interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'hub' | 'whatsapp' | 'meeting';
}

export default function ConversationModal({
  isOpen,
  onClose,
  initialTab = 'hub'
}: ConversationModalProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'hub' | 'whatsapp' | 'meeting'>(initialTab);
  const [config, setConfig] = useState(getContactConfig());

  // WhatsApp form state
  const [waName, setWaName] = useState('');
  const [waNote, setWaNote] = useState('');
  const [waTermAccepted, setWaTermAccepted] = useState(false);
  const [waError, setWaError] = useState('');

  // Meeting Booking form state
  const [availableDays, setAvailableDays] = useState(getAvailableBusinessDays());
  const [dailySlots, setDailySlots] = useState<string[]>(getDailyTimeSlots());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingTermAccepted, setMeetingTermAccepted] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [lastBookedMeeting, setLastBookedMeeting] = useState<MeetingAppointment | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Autonomous Reschedule & Cancellation states
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionNotice, setActionNotice] = useState<string>('');

  const refreshAvailability = () => {
    setConfig(getContactConfig());
    const freshDays = getAvailableBusinessDays();
    setAvailableDays(freshDays);
    const freshSlots = getDailyTimeSlots();
    setDailySlots(freshSlots);
  };

  // Reset and load initial on open
  useEffect(() => {
    if (isOpen) {
      refreshAvailability();
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setIsRescheduling(false);
      setIsCancelling(false);
      setActionNotice('');
    }
  }, [isOpen, initialTab]);

  // Real-time synchronization: listen for appointment bookings or admin schedule/blocks changes
  useEffect(() => {
    window.addEventListener(STORAGE_CHANGE_EVENT, refreshAvailability);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, refreshAvailability);
  }, []);

  // Pick first available unblocked date if none selected or if current is blocked
  useEffect(() => {
    if (isOpen && availableDays.length > 0) {
      const isCurrentValid = availableDays.some((d) => d.dateString === selectedDate && !d.isFullyBlocked);
      if (!isCurrentValid) {
        const firstUnblocked = availableDays.find((d) => !d.isFullyBlocked) || availableDays[0];
        if (firstUnblocked) {
          setSelectedDate(firstUnblocked.dateString);
        }
      }
    }
  }, [isOpen, availableDays, selectedDate]);

  // When selectedDate changes, automatically pick the first free time slot
  useEffect(() => {
    if (selectedDate) {
      const { freeSlots } = getAvailableSlotsForDate(selectedDate);
      if (freeSlots.length > 0 && (!selectedTime || !freeSlots.includes(selectedTime))) {
        setSelectedTime(freeSlots[0]);
      } else if (freeSlots.length === 0) {
        setSelectedTime('');
      }
    }
  }, [selectedDate, availableDays, dailySlots]);

  // When rescheduleDate changes, automatically pick the first free time slot
  useEffect(() => {
    if (isRescheduling && rescheduleDate) {
      const { freeSlots } = getAvailableSlotsForDate(rescheduleDate, lastBookedMeeting?.id);
      if (freeSlots.length > 0 && (!rescheduleTime || !freeSlots.includes(rescheduleTime))) {
        setRescheduleTime(freeSlots[0]);
      } else if (freeSlots.length === 0) {
        setRescheduleTime('');
      }
    }
  }, [rescheduleDate, isRescheduling, lastBookedMeeting]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOpenWhatsApp = () => {
    if (!waTermAccepted) {
      setWaError(
        isEn
          ? 'Please confirm your agreement with the confidentiality and privacy terms before continuing.'
          : 'Por favor, confirme a concordância com o termo de sigilo e LGPD antes de continuar.'
      );
      return;
    }
    setWaError('');

    // Also register demand in Admin Storage
    saveDemandForm({
      id: `demand-wa-${Date.now()}`,
      name: waName.trim() || (isEn ? 'WhatsApp Visitor' : 'Cliente WhatsApp'),
      email: '',
      phone: '',
      businessDescription: waNote.trim() || (isEn ? 'Contact initiated via official WhatsApp' : 'Contato iniciado via WhatsApp oficial'),
      mainGoal: 'contato_direto',
      urgency: 'media',
      origin: 'whatsapp_modal',
      status: 'in_progress',
      createdAt: new Date().toISOString()
    });

    let text = isEn
      ? 'Hello! I found Beeginning 4 you through the website and would love to talk about my business idea.'
      : 'Olá! Vim pelo site da Beeginning 4 you e gostaria de conversar sobre uma ideia de negócio.';
    if (waName.trim()) {
      text += `\n\n👤 *${isEn ? 'My name' : 'Meu nome'}:* ${waName.trim()}`;
    }
    if (waNote.trim()) {
      text += `\n💡 *${isEn ? 'Topic' : 'Assunto'}:* ${waNote.trim()}`;
    }
    text += isEn
      ? `\n\n🔒 *Confidentiality:* I am aware of and agree to the confidentiality & privacy terms.`
      : `\n\n🔒 *Sigilo:* Estou ciente e de acordo com o termo de sigilo e LGPD.`;

    const encoded = encodeURIComponent(text);
    const waNumber = config.whatsappNumber ? config.whatsappNumber.replace(/\D/g, '') : '5511986297916';
    const url = `https://wa.me/${waNumber}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleConfirmMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTermAccepted) {
      setBookingError(
        isEn
          ? 'You must accept the confidentiality and privacy policy to proceed with booking.'
          : 'É necessário aceitar a política de sigilo e LGPD para prosseguir com o agendamento.'
      );
      return;
    }
    if (!selectedDate || !selectedTime) {
      setBookingError(
        isEn ? 'Please choose an available date and time.' : 'Por favor, selecione uma data e horário disponíveis.'
      );
      return;
    }
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      setBookingError(
        isEn
          ? 'Please fill in your name, email, and phone/WhatsApp to confirm your booking.'
          : 'Preencha seu nome, e-mail e telefone/WhatsApp para confirmarmos seu agendamento.'
      );
      return;
    }

    // Strict slot availability & conflict validation
    const slotCheck = validateAppointmentSlot(selectedDate, selectedTime);
    if (!slotCheck.valid) {
      setBookingError(
        slotCheck.reason ||
          (isEn
            ? 'This slot is no longer available. Please select another time.'
            : 'Este horário acabou de se tornar indisponível. Por favor, escolha outro horário.')
      );
      return;
    }

    setBookingError('');
    const newAppointment: MeetingAppointment = {
      id: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      topic: meetingTopic.trim() || (isEn ? 'Initial discussion about business idea' : 'Conversa inicial sobre ideia de negócio'),
      date: selectedDate,
      time: selectedTime,
      durationMinutes: 45,
      meetLink: config.fixedMeetUrl || config.meetUrl || 'https://meet.google.com/fxx-ctnv-hgm',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      confidentialityAccepted: true,
      history: [
        {
          date: new Date().toISOString(),
          action: isEn
            ? 'Appointment confirmed with Google Meet room and Google Calendar integration'
            : 'Agendamento confirmado com sala Google Meet e integração com Google Calendar'
        }
      ]
    };

    saveAppointment(newAppointment);
    setLastBookedMeeting(newAppointment);
    setBookingSuccess(true);
    setActionNotice('');

    // Trigger official confirmation email dispatch directly from beeginning4you@gmail.com
    sendOfficialConfirmationEmail(newAppointment, isEn);
  };

  // Helper to re-send appointment confirmation to client via Official Email
  const handleSendToClientEmail = async () => {
    if (!lastBookedMeeting) return;
    const res = await sendOfficialConfirmationEmail(lastBookedMeeting, isEn);
    setActionNotice(
      res.success
        ? (isEn ? `Confirmation email resent to ${lastBookedMeeting.clientEmail}.` : `E-mail de confirmação reenviado para ${lastBookedMeeting.clientEmail}.`)
        : (isEn ? `Dispatch triggered. Please verify your inbox.` : `Disparo acionado para ${lastBookedMeeting.clientEmail}.`)
    );
  };

  // Autonomous Rescheduling Action
  const handleStartReschedule = () => {
    if (!lastBookedMeeting) return;
    setRescheduleDate(lastBookedMeeting.date);
    setRescheduleTime(lastBookedMeeting.time);
    setRescheduleError('');
    setIsRescheduling(true);
    setIsCancelling(false);
  };

  const handleConfirmReschedule = () => {
    if (!lastBookedMeeting) return;
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError(isEn ? 'Please choose a date and time.' : 'Por favor, selecione uma data e horário.');
      return;
    }
    if (rescheduleDate === lastBookedMeeting.date && rescheduleTime === lastBookedMeeting.time) {
      setRescheduleError(
        isEn
          ? 'Please select a different date or time to reschedule.'
          : 'Por favor, selecione uma data ou horário diferente para reagendar.'
      );
      return;
    }

    // Strict slot availability check excluding this appointment
    const slotCheck = validateAppointmentSlot(rescheduleDate, rescheduleTime, lastBookedMeeting.id);
    if (!slotCheck.valid) {
      setRescheduleError(
        slotCheck.reason ||
          (isEn
            ? 'This slot is unavailable for rescheduling. Please select another slot.'
            : 'Este horário está indisponível para reagendamento. Por favor, escolha outro horário.')
      );
      return;
    }

    const prevDate = lastBookedMeeting.date;
    const prevTime = lastBookedMeeting.time;

    rescheduleAppointmentInStorage(lastBookedMeeting.id, rescheduleDate, rescheduleTime);

    const updated: MeetingAppointment = {
      ...lastBookedMeeting,
      date: rescheduleDate,
      time: rescheduleTime,
      status: 'rescheduled',
      history: [
        ...(lastBookedMeeting.history || []),
        {
          date: new Date().toISOString(),
          action: `Reagendada pelo cliente para ${rescheduleDate} às ${rescheduleTime}`
        }
      ]
    };

    setLastBookedMeeting(updated);
    setIsRescheduling(false);
    setRescheduleError('');

    // Dispatch official rescheduling notification email from beeginning4you@gmail.com
    sendOfficialRescheduleEmail(updated, prevDate, prevTime, isEn);

    setActionNotice(
      isEn
        ? `Meeting rescheduled! Official update dispatched from ${OFFICIAL_EMAIL} to ${updated.clientEmail}.`
        : `Reunião reagendada com sucesso! Notificação oficial disparada de ${OFFICIAL_EMAIL} para ${updated.clientEmail}.`
    );
  };

  // Autonomous Cancellation Action
  const handleStartCancel = () => {
    setIsCancelling(true);
    setIsRescheduling(false);
  };

  const handleConfirmCancel = () => {
    if (!lastBookedMeeting) return;
    cancelAppointmentInStorage(lastBookedMeeting.id);

    const updated: MeetingAppointment = {
      ...lastBookedMeeting,
      status: 'cancelled',
      history: [
        ...(lastBookedMeeting.history || []),
        {
          date: new Date().toISOString(),
          action: 'Reunião cancelada pelo cliente'
        }
      ]
    };

    setLastBookedMeeting(updated);
    setIsCancelling(false);

    // Dispatch official cancellation email from beeginning4you@gmail.com
    sendOfficialCancellationEmail(updated, isEn);

    setActionNotice(
      isEn
        ? `Meeting cancelled. Official cancellation notice sent from ${OFFICIAL_EMAIL} to ${updated.clientEmail}.`
        : `Reunião cancelada com sucesso. Notificação oficial enviada a partir de ${OFFICIAL_EMAIL} para ${updated.clientEmail}.`
    );
  };

  // Reset to schedule another meeting
  const handleScheduleNewMeeting = () => {
    setBookingSuccess(false);
    setLastBookedMeeting(null);
    setIsRescheduling(false);
    setIsCancelling(false);
    setActionNotice('');
  };

  return (
    <div
      id="conversation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="conversation-modal-card"
        className="w-full max-w-2xl bg-[#FFFFFF] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E8E8E5] overflow-hidden flex flex-col max-h-[92vh] text-[#1A1A1A] animate-scaleUp"
      >
        {/* Header Bar */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-[#EAEAE7] bg-[#FBFBFA] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {activeTab !== 'hub' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('hub');
                  setBookingSuccess(false);
                  setBookingError('');
                  setWaError('');
                }}
                className="p-1.5 -ml-1 text-[#666666] hover:text-[#1A1A1A] hover:bg-[#EBEBE8] rounded-lg transition-colors cursor-pointer"
                title={isEn ? "Back to main menu" : "Voltar ao menu principal"}
                aria-label={isEn ? "Back to menu" : "Voltar ao menu de atendimento"}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93B] animate-pulse" />
                <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
                  {activeTab === 'hub' && (isEn ? "Let's talk" : 'Vamos conversar?')}
                  {activeTab === 'whatsapp' && (isEn ? 'WhatsApp Chat' : 'Atendimento via WhatsApp')}
                  {activeTab === 'meeting' &&
                    (bookingSuccess
                      ? (isEn ? 'Meeting Confirmed!' : 'Reunião Confirmada!')
                      : (isEn ? 'Schedule a Google Meet' : 'Agendar Reunião Google Meet'))}
                </h3>
              </div>
              <p className="text-xs text-[#666666] mt-0.5">
                {activeTab === 'hub' && (isEn ? 'Transparency, warm listening, and commitment to your vision' : 'Transparência, acolhimento e compromisso com o seu negócio')}
                {activeTab === 'whatsapp' && (isEn ? 'Direct connection with our team' : 'Conecte-se diretamente com nossa equipe')}
                {activeTab === 'meeting' &&
                  (bookingSuccess
                    ? (isEn ? 'Your virtual session is reserved' : 'Seu encontro virtual está reservado')
                    : (isEn ? 'Face-to-face video call with dedicated Google Meet room' : 'Reunião virtual face a face com sala fixa no Google Meet'))}
              </p>
            </div>
          </div>

          <button
            id="conversation-modal-close"
            type="button"
            onClick={onClose}
            className="p-2 text-[#777777] hover:text-[#1A1A1A] hover:bg-[#EAEAE7] rounded-full transition-colors cursor-pointer"
            aria-label={isEn ? "Close window" : "Fechar janela"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: HUB / MENU DE ATENDIMENTO */}
          {activeTab === 'hub' && (
            <div className="space-y-6">
              {/* 1. O COMPROMISSO DE SIGILO E LGPD FICA ANTES DOS CANAIS DE CONTATO */}
              <div
                id="confidentiality-notice-box"
                className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#FAF8F5] via-[#FFFDF9] to-[#F5F2EA] border-2 border-[#E5A93B]/40 shadow-sm space-y-3 relative overflow-hidden"
              >
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E5A93B]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#8F6413]">
                    <div className="w-7 h-7 rounded-lg bg-[#E5A93B]/20 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-[#D99B26]" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#1A1A1A]">
                      {isEn ? "CONFIDENTIALITY & PRIVACY COMMITMENT" : "COMPROMISSO DE SIGILO E LGPD"}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E5A93B]/20 text-[#8F6413] border border-[#E5A93B]/30 shrink-0">
                    {isEn ? "Guaranteed Protection" : "Segurança Garantida"}
                  </span>
                </div>

                <blockquote className="text-xs sm:text-sm text-[#3A3A38] leading-relaxed border-l-3 border-[#D99B26] pl-3.5 py-1 italic font-medium bg-white/60 rounded-r-lg">
                  {isEn ? (
                    <>&ldquo;Beeginning 4 you strictly commits to maintaining absolute confidentiality regarding all business ideas, concepts, and information shared during this first contact and any subsequent meetings, guaranteeing complete intellectual property protection to the client. In addition, we ensure full data privacy compliance, using your info solely to enable our consultation and scheduling.&rdquo;</>
                  ) : (
                    <>&ldquo;A Beeginning 4 you se compromete rigorosamente a manter o sigilo absoluto sobre todas as ideias de negócio, conceitos e informações compartilhadas neste primeiro contato e em reuniões subsequentes, garantindo total segurança e propriedade intelectual ao cliente. Além disso, asseguramos a proteção dos seus dados pessoais em total conformidade com a LGPD (Lei nº 13.709/2018), utilizando-os exclusivamente para viabilizar o nosso contato e agendamentos.&rdquo;</>
                  )}
                </blockquote>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-[#555555]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Lock className="w-3.5 h-3.5 text-[#D99B26] shrink-0" />
                    <span>{isEn ? "Idea Protection" : "Proteção de Ideias"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D99B26] shrink-0" />
                    <span>{isEn ? "Data Compliance" : "Conformidade LGPD"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#D99B26] shrink-0" />
                    <span>{isEn ? "Permanent Secrecy" : "Sigilo Permanente"}</span>
                  </div>
                </div>
              </div>

              {/* 2. CANAIS DE CONTATO DISPONÍVEIS */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666] block">
                  {isEn ? "Choose how you prefer to connect:" : "Escolha como prefere iniciar o contato:"}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opção 1: WhatsApp */}
                  <div
                    id="opt-whatsapp-card"
                    onClick={() => setActiveTab('whatsapp')}
                    className="group relative p-5 rounded-2xl border-2 border-[#E5E5E2] hover:border-[#25D366] bg-[#FFFFFF] hover:bg-[#F6FFF8] transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-[#25D366]/15 text-[#136C35] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <MessageCircle className="w-6 h-6 text-[#1EBE5D]" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#25D366]/15 text-[#136C35]">
                          {isEn ? "Fast & Direct" : "Ágil & Direto"}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-[#1A1A1A] group-hover:text-[#136C35] transition-colors">
                          {isEn ? "Send a message on WhatsApp" : "Mande uma mensagem pelo WhatsApp"}
                        </h4>
                        <p className="text-xs text-[#555555] mt-1.5 leading-relaxed">
                          {isEn
                            ? "Chat directly with our team in real-time. Ideal for quick questions, proposal scopes, or initial brainstorming."
                            : "Converse em tempo real com nossa equipe. Ideal para tirar dúvidas rápidas, pedir orçamento ou trocar ideias iniciais sem burocracia."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#EAEAE7] flex items-center justify-between text-xs font-bold text-[#136C35]">
                      <span>{isEn ? "Start chat" : "Iniciar conversa"}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Opção 2: Reunião Google Meet */}
                  <div
                    id="opt-meeting-card"
                    onClick={() => setActiveTab('meeting')}
                    className="group relative p-5 rounded-2xl border-2 border-[#E5E5E2] hover:border-[#D99B26] bg-[#FFFFFF] hover:bg-[#FFFDF7] transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-[#E5A93B]/20 text-[#8F6413] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Video className="w-6 h-6 text-[#D99B26]" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#E5A93B]/20 text-[#8F6413]">
                          {isEn ? "Face to Face" : "Face a Face"}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-[#1A1A1A] group-hover:text-[#8F6413] transition-colors">
                          {isEn ? "Schedule a meeting with me" : "Agende uma reunião comigo"}
                        </h4>
                        <p className="text-xs text-[#555555] mt-1.5 leading-relaxed">
                          {isEn
                            ? "45-minute virtual video call on Google Meet. Select date and time with direct integration to Google Calendar."
                            : "Encontro virtual de 45 minutos no Google Meet. Escolha data e horário com integração direta ao Google Calendar."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#EAEAE7] flex items-center justify-between text-xs font-bold text-[#8F6413]">
                      <span>{isEn ? "Choose date & time" : "Escolher data e horário"}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP DIRECT MESSAGE */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-[#1EBE5D] shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-[#1F542E]">
                  <p className="font-bold">{isEn ? "Human Support on Official WhatsApp" : "Atendimento Humano no WhatsApp Oficial"}</p>
                  <p className="mt-0.5">
                    {isEn ? "We prepared an initial prompt to connect you directly to our team." : "Preparamos uma mensagem inicial para conectar você diretamente à nossa equipe."}
                  </p>
                </div>
              </div>

              {/* Pre-formatted message preview */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#333333]">
                  {isEn ? "Pre-formatted message:" : "Mensagem pré-formatada:"}
                </label>
                <div className="p-3.5 rounded-xl bg-[#F9F9F8] border border-[#E5E5E2] text-xs font-sans text-[#333333] whitespace-pre-wrap leading-relaxed">
                  {isEn
                    ? '“Hello! I found Beeginning 4 you through the website and would love to talk about my business idea.”'
                    : '“Olá! Vim pelo site da Beeginning 4 you e gostaria de conversar sobre uma ideia de negócio.”'}
                  {waName && `\n\n👤 ${isEn ? 'My name' : 'Meu nome'}: ${waName}`}
                  {waNote && `\n💡 ${isEn ? 'Detail' : 'Detalhe'}: ${waNote}`}
                </div>
              </div>

              {/* Optional Customization Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wa-input-name" className="block text-xs font-medium text-[#444444] mb-1">
                    {isEn ? "Your name or brand (optional)" : "Seu nome ou marca (opcional)"}
                  </label>
                  <input
                    id="wa-input-name"
                    type="text"
                    value={waName}
                    onChange={(e) => setWaName(e.target.value)}
                    placeholder={isEn ? "What should we call you?" : "Como podemos te chamar?"}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 text-xs text-[#1A1A1A] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="wa-input-note" className="block text-xs font-medium text-[#444444] mb-1">
                    {isEn ? "Brief topic (optional)" : "Adiantar assunto (opcional)"}
                  </label>
                  <input
                    id="wa-input-note"
                    type="text"
                    value={waNote}
                    onChange={(e) => setWaNote(e.target.value)}
                    placeholder={isEn ? "E.g.: Financial control, pricing, website..." : "Ex: Gestão financeira, cálculo de preço, site..."}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 text-xs text-[#1A1A1A] outline-none"
                  />
                </div>
              </div>

              {/* Mandatory Confidentiality Checkbox */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DDD5] space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    id="wa-confidentiality-checkbox"
                    type="checkbox"
                    checked={waTermAccepted}
                    onChange={(e) => {
                      setWaTermAccepted(e.target.checked);
                      if (e.target.checked) setWaError('');
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-[#D99B26] focus:ring-[#D99B26] border-[#D5D5D0] cursor-pointer"
                  />
                  <div className="text-xs text-[#333333] leading-relaxed">
                    <span className="font-bold text-[#1A1A1A]">
                      {isEn ? "Confidentiality & Privacy Term: " : "Termo de Sigilo e LGPD: "}
                    </span>
                    <span>
                      {isEn
                        ? "Beeginning 4 you strictly commits to maintaining absolute confidentiality regarding all business ideas and personal details shared, guaranteeing complete intellectual property protection."
                        : "A Beeginning 4 you se compromete rigorosamente a manter o sigilo absoluto sobre todas as ideias de negócio, conceitos e informações compartilhadas neste primeiro contato e em reuniões subsequentes, garantindo total segurança e propriedade intelectual ao cliente. Além disso, asseguramos a proteção dos seus dados pessoais em total conformidade com a LGPD (Lei nº 13.709/2018), utilizando-os exclusivamente para viabilizar o nosso contato e agendamentos."}
                    </span>
                  </div>
                </label>
              </div>

              {waError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{waError}</span>
                </div>
              )}

              {/* Action button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('hub')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D5D5D0] text-xs font-semibold text-[#555555] hover:text-[#1A1A1A] transition-colors cursor-pointer text-center"
                >
                  {isEn ? "Back to options" : "Voltar às opções"}
                </button>

                <button
                  id="btn-open-whatsapp"
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isEn ? "Send message on WhatsApp" : "Mandar mensagem pelo WhatsApp"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MEETING SCHEDULING OR BOOKING CONFIRMATION */}
          {activeTab === 'meeting' && (
            <div>
              {bookingSuccess && lastBookedMeeting ? (
                /* Post-Booking Confirmation & Google Calendar / Autonomous Reschedule & Cancel */
                <div className="space-y-6 animate-fadeIn">
                  {/* Header Status */}
                  <div className="text-center space-y-2 py-2">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                        lastBookedMeeting.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-700'
                          : lastBookedMeeting.status === 'rescheduled'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-[#E5A93B]/20 text-[#8F6413]'
                      }`}
                    >
                      {lastBookedMeeting.status === 'cancelled' ? (
                        <XCircle className="w-8 h-8 text-rose-600" />
                      ) : lastBookedMeeting.status === 'rescheduled' ? (
                        <RefreshCw className="w-7 h-7 text-amber-700" />
                      ) : (
                        <CheckCircle2 className="w-8 h-8 text-[#D99B26]" />
                      )}
                    </div>
                    <h4 className="text-xl font-display font-extrabold text-[#1A1A1A]">
                      {lastBookedMeeting.status === 'cancelled'
                        ? (isEn ? 'Meeting Cancelled' : 'Reunião Cancelada')
                        : lastBookedMeeting.status === 'rescheduled'
                        ? (isEn ? 'Meeting Successfully Rescheduled!' : 'Reunião Reagendada com Sucesso!')
                        : (isEn ? 'Meeting Successfully Scheduled!' : 'Reunião Agendada com Sucesso!')}
                    </h4>
                    <p className="text-xs text-[#555555] max-w-md mx-auto">
                      {lastBookedMeeting.status === 'cancelled'
                        ? (isEn
                            ? 'Your appointment has been cancelled. An official cancellation notice was sent to your email.'
                            : 'O cancelamento foi processado com sucesso. Uma notificação oficial foi enviada para o seu e-mail.')
                        : (isEn
                            ? 'Your face-to-face video session is confirmed. You can sync it to your Google Calendar or manage your schedule below.'
                            : 'Seu encontro virtual face a face está confirmado. As informações foram salvas e você pode sincronizar com seu Google Calendar ou reagendar/cancelar abaixo.')}
                    </p>
                  </div>

                  {/* Feedback Action Notice Banner */}
                  {actionNotice && (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="font-medium">{actionNotice}</span>
                    </div>
                  )}

                  {/* Summary Box */}
                  <div className="p-5 rounded-2xl bg-[#F9F9F8] border border-[#E5E5E2] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-[#EAEAE7]">
                        <span className="text-[10px] uppercase font-bold text-[#888888] block">
                          {isEn ? "Date & Time" : "Data & Horário"}
                        </span>
                        <span className={`text-sm font-bold mt-0.5 block ${lastBookedMeeting.status === 'cancelled' ? 'line-through text-neutral-400' : 'text-[#1A1A1A]'}`}>
                          {lastBookedMeeting.date.split('-').reverse().join('/')} {isEn ? "at" : "às"} {lastBookedMeeting.time}
                        </span>
                        <span className="text-[11px] text-[#666666]">
                          {isEn ? `Duration: ${lastBookedMeeting.durationMinutes} minutes (BRT)` : `Duração: ${lastBookedMeeting.durationMinutes} minutos (Horário de Brasília)`}
                        </span>
                        {lastBookedMeeting.status === 'rescheduled' && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {isEn ? "Rescheduled" : "Horário Reagendado"}
                          </span>
                        )}
                        {lastBookedMeeting.status === 'cancelled' && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            {isEn ? "Cancelled" : "Cancelado"}
                          </span>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#EAEAE7]">
                        <span className="text-[10px] uppercase font-bold text-[#888888] block">
                          {isEn ? "Participant" : "Participante"}
                        </span>
                        <span className="text-sm font-bold text-[#1A1A1A] mt-0.5 block truncate">
                          {lastBookedMeeting.clientName}
                        </span>
                        <span className="text-[11px] text-[#666666] truncate block">{lastBookedMeeting.clientEmail}</span>
                        <span className="text-[11px] text-[#888888] block">{lastBookedMeeting.clientPhone}</span>
                      </div>
                    </div>

                    {/* Google Meet Fixed Room Banner (if active) */}
                    {lastBookedMeeting.status !== 'cancelled' && (
                      <div className="p-4 rounded-xl bg-[#1E3A47]/8 border border-[#1E3A47]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-[#1E3A47]" />
                            <span className="text-xs font-bold text-[#1E3A47]">
                              {isEn ? "Google Meet Room" : "Sala Google Meet"}
                            </span>
                          </div>
                          <p className="text-xs text-[#444444] font-mono select-all">
                            {lastBookedMeeting.meetLink}
                          </p>
                        </div>

                        <a
                          href={lastBookedMeeting.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E3A47] hover:bg-[#162B34] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isEn ? "Join Room" : "Acessar Sala"}</span>
                        </a>
                      </div>
                    )}

                    {/* Single Clean Confirmation Note (Strictly 1 note as requested) */}
                    <div className="p-3.5 rounded-xl bg-[#F4F8F5] border border-[#D8E6DB] text-xs text-[#234B2E] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-[#2E7D32] shrink-0" />
                        <span className="font-medium">
                          {isEn
                            ? `Um e-mail de confirmação foi disparado para ${lastBookedMeeting.clientEmail}.`
                            : `Um e-mail de confirmação foi disparado para ${lastBookedMeeting.clientEmail}.`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendToClientEmail}
                        className="text-[11px] font-bold text-[#1E3A47] hover:underline cursor-pointer shrink-0"
                        title={isEn ? "Resend confirmation email" : "Reenviar e-mail"}
                      >
                        {isEn ? "Resend" : "Reenviar"}
                      </button>
                    </div>

                    {/* Single Discrete Google Calendar Button */}
                    {lastBookedMeeting.status !== 'cancelled' && (
                      <div className="pt-1">
                        <a
                          id="btn-sync-google-calendar"
                          href={generateGoogleCalendarUrl(lastBookedMeeting)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all text-center cursor-pointer"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>{isEn ? "Add to Google Calendar" : "Adicionar ao Google Calendar"}</span>
                        </a>
                      </div>
                    )}

                    {/* Contact Bee-ginning on WhatsApp (Message directed to Bee-ginning, NOT client himself) */}
                    {lastBookedMeeting.status !== 'cancelled' && (
                      <div className="pt-0.5">
                        <a
                          id="btn-contact-bee-whatsapp"
                          href={getWhatsAppUrlClientToRegina(lastBookedMeeting, isEn)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#136C35] text-xs font-bold transition-all text-center cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{isEn ? "Questions? Talk to Bee-ginning on WhatsApp" : "Dúvidas? Fale com a Bee-ginning no WhatsApp"}</span>
                        </a>
                      </div>
                    )}

                    {/* AUTONOMOUS RESCHEDULE & CANCEL SECTION */}
                    <div className="pt-3 border-t border-[#EAEAE7]">
                      {lastBookedMeeting.status === 'cancelled' ? (
                        <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200 text-center space-y-2.5">
                          <p className="text-xs text-neutral-600">
                            {isEn
                              ? "Need a meeting at another date? You can pick a new time slot anytime."
                              : "Precisa de uma reunião em outra ocasião? Você pode escolher um novo horário a qualquer momento."}
                          </p>
                          <button
                            type="button"
                            onClick={handleScheduleNewMeeting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E5A93B] hover:bg-[#D99B26] text-xs font-bold text-[#1A1A1A] cursor-pointer shadow-2xs"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{isEn ? "Schedule New Meeting" : "Agendar Novo Horário"}</span>
                          </button>
                        </div>
                      ) : isRescheduling ? (
                        /* Inline Rescheduling Selector */
                        <div className="p-4 rounded-xl bg-[#FFFDF9] border-2 border-amber-300 space-y-4 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-900">
                              <RefreshCw className="w-4 h-4 text-amber-600 animate-spin-slow" />
                              <h5 className="text-xs sm:text-sm font-bold">
                                {isEn ? "Reschedule Meeting (Autonomous)" : "Reagendar Reunião"}
                              </h5>
                            </div>
                            <span className="text-[11px] text-neutral-500">
                              {isEn ? "Current:" : "Atual:"} {lastBookedMeeting.date.split('-').reverse().join('/')} às {lastBookedMeeting.time}
                            </span>
                          </div>

                          {/* New Date Selector */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                              {isEn ? "1. Select new date:" : "1. Escolha a nova data:"}
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {availableDays.slice(0, 6).map((day) => {
                                const isSelected = rescheduleDate === day.dateString;
                                const isBlocked = day.isFullyBlocked;
                                return (
                                  <button
                                    key={day.dateString}
                                    type="button"
                                    disabled={isBlocked}
                                    onClick={() => {
                                      if (!isBlocked) {
                                        setRescheduleDate(day.dateString);
                                        setRescheduleError('');
                                      }
                                    }}
                                    className={`p-2 rounded-lg text-center border transition-all ${
                                      isBlocked
                                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 opacity-60 cursor-not-allowed'
                                        : isSelected
                                        ? 'bg-[#1E3A47] text-white border-[#1E3A47] shadow-xs cursor-pointer'
                                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400 cursor-pointer'
                                    }`}
                                    title={isBlocked ? (isEn ? "Date blocked by admin" : "Data bloqueada pelo administrador") : undefined}
                                  >
                                    <span className="block text-[9px] uppercase font-bold opacity-80">{day.dayOfWeek}</span>
                                    <span className="block text-sm font-extrabold">{day.dayNumber}</span>
                                    <span className="block text-[9px] opacity-75">{day.monthName}</span>
                                    {isBlocked && (
                                      <span className="block text-[8px] font-bold text-rose-500 uppercase mt-0.5">
                                        {isEn ? "Blocked" : "Bloqueado"}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* New Time Selector */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                                {isEn ? "2. Select new time (Brasília Time / UTC-3):" : "2. Escolha o novo horário de início:"}
                              </label>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> {isEn ? "Free" : "Livre"}</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block"></span> {isEn ? "Unavailable" : "Indisponível"}</span>
                              </div>
                            </div>

                            {(() => {
                              const reschSlots = rescheduleDate
                                ? getAvailableSlotsForDate(rescheduleDate, lastBookedMeeting.id)
                                : { allSlots: dailySlots, freeSlots: [], occupiedSlots: [], blockedSlots: [] };
                              const slotsToRender = reschSlots.allSlots && reschSlots.allSlots.length > 0 ? reschSlots.allSlots : dailySlots;

                              if (reschSlots.freeSlots.length === 0) {
                                return (
                                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center">
                                    {isEn
                                      ? "No slots available on this date. Please choose another date."
                                      : "Não há horários disponíveis nesta data. Por favor, selecione outra data acima."}
                                  </div>
                                );
                              }

                              return (
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                                  {slotsToRender.map((time) => {
                                    const isBooked = reschSlots.occupiedSlots.includes(time);
                                    const isBlocked = reschSlots.blockedSlots.includes(time);
                                    const isUnavailable = isBooked || isBlocked;
                                    const isSelected = rescheduleTime === time && !isUnavailable;

                                    return (
                                      <button
                                        key={time}
                                        type="button"
                                        disabled={isUnavailable}
                                        onClick={() => {
                                          if (!isUnavailable) {
                                            setRescheduleTime(time);
                                            setRescheduleError('');
                                          }
                                        }}
                                        className={`py-1.5 px-1 rounded-lg text-xs font-bold text-center border transition-all ${
                                          isUnavailable
                                            ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-50 line-through'
                                            : isSelected
                                            ? 'bg-[#E5A93B] text-[#1A1A1A] border-[#D99B26] shadow-xs cursor-pointer'
                                            : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#D99B26]/50 cursor-pointer'
                                        }`}
                                        title={
                                          isBooked
                                            ? (isEn ? "Slot booked by another client" : "Horário já reservado por outro cliente")
                                            : isBlocked
                                            ? (isEn ? "Slot blocked by admin" : "Horário bloqueado pelo administrador")
                                            : undefined
                                        }
                                      >
                                        <span>{time}</span>
                                        {isUnavailable && (
                                          <span className="block text-[8px] no-underline font-normal text-neutral-500">
                                            {isBooked ? (isEn ? "Booked" : "Ocupado") : (isEn ? "Blocked" : "Bloqueado")}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>

                          {rescheduleError && (
                            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{rescheduleError}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsRescheduling(false);
                                setRescheduleError('');
                              }}
                              className="px-3.5 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                            >
                              {isEn ? "Keep current time" : "Manter horário atual"}
                            </button>

                            <button
                              type="button"
                              onClick={handleConfirmReschedule}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E5A93B] hover:bg-[#D99B26] text-xs font-bold text-[#1A1A1A] cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isEn ? "Confirm Reschedule" : "Confirmar Novo Horário"}</span>
                            </button>
                          </div>
                        </div>
                      ) : isCancelling ? (
                        /* Inline Cancellation Confirmation Prompt */
                        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 space-y-3 animate-fadeIn">
                          <div className="flex items-start gap-2.5 text-rose-900">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="text-xs leading-relaxed">
                              <p className="font-bold">
                                {isEn ? "Confirm meeting cancellation?" : "Confirmar cancelamento da reunião?"}
                              </p>
                              <p className="mt-0.5 text-rose-800">
                                {isEn
                                  ? `Are you sure you want to cancel the meeting on ${lastBookedMeeting.date.split('-').reverse().join('/')} at ${lastBookedMeeting.time}? An official notification will be dispatched from ${OFFICIAL_EMAIL} to ${lastBookedMeeting.clientEmail}.`
                                  : `Tem certeza que deseja cancelar o agendamento de ${lastBookedMeeting.date.split('-').reverse().join('/')} às ${lastBookedMeeting.time}? Uma notificação oficial será disparada de ${OFFICIAL_EMAIL} para ${lastBookedMeeting.clientEmail}.`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsCancelling(false)}
                              className="px-3.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                            >
                              {isEn ? "No, keep meeting" : "Não, manter reunião"}
                            </button>

                            <button
                              type="button"
                              onClick={handleConfirmCancel}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{isEn ? "Yes, cancel appointment" : "Sim, confirmar cancelamento"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal Buttons for Autonomous Reschedule and Cancel */
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                          <span className="text-[11px] text-neutral-500 font-medium">
                            {isEn ? "Need to make changes?" : "Precisa alterar algo?"}
                          </span>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              id="btn-reagendar-reuniao"
                              onClick={handleStartReschedule}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-400/80 bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
                              title={isEn ? "Reschedule this meeting" : "Reagendar para outro dia ou horário"}
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                              <span>{isEn ? "Reschedule Meeting" : "Reagendar Horário"}</span>
                            </button>

                            <button
                              type="button"
                              id="btn-cancelar-reuniao"
                              onClick={handleStartCancel}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                              title={isEn ? "Cancel this meeting" : "Cancelar este agendamento"}
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{isEn ? "Cancel Meeting" : "Cancelar Reunião"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-[#E5A93B] hover:bg-[#D99B26] text-xs font-bold text-[#1A1A1A] cursor-pointer"
                    >
                      {isEn ? "Done" : "Concluir"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Booking Form */
                <form onSubmit={handleConfirmMeeting} className="space-y-5 animate-fadeIn">
                  {/* Google Meet Room Alert */}
                  <div className="p-3.5 rounded-xl bg-[#1E3A47]/8 border border-[#1E3A47]/15 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-[#1E3A47]">
                      <Video className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>{isEn ? "Dedicated Google Meet Room:" : "Sala Fixa Google Meet:"}</strong> {(config.fixedMeetUrl || config.meetUrl).replace('https://', '')}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#8F6413] bg-[#E5A93B]/20 px-2 py-0.5 rounded">
                      {isEn ? "45 minutes" : "45 minutos"}
                    </span>
                  </div>

                  {/* Step 1: Select Date */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#333333]">
                        {isEn ? "1. Select available date:" : "1. Escolha a data disponível:"}
                      </label>
                      <span className="text-[11px] text-[#777777]">
                        {isEn ? "Live availability" : "Disponibilidade em tempo real"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {availableDays.slice(0, 6).map((day) => {
                        const isSelected = selectedDate === day.dateString;
                        const isBlocked = day.isFullyBlocked;
                        return (
                          <button
                            key={day.dateString}
                            type="button"
                            disabled={isBlocked}
                            onClick={() => {
                              if (!isBlocked) {
                                setSelectedDate(day.dateString);
                                setBookingError('');
                              }
                            }}
                            className={`p-2.5 rounded-xl text-center border transition-all ${
                              isBlocked
                                ? 'bg-neutral-100 text-neutral-400 border-neutral-200 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#1E3A47] text-white border-[#1E3A47] shadow-sm cursor-pointer'
                                : 'bg-[#FFFFFF] text-[#333333] border-[#D5D5D0] hover:border-[#1E3A47]/50 hover:bg-[#F9F9F8] cursor-pointer'
                            }`}
                            title={isBlocked ? (isEn ? "Date blocked by admin" : "Data bloqueada pelo administrador") : undefined}
                          >
                            <span className="block text-[10px] uppercase font-bold opacity-80">
                              {day.dayOfWeek}
                            </span>
                            <span className="block text-base font-extrabold mt-0.5">
                              {day.dayNumber}
                            </span>
                            <span className="block text-[10px] opacity-75">{day.monthName}</span>
                            {isBlocked && (
                              <span className="block text-[8px] font-bold text-rose-500 uppercase mt-0.5">
                                {isEn ? "Blocked" : "Bloqueado"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Select Time */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#333333]">
                        {isEn ? "2. Select start time (Brasília Time / UTC-3):" : "2. Escolha o horário de início (Horário de Brasília):"}
                      </label>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> {isEn ? "Free" : "Livre"}</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block"></span> {isEn ? "Unavailable" : "Indisponível"}</span>
                      </div>
                    </div>

                    {(() => {
                      const slotStatus = selectedDate
                        ? getAvailableSlotsForDate(selectedDate)
                        : { allSlots: dailySlots, freeSlots: [], occupiedSlots: [], blockedSlots: [] };
                      const slotsToRender = slotStatus.allSlots && slotStatus.allSlots.length > 0 ? slotStatus.allSlots : dailySlots;

                      if (slotStatus.freeSlots.length === 0) {
                        return (
                          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center space-y-1">
                            <p className="font-semibold">
                              {isEn
                                ? "No open slots on this date."
                                : "Nenhum horário livre nesta data."}
                            </p>
                            <p className="text-[11px] text-amber-700">
                              {isEn
                                ? "All slots for this day are either booked or blocked. Please select another date above."
                                : "Todos os horários desta data estão ocupados por outros clientes ou bloqueados pelo administrador. Por favor, selecione outro dia acima."}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {slotsToRender.map((time) => {
                            const isBooked = slotStatus.occupiedSlots.includes(time);
                            const isBlocked = slotStatus.blockedSlots.includes(time);
                            const isUnavailable = isBooked || isBlocked;
                            const isSelected = selectedTime === time && !isUnavailable;

                            return (
                              <button
                                key={time}
                                type="button"
                                disabled={isUnavailable}
                                onClick={() => {
                                  if (!isUnavailable) {
                                    setSelectedTime(time);
                                    setBookingError('');
                                  }
                                }}
                                className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${
                                  isUnavailable
                                    ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-50 line-through'
                                    : isSelected
                                    ? 'bg-[#E5A93B] text-[#1A1A1A] border-[#D99B26] shadow-sm cursor-pointer'
                                    : 'bg-[#FFFFFF] text-[#444444] border-[#D5D5D0] hover:border-[#D99B26]/50 hover:bg-[#FFFDF7] cursor-pointer'
                                }`}
                                title={
                                  isBooked
                                    ? (isEn ? "Slot booked by another client" : "Horário já reservado por outro cliente")
                                    : isBlocked
                                    ? (isEn ? "Slot blocked by admin" : "Horário bloqueado pelo administrador")
                                    : undefined
                                }
                              >
                                <span>{time}</span>
                                {isUnavailable && (
                                  <span className="block text-[8px] no-underline font-normal text-neutral-500">
                                    {isBooked ? (isEn ? "Booked" : "Ocupado") : (isEn ? "Blocked" : "Bloqueado")}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Step 3: Contact Details */}
                  <div className="space-y-3 pt-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#333333]">
                      {isEn ? "3. Your contact information for the meeting link:" : "3. Seus dados para o agendamento e envio do link:"}
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 absolute left-3 top-3 text-[#888888]" />
                          <input
                            type="text"
                            required
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder={isEn ? "Your full name *" : "Seu nome completo *"}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/20 text-xs text-[#1A1A1A] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#888888]" />
                          <input
                            type="email"
                            required
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder={isEn ? "Your email *" : "Seu e-mail *"}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/20 text-xs text-[#1A1A1A] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-[#888888]" />
                          <input
                            type="tel"
                            required
                            value={clientPhone}
                            onChange={(e) => setClientPhone(maskPhone(e.target.value))}
                            placeholder={isEn ? "WhatsApp / Phone (XX) XXXXX-XXXX *" : "WhatsApp / Telefone (XX) XXXXX-XXXX *"}
                            maxLength={15}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/20 text-xs text-[#1A1A1A] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={meetingTopic}
                        onChange={(e) => setMeetingTopic(e.target.value)}
                        placeholder={isEn ? "What business idea or challenge would you like to discuss? (optional)" : "Qual ideia ou desafio gostaria de discutir na reunião? (opcional)"}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5D5D0] focus:border-[#D99B26] focus:ring-2 focus:ring-[#D99B26]/20 text-xs text-[#1A1A1A] outline-none"
                      />
                    </div>
                  </div>

                  {/* Mandatory Term of Confidentiality Checkbox */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DDD5] space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        id="meeting-confidentiality-checkbox"
                        type="checkbox"
                        checked={meetingTermAccepted}
                        onChange={(e) => {
                          setMeetingTermAccepted(e.target.checked);
                          if (e.target.checked) setBookingError('');
                        }}
                        className="mt-0.5 w-4 h-4 rounded text-[#D99B26] focus:ring-[#D99B26] border-[#D5D5D0] cursor-pointer"
                      />
                      <div className="text-xs text-[#333333] leading-relaxed">
                        <span className="font-bold text-[#1A1A1A]">
                          {isEn ? "Confidentiality & Privacy Term: " : "Termo de Sigilo e LGPD: "}
                        </span>
                        <span>
                          {isEn
                            ? "Beeginning 4 you strictly commits to maintaining absolute confidentiality regarding all business ideas and personal details shared, guaranteeing complete intellectual property protection."
                            : "A Beeginning 4 you se compromete rigorosamente a manter o sigilo absoluto sobre todas as ideias de negócio, conceitos e informações compartilhadas neste primeiro contato e em reuniões subsequentes, garantindo total segurança e propriedade intelectual ao cliente. Além disso, asseguramos a proteção dos seus dados pessoais em total conformidade com a LGPD (Lei nº 13.709/2018), utilizando-os exclusivamente para viabilizar o nosso contato e agendamentos."}
                        </span>
                      </div>
                    </label>
                  </div>

                  {bookingError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('hub')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D5D5D0] text-xs font-semibold text-[#555555] hover:text-[#1A1A1A] transition-colors cursor-pointer text-center"
                    >
                      {isEn ? "Back to options" : "Voltar às opções"}
                    </button>

                    <button
                      id="btn-confirm-booking"
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E5A93B] hover:bg-[#D99B26] text-[#1A1A1A] text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{isEn ? "Confirm Meeting & Add to Calendar" : "Confirmar Reunião & Integrar com Google Calendar"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
