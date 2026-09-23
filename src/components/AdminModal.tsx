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
  Filter,
  Plus,
  Send,
  Sparkles,
  CheckCircle2,
  Upload,
  Camera,
  RotateCcw,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import reginaDefaultPhoto from '../assets/images/regina_portrait_1790082408093.jpg';
import { MeetingAppointment, DemandForm, ContactConfig, MeetingDiagnosticData } from '../types';
import { uploadProfilePhotoToStorage } from '../firebase';
import { compressImageFile, normalizeImageUrl } from '../utils/imageUtils';
import {
  getContactConfig,
  saveContactConfig,
  getAllDemandForms,
  saveDemandForm,
  deleteDemandForm,
  getAdminAppointments,
  saveAppointmentWithDiagnostic,
  deleteAppointmentInStorage,
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
  const [showConfigPassword, setShowConfigPassword] = useState<boolean>(false);

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
    meetingSummary: '',
    opportunityStatus: 'novo'
  });

  // Demand details viewer
  const [selectedDemand, setSelectedDemand] = useState<DemandForm | null>(null);
  const [demandFilter, setDemandFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreatingDemand, setIsCreatingDemand] = useState<boolean>(false);
  const [newDemandForm, setNewDemandForm] = useState({
    name: '',
    phone: '',
    email: '',
    businessName: '',
    segment: '',
    biggestNeed: '',
    estimatedBudget: '',
    status: 'Novo'
  });

  // Config form state
  const [configForm, setConfigForm] = useState<ContactConfig>(config);
  const [configSavedNotice, setConfigSavedNotice] = useState<string>('');
  const [notesSavedNotice, setNotesSavedNotice] = useState<string>('');

  // Photo management state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [photoStatusNotice, setPhotoStatusNotice] = useState<string>('');
  const [photoErrorNotice, setPhotoErrorNotice] = useState<string>('');
  const [previewImageError, setPreviewImageError] = useState<boolean>(false);
  const [urlInputValue, setUrlInputValue] = useState<string>('');

  // Load data when opening or when storage changes
  const loadData = () => {
    const curConfig = getContactConfig();
    setConfig(curConfig);
    setConfigForm(curConfig);
    const curAppointments = getAdminAppointments();
    setAppointments(curAppointments);
    setDemands(getAllDemandForms());

    // Auto-select first appointment if none is selected
    setSelectedMeeting((prev) => {
      if (prev) {
        const found = curAppointments.find((a) => a.id === prev.id);
        if (found) return found;
      }
      return curAppointments.length > 0 ? curAppointments[0] : null;
    });

    setUrlInputValue(curConfig.profilePhotoUrl || '');
    setPreviewImageError(false);
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
      setMeetingNotes({
        businessType: selectedMeeting.diagnosticNotes?.businessType || '',
        currentChallenges:
          selectedMeeting.diagnosticNotes?.currentChallenges ||
          selectedMeeting.diagnosticNotes?.problemDescription ||
          selectedMeeting.topic ||
          '',
        recommendedSolution: selectedMeeting.diagnosticNotes?.recommendedSolution || '',
        estimatedBudget: selectedMeeting.diagnosticNotes?.estimatedBudget || '',
        nextSteps: selectedMeeting.diagnosticNotes?.nextSteps || '',
        meetingSummary: selectedMeeting.diagnosticNotes?.meetingSummary || '',
        opportunityStatus: selectedMeeting.diagnosticNotes?.opportunityStatus || 'novo'
      });
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
      setLoginError('Senha incorreta. A senha padrão de fábrica é: bee2026');
    }
  };

  const handleResetToDefaultPassword = () => {
    const cur = getContactConfig();
    const resetConfig = { ...cur, adminPassword: 'bee2026' };
    saveContactConfig(resetConfig);
    setConfig(resetConfig);
    setConfigForm(resetConfig);
    setPasswordInput('bee2026');
    setLoginError('');
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveContactConfig(configForm);
    setConfig(configForm);
    setConfigSavedNotice('Configurações de contato atualizadas com sucesso!');
    setTimeout(() => setConfigSavedNotice(''), 3500);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setPhotoStatusNotice('');
    setPhotoErrorNotice('');
    setPreviewImageError(false);

    try {
      // 1. Instantly compress and optimize image to high-efficiency web JPEG (~40-70KB)
      const compressedDataUrl = await compressImageFile(file, 800, 0.85);

      // 2. Try Firebase Storage with fast timeout (3.5s). If available, use cloud URL; otherwise use compressed DataURL
      let finalPhotoUrl = compressedDataUrl;
      try {
        const cloudUrl = await uploadProfilePhotoToStorage(file);
        if (cloudUrl) {
          finalPhotoUrl = cloudUrl;
        }
      } catch {
        // Fallback to compressed DataURL seamlessly
      }

      // 3. Immediately persist to state, storage and dispatch to website
      const updatedConfig: ContactConfig = {
        ...configForm,
        profilePhotoUrl: finalPhotoUrl
      };

      setConfigForm(updatedConfig);
      setUrlInputValue(finalPhotoUrl.startsWith('data:') ? '' : finalPhotoUrl);
      saveContactConfig(updatedConfig);
      setConfig(updatedConfig);

      setPhotoStatusNotice('Foto da Regina carregada e salva com sucesso no site!');
      setTimeout(() => setPhotoStatusNotice(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar a foto.';
      setPhotoErrorNotice(msg);
      setTimeout(() => setPhotoErrorNotice(''), 6000);
    } finally {
      setIsUploadingPhoto(false);
      // Reset input value so user can re-select same file if needed
      e.target.value = '';
    }
  };

  const handleApplyPhotoUrl = (urlToApply?: string) => {
    const rawUrl = urlToApply !== undefined ? urlToApply : urlInputValue;
    setPhotoStatusNotice('');
    setPhotoErrorNotice('');
    setPreviewImageError(false);

    if (!rawUrl.trim()) {
      handleRestoreDefaultPhoto();
      return;
    }

    const normalized = normalizeImageUrl(rawUrl.trim());
    const updatedConfig: ContactConfig = {
      ...configForm,
      profilePhotoUrl: normalized
    };

    setConfigForm(updatedConfig);
    setUrlInputValue(normalized);
    saveContactConfig(updatedConfig);
    setConfig(updatedConfig);

    setPhotoStatusNotice('Link da foto aplicado e salvo com sucesso no site!');
    setTimeout(() => setPhotoStatusNotice(''), 4000);
  };

  const handleRestoreDefaultPhoto = () => {
    setPhotoStatusNotice('');
    setPhotoErrorNotice('');
    setPreviewImageError(false);

    const updatedConfig: ContactConfig = {
      ...configForm,
      profilePhotoUrl: ''
    };

    setConfigForm(updatedConfig);
    setUrlInputValue('');
    saveContactConfig(updatedConfig);
    setConfig(updatedConfig);

    setPhotoStatusNotice('Foto original da Regina restaurada com sucesso!');
    setTimeout(() => setPhotoStatusNotice(''), 4000);
  };

  const handleSaveMeetingNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    const updatedMeeting: MeetingAppointment = {
      ...selectedMeeting,
      diagnosticNotes: {
        ...meetingNotes,
        updatedAt: new Date().toISOString()
      }
    };

    saveAppointmentWithDiagnostic(updatedMeeting);
    setSelectedMeeting(updatedMeeting);
    setAppointments(getAdminAppointments());
    setDemands(getAllDemandForms());
    setNotesSavedNotice('Diagnóstico e proposta gravados com sucesso! Sincronizados com a agenda e o banco de demandas.');
    setTimeout(() => setNotesSavedNotice(''), 4500);
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

  const handleDeleteMeeting = (meetingId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta reunião e os registros associados?')) return;
    deleteAppointmentInStorage(meetingId);
    const remaining = getAdminAppointments();
    setAppointments(remaining);
    setDemands(getAllDemandForms());
    if (selectedMeeting?.id === meetingId) {
      setSelectedMeeting(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const generateProposalWhatsAppUrl = () => {
    if (!selectedMeeting) return '';
    const phone = selectedMeeting.clientPhone.replace(/\D/g, '');
    const greeting = `Olá, *${selectedMeeting.clientName}*! Tudo bem? Aqui é a Regina da *Beeginning 4 you*.`;
    const meetingRecap = `Foi um prazer conversar com você sobre o seu projeto!`;
    const challenges = meetingNotes.currentChallenges ? `\n\n📌 *Dores e Desafios Identificados:*\n${meetingNotes.currentChallenges}` : '';
    const solution = meetingNotes.recommendedSolution ? `\n\n💡 *Solução Beeginning Proposta:*\n${meetingNotes.recommendedSolution}` : '';
    const budget = meetingNotes.estimatedBudget ? `\n\n💰 *Estimativa de Investimento / Proposta:*\n${meetingNotes.estimatedBudget}` : '';
    const nextSteps = meetingNotes.nextSteps ? `\n\n🗓️ *Próximos Passos & Prazos Combinados:*\n${meetingNotes.nextSteps}` : '';
    const footer = `\n\nQualquer dúvida estou à disposição por aqui. Vamos construir juntos!`;

    const fullMessage = `${greeting}\n\n${meetingRecap}${challenges}${solution}${budget}${nextSteps}${footer}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`;
  };

  const handleCreateDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDemandForm.name.trim()) return;
    saveDemandForm({
      name: newDemandForm.name.trim(),
      phone: newDemandForm.phone.trim(),
      email: newDemandForm.email.trim(),
      contactValue: newDemandForm.phone.trim() || newDemandForm.email.trim(),
      businessName: newDemandForm.businessName.trim(),
      segment: newDemandForm.segment.trim(),
      biggestNeed: newDemandForm.biggestNeed.trim(),
      businessDescription: newDemandForm.biggestNeed.trim(),
      source: 'manual',
      origin: 'admin_manual',
      status: newDemandForm.status || 'Novo',
      adminNotes: newDemandForm.estimatedBudget
        ? `Orçamento previsto: ${newDemandForm.estimatedBudget}`
        : 'Demanda registrada manualmente pelo ADM'
    });
    setIsCreatingDemand(false);
    setNewDemandForm({
      name: '',
      phone: '',
      email: '',
      businessName: '',
      segment: '',
      biggestNeed: '',
      estimatedBudget: '',
      status: 'Novo'
    });
    setDemands(getAllDemandForms());
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
    const s = (item.status || '').toLowerCase();
    const orig = (item.origin || item.source || '').toLowerCase();

    let matchesFilter = true;
    if (demandFilter === 'new') {
      matchesFilter = s === 'novo' || s === 'new';
    } else if (demandFilter === 'meeting') {
      matchesFilter = orig.includes('meeting') || orig.includes('agenda') || s.includes('reunião');
    } else if (demandFilter === 'proposal') {
      matchesFilter =
        s.includes('proposta') ||
        s.includes('análise') ||
        s.includes('analise') ||
        s.includes('in_progress') ||
        s.includes('atendimento');
    } else if (demandFilter === 'completed') {
      matchesFilter = s.includes('conclu') || s.includes('fechad');
    }

    const emailStr = (item.email || item.contactValue || '').toLowerCase();
    const phoneStr = item.phone || item.contactValue || '';
    const notesStr = (
      item.notes ||
      item.biggestNeed ||
      item.adminNotes ||
      item.businessDescription ||
      ''
    ).toLowerCase();
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

              {loginError ? (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-center space-y-1">
                  <p className="text-xs text-red-600 font-semibold">{loginError}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-[11px] text-[#777777]">
                    Senha padrão inicial: <button
                      type="button"
                      onClick={() => {
                        setPasswordInput('bee2026');
                        setLoginError('');
                      }}
                      className="font-mono font-bold text-[#1E3A47] underline cursor-pointer hover:text-[#E5A93B]"
                    >
                      bee2026
                    </button>
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#E5A93B] hover:bg-[#D99B26] text-[#1A1A1A] font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Acessar Painel
              </button>

              <div className="pt-2 flex flex-col items-center gap-1.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordInput('bee2026');
                    setLoginError('');
                  }}
                  className="text-xs text-[#1E3A47] hover:underline font-medium cursor-pointer"
                >
                  Usar senha padrão (bee2026)
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaultPassword}
                  className="text-[11px] text-[#888888] hover:text-[#1A1A1A] underline cursor-pointer"
                >
                  Esqueci a senha / Restaurar para bee2026
                </button>
              </div>
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
                        <div className="p-8 text-center bg-white rounded-2xl border border-[#EAEAE7] text-xs text-[#777777] space-y-2">
                          <Calendar className="w-8 h-8 text-[#CCCCCC] mx-auto" />
                          <p className="font-semibold text-[#444444]">Nenhum agendamento encontrado</p>
                          <p className="text-[11px] text-[#888888]">
                            Nenhuma reunião agendada ainda. Quando um cliente agendar pelo site, ela aparecerá aqui instantaneamente.
                          </p>
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

                                <div className="mt-2.5 pt-2 border-t border-[#F0F0EE] flex items-center justify-between gap-2">
                                  <a
                                    href={meeting.meetLink || config.meetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E3A47]/10 hover:bg-[#1E3A47]/20 text-[#1E3A47] text-[11px] font-bold transition-colors"
                                    title="Entrar na sala do Google Meet configurada no ADM"
                                  >
                                    <Video className="w-3 h-3 text-[#1E3A47]" />
                                    <span>Entrar no Meet</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-[#1E3A47]/70" />
                                  </a>
                                  <span className="text-[10px] text-[#888888]">45 min</span>
                                </div>
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
                              href={selectedMeeting.meetLink || config.meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#1E3A47]/10 hover:bg-[#1E3A47]/20 text-[#1E3A47] font-semibold"
                              title="Abrir sala do Google Meet configurada no painel ADM"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Entrar na Sala Meet</span>
                              <ExternalLink className="w-3 h-3 text-[#1E3A47]/70" />
                            </a>

                            <a
                              href={`https://wa.me/${selectedMeeting.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Olá ${selectedMeeting.clientName}! Tudo bem? Sou da Beeginning 4 you sobre a nossa reunião agendada para ${selectedMeeting.date.split('-').reverse().join('/')} às ${selectedMeeting.time}. Link da sala: ${selectedMeeting.meetLink || config.meetUrl}`
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
                            <div className="flex items-center justify-between pb-1 border-b border-[#F0EFEB]">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#E5A93B]" />
                                <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                                  Formulário Integrado da Reunião (Diagnóstico & Proposta)
                                </h5>
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sincronizado com Demandas
                              </span>
                            </div>

                            <p className="text-xs text-[#666666]">
                              Anotações gravadas aqui ficam registradas de forma segura e alimentam automaticamente o controle de propostas e demandas.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div>
                                <label className="block text-[11px] font-bold text-[#444444] mb-1">
                                  Status da Proposta / Etapa:
                                </label>
                                <select
                                  value={meetingNotes.opportunityStatus || 'novo'}
                                  onChange={(e) =>
                                    setMeetingNotes({
                                      ...meetingNotes,
                                      opportunityStatus: e.target.value as any
                                    })
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] font-semibold text-xs outline-none bg-white"
                                >
                                  <option value="novo">1. Novo Contato / Agendado</option>
                                  <option value="reuniao_realizada">2. Reunião Realizada</option>
                                  <option value="proposta_elaboracao">3. Proposta em Elaboração</option>
                                  <option value="proposta_enviada">4. Proposta Enviada ao Cliente</option>
                                  <option value="fechado">5. Fechado / Aprovado 🎉</option>
                                  <option value="arquivado">6. Arquivado / Recusado</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-[#444444] mb-1">
                                  Investimento / Valor Proposto:
                                </label>
                                <input
                                  type="text"
                                  value={meetingNotes.estimatedBudget || ''}
                                  onChange={(e) =>
                                    setMeetingNotes({ ...meetingNotes, estimatedBudget: e.target.value })
                                  }
                                  placeholder="Ex: R$ 3.500 ou R$ 450/mês"
                                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-[#444444] mb-1">
                                  Segmento / Ramo de Atuação:
                                </label>
                                <input
                                  type="text"
                                  value={meetingNotes.businessType || ''}
                                  onChange={(e) =>
                                    setMeetingNotes({ ...meetingNotes, businessType: e.target.value })
                                  }
                                  placeholder="Ex: Consultoria, Saúde, Varejo..."
                                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs"
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
                                placeholder="Gargalos operacionais, retrabalho, perda de clientes, falta de processos digitais..."
                                className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs"
                              />
                            </div>

                            <div className="text-xs space-y-1">
                              <label className="block text-[11px] font-bold text-[#444444]">
                                Solução Beeginning Recomendada (Escopo da Proposta):
                              </label>
                              <textarea
                                rows={2}
                                value={meetingNotes.recommendedSolution || ''}
                                onChange={(e) =>
                                  setMeetingNotes({ ...meetingNotes, recommendedSolution: e.target.value })
                                }
                                placeholder="Ex: Plataforma web personalizada com agendamento automático, integração WhatsApp e CRM simples..."
                                className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-[#444444]">
                                  Próximos Passos & Prazos Combinados:
                                </label>
                                <input
                                  type="text"
                                  value={meetingNotes.nextSteps || ''}
                                  onChange={(e) =>
                                    setMeetingNotes({ ...meetingNotes, nextSteps: e.target.value })
                                  }
                                  placeholder="Ex: Enviar proposta comercial até sexta-feira..."
                                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-[#444444]">
                                  Anotações Internas Confidenciais:
                                </label>
                                <input
                                  type="text"
                                  value={meetingNotes.meetingSummary || ''}
                                  onChange={(e) =>
                                    setMeetingNotes({ ...meetingNotes, meetingSummary: e.target.value })
                                  }
                                  placeholder="Observações da equipe e lembretes de negociação..."
                                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs"
                                />
                              </div>
                            </div>

                            {/* Action Buttons Bar */}
                            <div className="pt-3 border-t border-[#F0EFEB] flex flex-wrap items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir Reunião</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.open(generateProposalWhatsAppUrl(), '_blank')}
                                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#136C35] text-xs font-bold transition-colors cursor-pointer"
                                  title="Abre o WhatsApp com mensagem formatada de proposta e resumo"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Enviar Resumo no WhatsApp</span>
                                </button>

                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1E3A47] hover:bg-[#162B34] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                                >
                                  <Save className="w-4 h-4 text-[#E5A93B]" />
                                  <span>Sincronizar com Demandas</span>
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E5E2] space-y-3">
                          <User className="w-10 h-10 text-[#CCCCCC] mx-auto" />
                          <h5 className="text-sm font-bold text-[#1A1A1A]">
                            {appointments.length === 0
                              ? 'Nenhum agendamento ativo'
                              : 'Selecione uma Reunião'}
                          </h5>
                          <p className="text-xs text-[#777777] max-w-sm mx-auto">
                            {appointments.length === 0
                              ? 'Quando um cliente agendar pelo site, a reunião aparecerá na lista ao lado para você gerenciar diagnósticos e propostas.'
                              : 'Clique em uma reunião na lista à esquerda para abrir o formulário integrado de anotações, diagnóstico e dados do cliente.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BANCO DE DEMANDAS & CONTROLE DE PROPOSTAS */}
              {activeTab === 'demandas' && (
                <div className="space-y-4">
                  {/* Filters Bar & Quick Action */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E5E5E2]">
                    <div className="relative w-full md:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#888888]" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, e-mail, telefone..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#D5D5D0] text-xs outline-none focus:border-[#1E3A47]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto text-xs py-1">
                      {[
                        { id: 'all', label: `Todas (${demands.length})` },
                        {
                          id: 'meeting',
                          label: `Reuniões (${
                            demands.filter(
                              (d) =>
                                (d.origin || d.source || '').toLowerCase().includes('meeting') ||
                                (d.origin || d.source || '').toLowerCase().includes('agenda') ||
                                (d.status || '').toLowerCase().includes('reunião')
                            ).length
                          })`
                        },
                        {
                          id: 'diagnostic',
                          label: `Diagnósticos (${
                            demands.filter((d) => (d.origin || d.source || '').toLowerCase().includes('diag')).length
                          })`
                        },
                        {
                          id: 'proposal',
                          label: `Propostas (${
                            demands.filter(
                              (d) =>
                                (d.status || '').toLowerCase().includes('proposta') ||
                                (d.status || '').toLowerCase().includes('análise') ||
                                (d.status || '').toLowerCase().includes('analise')
                            ).length
                          })`
                        },
                        {
                          id: 'completed',
                          label: `Concluídas (${
                            demands.filter(
                              (d) =>
                                (d.status || '').toLowerCase().includes('conclu') ||
                                (d.status || '').toLowerCase().includes('fechad')
                            ).length
                          })`
                        }
                      ].map((tabItem) => (
                        <button
                          key={tabItem.id}
                          type="button"
                          onClick={() => setDemandFilter(tabItem.id)}
                          className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 cursor-pointer text-xs ${
                            demandFilter === tabItem.id
                              ? 'bg-[#1E3A47] text-white'
                              : 'bg-[#F2F2EF] text-[#555555] hover:bg-[#EAEAE7]'
                          }`}
                        >
                          {tabItem.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCreatingDemand(true)}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E5A93B] hover:bg-[#C98E24] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Nova Demanda</span>
                    </button>
                  </div>

                  {/* Demands List */}
                  {filteredDemands.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E5E2] space-y-3">
                      <ClipboardList className="w-10 h-10 text-[#CCCCCC] mx-auto" />
                      <h5 className="text-sm font-bold text-[#1A1A1A]">Nenhum registro encontrado</h5>
                      <p className="text-xs text-[#777777] max-w-md mx-auto">
                        {demands.length === 0
                          ? 'Nenhuma demanda ou diagnóstico recebido ainda. Novos contatos de clientes aparecerão aqui em tempo real.'
                          : 'Nenhuma demanda encontrada com os critérios informados.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {filteredDemands.map((demand) => {
                        const isFromMeeting = demand.id.startsWith('demand-from-');
                        const meetingId = isFromMeeting ? demand.id.replace('demand-from-', '') : null;

                        return (
                          <div
                            key={demand.id}
                            className="bg-white p-4 rounded-xl border border-[#E5E5E2] hover:border-[#1E3A47]/40 shadow-xs flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    demand.origin === 'diagnostic_pedir'
                                      ? 'bg-amber-100 text-amber-900'
                                      : isFromMeeting || demand.origin === 'meeting_booking'
                                      ? 'bg-blue-100 text-blue-900'
                                      : 'bg-emerald-100 text-emerald-900'
                                  }`}
                                >
                                  {demand.origin === 'diagnostic_pedir'
                                    ? 'Diagnóstico Rápido'
                                    : isFromMeeting || demand.origin === 'meeting_booking'
                                    ? 'Reunião Agendada'
                                    : 'Contato Direto'}
                                </span>

                                <span className="text-[10px] text-[#888888]">
                                  {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>

                              <div>
                                <h5 className="text-sm font-bold text-[#1A1A1A]">{demand.name}</h5>
                                <p className="text-xs text-[#555555]">{demand.email || 'Sem e-mail'}</p>
                                <p className="text-xs text-[#555555]">{demand.phone || demand.contactValue}</p>
                              </div>

                              {demand.businessDescription && (
                                <p className="text-xs text-[#444444] bg-[#F7F7F5] p-2.5 rounded-lg line-clamp-3">
                                  <strong className="text-[11px] block text-[#666666]">Desafio / Necessidade:</strong>
                                  {demand.businessDescription}
                                </p>
                              )}

                              {demand.adminNotes && (
                                <p className="text-xs text-[#1E3A47] bg-[#1E3A47]/5 p-2 rounded-lg line-clamp-2">
                                  <strong className="text-[10px] block text-[#1E3A47] uppercase font-bold">
                                    Proposta / Anotações:
                                  </strong>
                                  {demand.adminNotes}
                                </p>
                              )}

                              {/* Link to Calendar Meeting if applicable */}
                              {isFromMeeting && meetingId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const meet = appointments.find((a) => a.id === meetingId);
                                    if (meet) {
                                      setSelectedMeeting(meet);
                                      setActiveTab('agenda');
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E3A47] hover:underline"
                                >
                                  <Calendar className="w-3 h-3 text-[#E5A93B]" />
                                  <span>Abrir Reunião na Agenda &rarr;</span>
                                </button>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[#EAEAE7] flex items-center justify-between gap-2">
                              <select
                                value={demand.status}
                                onChange={(e) =>
                                  handleUpdateDemandStatus(demand.id, e.target.value as DemandForm['status'])
                                }
                                className="text-[11px] px-2 py-1 rounded bg-[#F4F4F2] border border-[#D5D5D0] font-semibold text-[#333333] outline-none max-w-[130px] truncate"
                              >
                                <option value="Novo">Novo</option>
                                <option value="Reunião Agendada">Reunião Agendada</option>
                                <option value="Em Análise">Em Análise</option>
                                <option value="Proposta em Elaboração">Proposta em Elaboração</option>
                                <option value="Proposta Enviada">Proposta Enviada</option>
                                <option value="Concluído">Concluído 🎉</option>
                                <option value="Arquivado">Arquivado</option>
                              </select>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={`https://wa.me/${(demand.phone || demand.contactValue || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                    `Olá ${demand.name}! Aqui é a Regina da Beeginning 4 you sobre a sua solicitação.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-[#136C35] hover:bg-[#25D366]/15 rounded-lg"
                                  title="Conversar no WhatsApp"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDemand(demand.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Manual Demand Creation Modal */}
                  {isCreatingDemand && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between pb-2 border-b border-[#EAEAE7]">
                          <h4 className="text-sm font-bold text-[#1A1A1A]">Cadastrar Nova Demanda Manual</h4>
                          <button
                            type="button"
                            onClick={() => setIsCreatingDemand(false)}
                            className="text-[#888888] hover:text-[#1A1A1A]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleCreateDemand} className="space-y-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-[#444444] mb-1">Nome do Cliente *</label>
                            <input
                              required
                              type="text"
                              value={newDemandForm.name}
                              onChange={(e) => setNewDemandForm({ ...newDemandForm, name: e.target.value })}
                              placeholder="Ex: Maria Fernandes"
                              className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-[#444444] mb-1">WhatsApp / Telefone</label>
                              <input
                                type="text"
                                value={newDemandForm.phone}
                                onChange={(e) => setNewDemandForm({ ...newDemandForm, phone: e.target.value })}
                                placeholder="(11) 99999-9999"
                                className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-[#444444] mb-1">E-mail</label>
                              <input
                                type="email"
                                value={newDemandForm.email}
                                onChange={(e) => setNewDemandForm({ ...newDemandForm, email: e.target.value })}
                                placeholder="cliente@exemplo.com"
                                className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-[#444444] mb-1">Empresa / Negócio</label>
                              <input
                                type="text"
                                value={newDemandForm.businessName}
                                onChange={(e) => setNewDemandForm({ ...newDemandForm, businessName: e.target.value })}
                                placeholder="Nome da empresa"
                                className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-[#444444] mb-1">Orçamento Previsto</label>
                              <input
                                type="text"
                                value={newDemandForm.estimatedBudget}
                                onChange={(e) => setNewDemandForm({ ...newDemandForm, estimatedBudget: e.target.value })}
                                placeholder="Ex: R$ 4.000"
                                className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#444444] mb-1">Descrição da Demanda / Projeto</label>
                            <textarea
                              rows={3}
                              value={newDemandForm.biggestNeed}
                              onChange={(e) => setNewDemandForm({ ...newDemandForm, biggestNeed: e.target.value })}
                              placeholder="Descreva o que o cliente precisa, funcionalidades e objetivos..."
                              className="w-full px-3 py-2 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsCreatingDemand(false)}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#666666] hover:bg-[#F2F2EF]"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A47] hover:bg-[#162B34]"
                            >
                              Salvar Demanda
                            </button>
                          </div>
                        </form>
                      </div>
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
                    {/* Foto de Perfil da Regina (Seção Quem Somos / Quem está por trás) */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E4DD] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <label className="block font-bold text-[#1A1A1A] text-xs">
                            Sua Foto de Perfil (Seção "Quem está por trás")
                          </label>
                          <p className="text-[11px] text-[#666666]">
                            Foto profissional e acolhedora exibida na página "Quem Somos" apresentando a Regina.
                          </p>
                        </div>
                        {configForm.profilePhotoUrl && (
                          <button
                            type="button"
                            onClick={handleRestoreDefaultPhoto}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#888888] hover:text-red-600 transition-colors cursor-pointer self-start sm:self-auto"
                            title="Restaurar a foto original da Regina"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restaurar foto original</span>
                          </button>
                        )}
                      </div>

                      {photoStatusNotice && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{photoStatusNotice}</span>
                        </div>
                      )}

                      {photoErrorNotice && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 font-medium">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{photoErrorNotice}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                        {/* Mini preview */}
                        <div className="relative w-20 h-24 rounded-xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-[#EAEAE7]">
                          <img
                            src={
                              previewImageError || !configForm.profilePhotoUrl
                                ? reginaDefaultPhoto
                                : configForm.profilePhotoUrl
                            }
                            alt="Pré-visualização da foto da Regina"
                            onError={() => setPreviewImageError(true)}
                            className="w-full h-full object-cover object-center"
                          />
                          {isUploadingPhoto && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2.5 w-full">
                          {/* File upload input button */}
                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs ${
                                isUploadingPhoto
                                  ? 'bg-[#A0A09B] text-white cursor-not-allowed'
                                  : 'bg-[#1E3A47] hover:bg-[#162B34] text-white cursor-pointer'
                              }`}
                            >
                              {isUploadingPhoto ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E5A93B]" />
                                  <span>Processando foto...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-[#E5A93B]" />
                                  <span>Escolher Foto do Computador / Celular</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/*"
                                onChange={handleImageFileUpload}
                                disabled={isUploadingPhoto}
                                className="hidden"
                              />
                            </label>

                            <span className="text-[11px] text-[#777777]">
                              JPG, PNG ou WEBP (salva automaticamente)
                            </span>
                          </div>

                          {/* Or Direct URL */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                              Ou cole uma URL / Link direto de imagem:
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <ImageIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#888888]" />
                                <input
                                  type="url"
                                  value={urlInputValue}
                                  onChange={(e) => {
                                    setUrlInputValue(e.target.value);
                                    setPreviewImageError(false);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleApplyPhotoUrl(urlInputValue);
                                    }
                                  }}
                                  placeholder="https://exemplo.com/sua-foto.jpg ou link do Google Drive"
                                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs bg-white text-[#1A1A1A]"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleApplyPhotoUrl(urlInputValue)}
                                className="px-3.5 py-1.5 rounded-lg bg-[#1E3A47] hover:bg-[#162B34] text-white font-semibold text-xs cursor-pointer transition-colors shrink-0"
                              >
                                Aplicar
                              </button>
                            </div>
                            {previewImageError && (
                              <p className="text-[11px] text-amber-700 mt-1">
                                ⚠️ Aviso: Não foi possível carregar o link da imagem acima. Recomendamos usar o botão "Escolher Foto do Computador / Celular" para carregar a imagem diretamente.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

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
                          placeholder="Ex: 5511987654321"
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

                    <div className="pt-4 border-t border-[#EAEAE7] space-y-2 bg-[#FBFBFA] p-4 rounded-xl border border-[#EBEBE8]">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-[#1A1A1A]">
                          Alterar Senha de Acesso ao ADM:
                        </label>
                        <span className="text-[11px] text-[#777777]">
                          Padrão inicial: <code className="bg-white px-1.5 py-0.5 rounded border border-[#E0DED7] font-mono text-[#1E3A47]">bee2026</code>
                        </span>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#888888]" />
                        <input
                          type={showConfigPassword ? 'text' : 'password'}
                          value={configForm.adminPassword}
                          onChange={(e) => setConfigForm({ ...configForm, adminPassword: e.target.value })}
                          placeholder="Digite a nova senha desejada"
                          className="w-full pl-9 pr-10 py-2 rounded-xl border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs font-mono bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfigPassword(!showConfigPassword)}
                          className="absolute right-3 top-2.5 text-[#888888] hover:text-[#1A1A1A] cursor-pointer"
                        >
                          {showConfigPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#666666]">
                        Ao salvar, esta será a nova senha necessária para entrar na área administrativa.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#E5A93B] hover:bg-[#D99B26] text-[#1A1A1A] text-xs font-bold transition-colors cursor-pointer shadow-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar Alterações e Nova Senha</span>
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
