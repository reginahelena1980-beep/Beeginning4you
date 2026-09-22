import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Calendar,
  ClipboardList,
  Settings,
  Phone,
  Mail,
  Video,
  Search,
  CheckCircle,
  Clock,
  User,
  Save,
  Trash2,
  ExternalLink,
  ChevronRight,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import { MeetingAppointment, DemandForm, ContactConfig, MeetingDiagnosticData } from '../types';
import {
  getContactConfig,
  saveContactConfig,
  getAllDemandForms,
  saveDemandForm,
  deleteDemandForm,
  getAdminAppointments,
  saveAppointmentWithDiagnostic,
  STORAGE_CHANGE_EVENT
} from '../utils/adminStorage';
import { generateGoogleCalendarUrl } from '../utils/calendar';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'agenda' | 'demandas' | 'config'>('agenda');

  // Admin Data state
  const [config, setConfig] = useState<ContactConfig>(getContactConfig());
  const [appointments, setAppointments] = useState<MeetingAppointment[]>([]);
  const [demands, setDemands] = useState<DemandForm[]>([]);
  
  // Selected appointment for meeting notes / diagnostic
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingAppointment | null>(null);
  const [meetingNotes, setMeetingNotes] = useState<MeetingDiagnosticData>({
    businessType: '',
    currentChallenges: '',
    recommendedSolution: '',
    estimatedBudget: '',
    nextSteps: '',
    meetingSummary: ''
  });

  // Demand details viewer
  const [selectedDemand, setSelectedDemand] = useState<DemandForm | null>(null);
  const [demandFilter, setDemandFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Config form state
  const [configForm, setConfigForm] = useState<ContactConfig>(config);
  const [configSavedNotice, setConfigSavedNotice] = useState<string>('');
  const [notesSavedNotice, setNotesSavedNotice] = useState<string>('');

  // Load data when opening or when storage changes
  const loadData = () => {
    const curConfig = getContactConfig();
    setConfig(curConfig);
    setConfigForm(curConfig);
    setAppointments(getAdminAppointments());
    setDemands(getAllDemandForms());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener(STORAGE_CHANGE_EVENT, loadData);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, loadData);
  }, []);

  // Sync selected meeting notes form
  useEffect(() => {
    if (selectedMeeting) {
      setMeetingNotes(
        selectedMeeting.diagnosticNotes || {
          businessType: '',
          currentChallenges: selectedMeeting.topic || '',
          recommendedSolution: '',
          estimatedBudget: '',
          nextSteps: '',
          meetingSummary: ''
        }
      );
    }
  }, [selectedMeeting]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === config.adminPassword) {
      setIsAuthenticated(true);
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError('Senha incorreta. Tente novamente.');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveContactConfig(configForm);
    setConfig(configForm);
    setConfigSavedNotice('Configurações de contato atualizadas com sucesso!');
    setTimeout(() => setConfigSavedNotice(''), 3500);
  };

  const handleSaveMeetingNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    const updatedMeeting: MeetingAppointment = {
      ...selectedMeeting,
      diagnosticNotes: meetingNotes
    };

    saveAppointmentWithDiagnostic(updatedMeeting);
    setSelectedMeeting(updatedMeeting);
    setAppointments(getAdminAppointments());
    setDemands(getAllDemandForms());
    setNotesSavedNotice('Dados e diagnóstico da reunião salvos e vinculados com sucesso!');
    setTimeout(() => setNotesSavedNotice(''), 3500);
  };

  const handleUpdateMeetingStatus = (meetingId: string, status: 'confirmed' | 'rescheduled' | 'cancelled') => {
    const meeting = appointments.find((m) => m.id === meetingId);
    if (!meeting) return;
    const updated = {
      ...meeting,
      status,
      updatedAt: new Date().toISOString()
    };
    saveAppointmentWithDiagnostic(updated);
    if (selectedMeeting?.id === meetingId) {
      setSelectedMeeting(updated);
    }
    setAppointments(getAdminAppointments());
  };

  const handleUpdateDemandStatus = (demandId: string, status: DemandForm['status']) => {
    const target = demands.find((d) => d.id === demandId);
    if (!target) return;
    const updated = { ...target, status };
    saveDemandForm(updated);
    setDemands(getAllDemandForms());
    if (selectedDemand?.id === demandId) {
      setSelectedDemand(updated);
    }
  };

  const handleDeleteDemand = (demandId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de demanda?')) return;
    deleteDemandForm(demandId);
    setDemands(getAllDemandForms());
    if (selectedDemand?.id === demandId) {
      setSelectedDemand(null);
    }
  };

  const filteredDemands = demands.filter((item) => {
    const matchesFilter = demandFilter === 'all' || item.status === demandFilter;
    const emailStr = (item.email || item.contactValue || '').toLowerCase();
    const phoneStr = item.phone || item.contactValue || '';
    const notesStr = (item.notes || item.biggestNeed || item.adminNotes || '').toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emailStr.includes(searchTerm.toLowerCase()) ||
      phoneStr.includes(searchTerm) ||
      notesStr.includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div
      id="admin-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="admin-modal-container"
        className="w-full max-w-5xl bg-[#FFFFFF] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E0DED7] overflow-hidden flex flex-col max-h-[92vh] text-[#1A1A1A] animate-scaleUp"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAEAE7] bg-[#1E3A47] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E5A93B] text-[#1A1A1A] flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Painel de Controle • ADM</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/80">
                  Beeginning 4 you
                </span>
              </div>
              <p className="text-xs text-white/70">
                {isAuthenticated
                  ? 'Gestão de agenda, diagnósticos e personalização de contatos'
                  : 'Acesso restrito ao administrador'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Fechar painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          /* Password Authentication Gate */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-[#1E3A47]/10 text-[#1E3A47] flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <div className="max-w-sm space-y-2">
              <h4 className="text-lg font-bold text-[#1A1A1A]">Identificação do Administrador</h4>
              <p className="text-xs text-[#666666]">
                Digite a senha de acesso para visualizar reuniões, dados de clientes e editar os canais de atendimento.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Senha de acesso"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#D5D5D0] focus:border-[#1E3A47] focus:ring-2 focus:ring-[#1E3A47]/20 text-sm outline-none text-center tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#888888] hover:text-[#1A1A1A]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {loginError && (
                <p className="text-xs text-red-600 font-medium">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#E5A93B] hover:bg-[#D99B26] text-[#1A1A1A] font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Acessar Painel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="px-6 border-b border-[#EAEAE7] bg-[#FBFBFA] flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('agenda');
                  setSelectedDemand(null);
                }}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'agenda'
                    ? 'border-[#1E3A47] text-[#1E3A47]'
                    : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Minha Agenda & Reuniões ({appointments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('demandas');
                  setSelectedMeeting(null);
                }}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'demandas'
                    ? 'border-[#1E3A47] text-[#1E3A47]'
                    : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Banco de Demandas & Formulários ({demands.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('config');
                  setSelectedMeeting(null);
                  setSelectedDemand(null);
                }}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'config'
                    ? 'border-[#1E3A47] text-[#1E3A47]'
                    : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Canais & Configurações</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#F9F9F8]">
              {/* TAB 1: AGENDA & REUNIÕES (WITH INTEGRATED CLIENT DIAGNOSTIC FORM) */}
              {activeTab === 'agenda' && (
                <div className="space-y-6">
                  {notesSavedNotice && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{notesSavedNotice}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Meetings List */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="flex items-center justify-between pb-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#555555]">
                          Reuniões Agendadas
                        </h4>
                        <span className="text-xs font-semibold text-[#888888]">
                          Total: {appointments.length}
                        </span>
                      </div>

                      {appointments.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-[#EAEAE7] text-xs text-[#777777]">
                          Nenhuma reunião agendada ainda. Quando um cliente agendar pelo site, ela aparecerá aqui instantaneamente.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {appointments.map((meeting) => {
                            const isSelected = selectedMeeting?.id === meeting.id;
                            const isCancelled = meeting.status === 'cancelled';
                            return (
                              <div
                                key={meeting.id}
                                onClick={() => setSelectedMeeting(meeting)}
                                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-white border-[#1E3A47] shadow-md ring-1 ring-[#1E3A47]'
                                    : 'bg-white border-[#E5E5E2] hover:border-[#1E3A47]/40 shadow-xs'
                                } ${isCancelled ? 'opacity-60 bg-[#FAFAFA]' : ''}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      meeting.status === 'confirmed'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : meeting.status === 'cancelled'
                                        ? 'bg-gray-100 text-gray-700'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {meeting.status === 'confirmed'
                                      ? 'Confirmada'
                                      : meeting.status === 'cancelled'
                                      ? 'Cancelada'
                                      : 'Reagendada'}
                                  </span>

                                  <span className="text-xs font-bold text-[#1E3A47]">
                                    {meeting.date.split('-').reverse().join('/')} às {meeting.time}
                                  </span>
                                </div>

                                <div className="space-y-0.5">
                                  <h5 className="text-sm font-bold text-[#1A1A1A] truncate">
                                    {meeting.clientName}
                                  </h5>
                                  <div className="text-xs text-[#666666] flex items-center gap-1.5 truncate">
                                    <Phone className="w-3 h-3 text-[#888888] shrink-0" />
                                    <span>{meeting.clientPhone}</span>
                                  </div>
                                  <div className="text-xs text-[#666666] flex items-center gap-1.5 truncate">
                                    <Mail className="w-3 h-3 text-[#888888] shrink-0" />
                                    <span className="truncate">{meeting.clientEmail}</span>
                                  </div>
                                </div>

                                {meeting.topic && (
                                  <p className="mt-2 text-[11px] text-[#555555] bg-[#F5F5F3] p-1.5 rounded line-clamp-1 italic">
                                    &ldquo;{meeting.topic}&rdquo;
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Selected Meeting & Integrated Diagnostic Form */}
                    <div className="lg:col-span-7">
                      {selectedMeeting ? (
                        <div className="bg-white rounded-2xl border border-[#E5E5E2] p-5 sm:p-6 space-y-6 shadow-xs">
                          {/* Meeting Details Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAE7]">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-[#1A1A1A]">
                                  {selectedMeeting.clientName}
                                </h4>
                                <span className="text-xs text-[#888888]">
                                  ({selectedMeeting.date.split('-').reverse().join('/')} às {selectedMeeting.time})
                                </span>
                              </div>
                              <p className="text-xs text-[#666666] mt-0.5">
                                E-mail: <strong className="text-[#1A1A1A]">{selectedMeeting.clientEmail}</strong> • WhatsApp:{' '}
                                <strong className="text-[#1A1A1A]">{selectedMeeting.clientPhone}</strong>
                              </p>
                            </div>

                            {/* Status toggles */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateMeetingStatus(selectedMeeting.id, 'confirmed')}
                                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                                  selectedMeeting.status === 'confirmed'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                }`}
                              >
                                Confirmada
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateMeetingStatus(selectedMeeting.id, 'cancelled')}
                                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                                  selectedMeeting.status === 'cancelled'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-red-50 text-red-800 hover:bg-red-100'
                                }`}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>

                          {/* Quick Actions (Meet, WhatsApp, Google Cal) */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <a
                              href={selectedMeeting.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#1E3A47]/10 hover:bg-[#1E3A47]/20 text-[#1E3A47] font-semibold"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Abrir Sala Meet</span>
                            </a>

                            <a
                              href={`https://wa.me/${selectedMeeting.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Olá ${selectedMeeting.clientName}! Tudo bem? Sou da Beeginning 4 you sobre a nossa reunião agendada para ${selectedMeeting.date.split('-').reverse().join('/')} às ${selectedMeeting.time}. Link da sala: ${selectedMeeting.meetLink}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#136C35] font-semibold"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Falar no WhatsApp</span>
                            </a>

                            <a
                              href={generateGoogleCalendarUrl(selectedMeeting)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#4285F4]/10 hover:bg-[#4285F4]/20 text-[#1967D2] font-semibold"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Google Calendar</span>
                            </a>
                          </div>

                          {/* Integrated Diagnostic & Meeting Form */}
                          <form onSubmit={handleSaveMeetingNotes} className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 pb-1 border-b border-[#F0EFEB]">
                              <FileText className="w-4 h-4 text-[#E5A93B]" />
                              <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                                Formulário Integrado da Reunião (Diagnóstico & Demanda)
                              </h5>
                            </div>

                            <p className="text-xs text-[#666666]">
                              Este formulário é de acesso exclusivo seu (administrador), automaticamente vinculado com os dados cadastrados pelo cliente.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-[11px] font-bold text-[#444444] mb-1">
                                  Ramo / Tipo de Negócio do Cliente:
                                </label>
                                <input
                                  type="text"
                                  value={meetingNotes.businessType || ''}
                                  onChange={(e) =>
                                    setMeetingNotes({ ...meetingNotes, businessType: e.target.value })
                                  }
                                  placeholder="Ex: Consultoria, E-commerce, Escola, Saúde..."
                                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-[#444444] mb-1">
                                  Faixa de Investimento / Orçamento:
                                </label>
                                <input
                                  type="text"
                                  value={meetingNotes.estimatedBudget || ''}
                                  onChange={(e) =>
                                    setMeetingNotes({ ...meetingNotes, estimatedBudget: e.target.value })
                                  }
                                  placeholder="Ex: R$ 3.000 a R$ 6.000"
                                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none"
                                />
                              </div>
                            </div>

                            <div className="text-xs space-y-1">
                              <label className="block text-[11px] font-bold text-[#444444]">
                                Desafios e Dores Identificados na Reunião:
                              </label>
                              <textarea
                                rows={2}
                                value={meetingNotes.currentChallenges || ''}
                                onChange={(e) =>
                                  setMeetingNotes({ ...meetingNotes, currentChallenges: e.target.value })
                                }
                                placeholder="Gargalos operacionais, desorganização financeira, perda de clientes..."
                                className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs"
                              />
                            </div>

                            <div className="text-xs space-y-1">
                              <label className="block text-[11px] font-bold text-[#444444]">
                                Solução Beeginning Recomendada:
                              </label>
                              <textarea
                                rows={2}
                                value={meetingNotes.recommendedSolution || ''}
                                onChange={(e) =>
                                  setMeetingNotes({ ...meetingNotes, recommendedSolution: e.target.value })
                                }
                                placeholder="Ex: Sistema web de gestão simplificada com agendamento e automação de WhatsApp..."
                                className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs"
                              />
                            </div>

                            <div className="text-xs space-y-1">
                              <label className="block text-[11px] font-bold text-[#444444]">
                                Próximos Passos & Prazos Combinados:
                              </label>
                              <input
                                type="text"
                                value={meetingNotes.nextSteps || ''}
                                onChange={(e) =>
                                  setMeetingNotes({ ...meetingNotes, nextSteps: e.target.value })
                                }
                                placeholder="Ex: Enviar proposta comercial até sexta-feira via WhatsApp..."
                                className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs"
                              />
                            </div>

                            <div className="pt-2 flex justify-end">
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1E3A47] hover:bg-[#162B34] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                              >
                                <Save className="w-4 h-4" />
                                <span>Salvar Diagnóstico da Reunião</span>
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E5E2] space-y-3">
                          <User className="w-10 h-10 text-[#CCCCCC] mx-auto" />
                          <h5 className="text-sm font-bold text-[#1A1A1A]">Selecione uma Reunião</h5>
                          <p className="text-xs text-[#777777] max-w-sm mx-auto">
                            Clique em uma reunião na lista à esquerda para abrir o formulário integrado de anotações, diagnóstico e dados do cliente.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BANCO DE DEMANDAS & FORMULÁRIOS RECEBIDOS */}
              {activeTab === 'demandas' && (
                <div className="space-y-4">
                  {/* Filters Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E5E5E2]">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#888888]" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, e-mail, telefone..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#D5D5D0] text-xs outline-none focus:border-[#1E3A47]"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
                      <span className="text-[#888888] font-bold text-[11px] shrink-0">Filtrar:</span>
                      {(['all', 'new', 'in_progress', 'completed'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setDemandFilter(status)}
                          className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 cursor-pointer ${
                            demandFilter === status
                              ? 'bg-[#1E3A47] text-white'
                              : 'bg-[#F2F2EF] text-[#555555] hover:bg-[#EAEAE7]'
                          }`}
                        >
                          {status === 'all'
                            ? 'Todas'
                            : status === 'new'
                            ? 'Novas'
                            : status === 'in_progress'
                            ? 'Em Análise'
                            : 'Concluídas'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Demands List */}
                  {filteredDemands.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E5E2] space-y-2">
                      <ClipboardList className="w-10 h-10 text-[#CCCCCC] mx-auto" />
                      <p className="text-xs text-[#777777]">
                        Nenhuma demanda encontrada com os critérios informados.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {filteredDemands.map((demand) => (
                        <div
                          key={demand.id}
                          className="bg-white p-4 rounded-xl border border-[#E5E5E2] hover:border-[#1E3A47]/40 shadow-xs flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  demand.origin === 'diagnostic_pedir'
                                    ? 'bg-amber-100 text-amber-900'
                                    : demand.origin === 'meeting_booking'
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {demand.origin === 'diagnostic_pedir'
                                  ? 'Diagnóstico Rápido'
                                  : demand.origin === 'meeting_booking'
                                  ? 'Reunião Agendada'
                                  : 'Contato'}
                              </span>

                              <span className="text-[10px] text-[#888888]">
                                {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            <div>
                              <h5 className="text-sm font-bold text-[#1A1A1A]">{demand.name}</h5>
                              <p className="text-xs text-[#555555]">{demand.email}</p>
                              <p className="text-xs text-[#555555]">{demand.phone}</p>
                            </div>

                            {demand.businessDescription && (
                              <p className="text-xs text-[#444444] bg-[#F7F7F5] p-2 rounded line-clamp-3">
                                <strong className="text-[11px] block text-[#666666]">Desafio / Negócio:</strong>
                                {demand.businessDescription}
                              </p>
                            )}

                            {demand.mainGoal && (
                              <p className="text-xs text-[#1E3A47] font-medium">
                                Objetivo: {demand.mainGoal}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-[#EAEAE7] flex items-center justify-between">
                            <select
                              value={demand.status}
                              onChange={(e) =>
                                handleUpdateDemandStatus(demand.id, e.target.value as DemandForm['status'])
                              }
                              className="text-[11px] px-2 py-1 rounded bg-[#F4F4F2] border border-[#D5D5D0] font-semibold text-[#333333] outline-none"
                            >
                              <option value="new">Novo</option>
                              <option value="in_progress">Em Atendimento</option>
                              <option value="completed">Concluído</option>
                              <option value="archived">Arquivado</option>
                            </select>

                            <div className="flex items-center gap-1.5">
                              <a
                                href={`https://wa.me/${(demand.phone || demand.contactValue || '').replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-[#136C35] hover:bg-[#25D366]/10 rounded"
                                title="Conversar no WhatsApp"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteDemand(demand.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CONFIGURAÇÃO DE CONTATO & CANAIS */}
              {activeTab === 'config' && (
                <div className="max-w-2xl bg-white p-6 rounded-2xl border border-[#E5E5E2] space-y-6 shadow-xs">
                  <div>
                    <h4 className="text-base font-bold text-[#1A1A1A]">
                      Personalização dos Canais de Atendimento
                    </h4>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Edite livremente o número do WhatsApp, link da sala do Google Meet e e-mail. As alterações afetam imediatamente todos os botões do site.
                    </p>
                  </div>

                  {configSavedNotice && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{configSavedNotice}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-[#333333] mb-1">
                        Número do WhatsApp (com DDI e DDD, apenas dígitos):
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[#888888]" />
                        <input
                          type="text"
                          required
                          value={configForm.whatsappNumber}
                          onChange={(e) =>
                            setConfigForm({ ...configForm, whatsappNumber: e.target.value.replace(/\D/g, '') })
                          }
                          placeholder="Ex: 5511999999999"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-[#888888] mt-1">
                        Este é o número que recebe as mensagens do botão <strong>Vamos conversar?</strong> e formulários.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-[#333333] mb-1">
                        Link Fixo da Sala Google Meet:
                      </label>
                      <div className="relative">
                        <Video className="w-4 h-4 absolute left-3 top-2.5 text-[#888888]" />
                        <input
                          type="url"
                          required
                          value={configForm.meetUrl}
                          onChange={(e) => setConfigForm({ ...configForm, meetUrl: e.target.value })}
                          placeholder="https://meet.google.com/..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-[#888888] mt-1">
                        Sala de videoconferência inserida automaticamente nos convites do Google Calendar.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-[#333333] mb-1">
                        E-mail Oficial de Atendimento:
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#888888]" />
                        <input
                          type="email"
                          required
                          value={configForm.email}
                          onChange={(e) => setConfigForm({ ...configForm, email: e.target.value })}
                          placeholder="contato@beeginning4you.com.br"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EAEAE7]">
                      <label className="block font-bold text-[#333333] mb-1">
                        Nova Senha de Acesso ao ADM (opcional):
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#888888]" />
                        <input
                          type="text"
                          value={configForm.adminPassword}
                          onChange={(e) => setConfigForm({ ...configForm, adminPassword: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#E5A93B] hover:bg-[#D99B26] text-[#1A1A1A] text-xs font-bold transition-colors cursor-pointer shadow-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar Todas as Configurações</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
