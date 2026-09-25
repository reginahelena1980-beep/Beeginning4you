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
  Loader2,
  Key,
  Ban,
  Check,
  Copy,
  ShieldAlert,
  CloudUpload,
  RefreshCw
} from 'lucide-react';
import reginaDefaultPhoto from '../assets/images/regina_portrait_1790082408093.jpg';
import {
  MeetingAppointment,
  DemandForm,
  ContactConfig,
  MeetingDiagnosticData,
  AdminAvailabilityConfig,
  BlockedSlot
} from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db, uploadProfilePhotoToStorage, fetchContactConfigFromFirestore, saveContactConfigToFirestore } from '../firebase';
import { compressImageFile, normalizeImageUrl } from '../utils/imageUtils';
import { maskPhone } from '../utils/phoneMask';
import {
  getContactConfig,
  saveContactConfig,
  formatWhatsAppDisplay,
  getAllDemandForms,
  saveDemandForm,
  deleteDemandForm,
  getAdminAppointments,
  saveAppointmentWithDiagnostic,
  deleteAppointmentInStorage,
  getAvailabilityConfig,
  saveAvailabilityConfig,
  addBlockedSlot,
  removeBlockedSlot,
  DEFAULT_AVAILABILITY_CONFIG,
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

  const [activeTab, setActiveTab] = useState<'agenda' | 'demandas' | 'disponibilidade' | 'config'>('agenda');
  const [showConfigPassword, setShowConfigPassword] = useState<boolean>(false);

  // Admin Data state
  const [config, setConfig] = useState<ContactConfig>(getContactConfig());
  const [appointments, setAppointments] = useState<MeetingAppointment[]>([]);
  const [demands, setDemands] = useState<DemandForm[]>([]);
  const [availability, setAvailability] = useState<AdminAvailabilityConfig>(getAvailabilityConfig());
  const [availNotice, setAvailNotice] = useState<string>('');
  const [newBlockDate, setNewBlockDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [newBlockTime, setNewBlockTime] = useState<string>('ALL_DAY');
  const [newBlockReason, setNewBlockReason] = useState<string>('');
  const [newCustomSlot, setNewCustomSlot] = useState<string>('');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'checking' | 'connected' | 'rules_needed'>('checking');
  const [copiedRules, setCopiedRules] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [cloudSyncSuccessMsg, setCloudSyncSuccessMsg] = useState<string>('');
  
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

  // Email and Server automation state
  const [showGmailPassword, setShowGmailPassword] = useState<boolean>(false);
  const [isTestingEmail, setIsTestingEmail] = useState<boolean>(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

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
    setAvailability(getAvailabilityConfig());

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

  // Check live cloud connection with Firestore & auto-sync local availability to cloud
  useEffect(() => {
    if (isOpen && activeTab === 'disponibilidade') {
      setCloudSyncStatus('checking');
      getDoc(doc(db, 'settings', 'contact_config'))
        .then(() => {
          setCloudSyncStatus('connected');
          // Automatically ensure current local availability is persisted in the cloud
          const current = getContactConfig();
          if (current?.availability) {
            saveContactConfigToFirestore(current).catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('[Cloud Sync Check] Firestore check notice:', err);
          setCloudSyncStatus('rules_needed');
        });
    }
  }, [isOpen, activeTab]);

  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    setCloudSyncSuccessMsg('');
    try {
      const currentConfig = getContactConfig();
      await saveContactConfigToFirestore(currentConfig);
      setCloudSyncStatus('connected');
      const nowTime = new Date().toLocaleTimeString('pt-BR');
      setCloudSyncSuccessMsg(`Configurações e bloqueios publicados na nuvem com sucesso às ${nowTime}! Qualquer visitante já consegue visualizar.`);
      setTimeout(() => setCloudSyncSuccessMsg(''), 6000);
    } catch (err: any) {
      alert('Erro ao sincronizar com a nuvem do Firebase: ' + (err?.message || err));
    } finally {
      setIsSyncingCloud(false);
    }
  };

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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveContactConfig(configForm);
    setConfig(configForm);

    try {
      await fetch('/api/admin/save-server-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmailAppPassword: configForm.gmailAppPassword,
          whatsappGatewayUrl: configForm.whatsappGatewayUrl,
          whatsappGatewayToken: configForm.whatsappGatewayToken
        })
      });
    } catch (err) {
      console.warn('Could not sync with server config', err);
    }

    setConfigSavedNotice('Configurações salvas e sincronizadas com o servidor com sucesso!');
    setTimeout(() => setConfigSavedNotice(''), 3500);
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: configForm.email || 'beeginning4you@gmail.com',
          appPassword: configForm.gmailAppPassword
        })
      });
      const data = await res.json();
      setTestEmailResult({
        success: !!data.success,
        message: data.message || data.error || (data.success ? 'E-mail enviado com sucesso!' : 'Falha no teste')
      });
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: err?.message || 'Erro ao conectar ao servidor.'
      });
    } finally {
      setIsTestingEmail(false);
    }
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

  // ========================
  // Availability & Scheduling Handlers
  // ========================
  const handleToggleDayOfWeek = (dayIndex: number) => {
    const current = availability.activeDaysOfWeek || [];
    let updated: number[];
    if (current.includes(dayIndex)) {
      if (current.length === 1) {
        alert('É necessário manter pelo menos um dia da semana ativo para atendimento.');
        return;
      }
      updated = current.filter((d) => d !== dayIndex);
    } else {
      updated = [...current, dayIndex].sort((a, b) => a - b);
    }
    const saved = saveAvailabilityConfig({ activeDaysOfWeek: updated });
    setAvailability(saved);
    setAvailNotice('Dias de atendimento atualizados com sucesso!');
    setTimeout(() => setAvailNotice(''), 3500);
  };

  const handleSetPresetDays = (days: number[]) => {
    const saved = saveAvailabilityConfig({ activeDaysOfWeek: days });
    setAvailability(saved);
    setAvailNotice('Dias de atendimento configurados com sucesso!');
    setTimeout(() => setAvailNotice(''), 3500);
  };

  const handleAddSlot = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newCustomSlot.trim();
    if (!clean) return;
    if (!/^\d{2}:\d{2}$/.test(clean)) {
      alert('Formato de horário inválido. Utilize o formato HH:mm (ex: 08:30 ou 18:00).');
      return;
    }
    const current = availability.dailyTimeSlots || [];
    if (current.includes(clean)) {
      alert('Este horário já está cadastrado na sua grade de atendimento.');
      return;
    }
    const updated = [...current, clean].sort();
    const saved = saveAvailabilityConfig({ dailyTimeSlots: updated });
    setAvailability(saved);
    setNewCustomSlot('');
    setAvailNotice(`Horário ${clean} adicionado à sua grade de atendimento!`);
    setTimeout(() => setAvailNotice(''), 3500);
  };

  const handleRemoveSlot = (slotToRemove: string) => {
    const current = availability.dailyTimeSlots || [];
    if (current.length <= 1) {
      alert('É necessário manter ao menos um horário de atendimento ativo na grade.');
      return;
    }
    const updated = current.filter((s) => s !== slotToRemove);
    const saved = saveAvailabilityConfig({ dailyTimeSlots: updated });
    setAvailability(saved);
    setAvailNotice(`Horário ${slotToRemove} removido da grade.`);
    setTimeout(() => setAvailNotice(''), 3500);
  };

  const handleResetSlots = () => {
    const saved = saveAvailabilityConfig({
      dailyTimeSlots: DEFAULT_AVAILABILITY_CONFIG.dailyTimeSlots
    });
    setAvailability(saved);
    setAvailNotice('Faixas de horários restauradas para o padrão comercial (09h às 17h)!');
    setTimeout(() => setAvailNotice(''), 3500);
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockDate) {
      alert('Por favor, selecione uma data para o bloqueio.');
      return;
    }
    const timeToBlock = newBlockTime === 'ALL_DAY' ? '' : newBlockTime;
    addBlockedSlot({
      date: newBlockDate,
      time: timeToBlock,
      reason: newBlockReason.trim() || (timeToBlock ? 'Compromisso externo' : 'Folga / Sem atendimento')
    });
    setAvailability(getAvailabilityConfig());
    setNewBlockReason('');
    setAvailNotice(
      timeToBlock
        ? `Horário ${timeToBlock} do dia ${newBlockDate.split('-').reverse().join('/')} bloqueado com sucesso! Já está indisponível para novos agendamentos no site.`
        : `Dia ${newBlockDate.split('-').reverse().join('/')} inteiro bloqueado para atendimentos! Já está indisponível para novos agendamentos no site.`
    );
    setTimeout(() => setAvailNotice(''), 4500);
  };

  const handleRemoveBlock = (blockId: string) => {
    removeBlockedSlot(blockId);
    setAvailability(getAvailabilityConfig());
    setAvailNotice('Bloqueio removido! O horário foi liberado imediatamente para agendamentos no site.');
    setTimeout(() => setAvailNotice(''), 4000);
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
                id="btn-admin-tab-disponibilidade"
                onClick={() => {
                  setActiveTab('disponibilidade');
                  setSelectedMeeting(null);
                  setSelectedDemand(null);
                }}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'disponibilidade'
                    ? 'border-[#1E3A47] text-[#1E3A47]'
                    : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Disponibilidade & Horários</span>
                {availability.blockedSlots && availability.blockedSlots.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-200 text-amber-900">
                    {availability.blockedSlots.length}
                  </span>
                )}
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
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#555555]">
                            Reuniões Agendadas
                          </h4>
                          <span className="text-xs font-semibold text-[#888888]">
                            ({appointments.length})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab('disponibilidade')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5A93B]/40 bg-[#E5A93B]/10 hover:bg-[#E5A93B]/20 text-[#8F6413] text-[11px] font-bold transition-colors cursor-pointer"
                          title="Definir dias da semana, faixas de horários e bloqueios manuais"
                        >
                          <Clock className="w-3 h-3 text-[#D99B26]" />
                          <span>Gerenciar Disponibilidade</span>
                        </button>
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
                                `Olá, *${selectedMeeting.clientName}*! Aqui é a Regina da *Bee-ginning 4 you*.\n\n` +
                                `Confirmamos o agendamento da sua reunião virtual conosco:\n\n` +
                                `📅 *Data:* ${selectedMeeting.date.split('-').reverse().join('/')}\n` +
                                `⏰ *Horário:* ${selectedMeeting.time} (Horário de Brasília)\n` +
                                `⏳ *Duração:* 45 minutos\n` +
                                `💻 *Sala Google Meet:* ${selectedMeeting.meetLink || config.meetUrl}\n\n` +
                                `🔒 Garantimos sigilo absoluto sobre todas as suas ideias e conformidade com a LGPD.\n\n` +
                                `Qualquer dúvida estou à disposição por aqui. Até logo!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#136C35] font-bold"
                              title="Abre o seu WhatsApp com mensagem oficial pronta para enviar para o cliente"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Disparar WhatsApp ao Cliente</span>
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
                                type="tel"
                                value={newDemandForm.phone}
                                onChange={(e) => setNewDemandForm({ ...newDemandForm, phone: maskPhone(e.target.value) })}
                                placeholder="(11) 99999-9999"
                                maxLength={15}
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

              {/* TAB 3: DISPONIBILIDADE & HORÁRIOS */}
              {activeTab === 'disponibilidade' && (
                <div className="space-y-6">
                  {/* Feedback Banner */}
                  {availNotice && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium animate-fadeIn">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{availNotice}</span>
                    </div>
                  )}

                  {/* Header Intro */}
                  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E5E2] shadow-xs space-y-1">
                    <div className="flex items-center gap-2 text-[#1E3A47]">
                      <Clock className="w-5 h-5 text-[#E5A93B]" />
                      <h4 className="text-base font-bold text-[#1A1A1A]">
                        Gestão de Disponibilidade & Agenda de Atendimento
                      </h4>
                    </div>
                    <p className="text-xs text-[#666666]">
                      Defina com total autonomia quais <strong>dias da semana</strong> e <strong>faixas de horários</strong> você está disponível para reuniões.
                      Horários bloqueados manualmente por você ou preenchidos por agendamentos de clientes ficam <strong>imediatamente indisponíveis</strong> no site em tempo real.
                    </p>
                  </div>

                  {/* Cloud Synchronization Diagnostic Card */}
                  {cloudSyncStatus === 'rules_needed' && (
                    <div className="bg-amber-50/90 border-2 border-amber-300 p-5 rounded-2xl space-y-3 shadow-xs animate-fadeIn">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <h5 className="text-sm font-bold text-amber-950">
                            Atenção para Visitantes e Outros Dispositivos (Regras do Firebase)
                          </h5>
                          <p className="text-xs text-amber-900 leading-relaxed">
                            Suas alterações de horários e folgas estão salvas no seu navegador, porém seu banco de dados na nuvem (<strong>Firebase Firestore</strong>) está com as permissões de leitura bloqueadas por padrão no Console do Firebase. Por isso, <strong>visitantes em outro computador ou celular ainda não conseguem carregar seus bloqueios</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2.5 text-xs text-neutral-800">
                        <p className="font-bold text-[#1E3A47]">
                          👉 Como liberar a visualização pública para todos os visitantes em 30 segundos:
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs text-neutral-700 leading-relaxed">
                          <li>
                            Acesse a aba de Regras no Console do Firebase:{' '}
                            <a
                              href="https://console.firebase.google.com/project/beeginning4you/firestore/rules"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-[#1E3A47] underline hover:text-[#D99B26]"
                            >
                              <span>Abrir Firebase Console Rules (beeginning4you)</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </li>
                          <li>Substitua o conteúdo da caixa de texto pelo código de segurança oficial abaixo:</li>
                          <div className="relative my-2">
                            <pre className="p-3 bg-neutral-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto leading-tight select-all">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /settings/{settingId} { allow read, write: if true; }
    match /demands/{demandId} { allow read, write: if true; }
    match /appointments/{appointmentId} { allow read, write: if true; }
    match /{document=**} { allow read, write: if false; }
  }
}`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                const rulesText = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /settings/{settingId} { allow read, write: if true; }\n    match /demands/{demandId} { allow read, write: if true; }\n    match /appointments/{appointmentId} { allow read, write: if true; }\n    match /{document=**} { allow read, write: if false; }\n  }\n}`;
                                navigator.clipboard.writeText(rulesText);
                                setCopiedRules(true);
                                setTimeout(() => setCopiedRules(false), 4000);
                              }}
                              className="absolute top-2 right-2 px-2.5 py-1 rounded bg-white hover:bg-neutral-100 text-neutral-800 text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              {copiedRules ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-neutral-600" />
                                  <span>Copiar Código</span>
                                </>
                              )}
                            </button>
                          </div>
                          <li>Clique no botão azul <strong>Publicar (Publish)</strong> no topo do Firebase Console.</li>
                        </ol>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-neutral-500">
                            Assim que você publicar no console, o status abaixo passará a verde automaticamente.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCloudSyncStatus('checking');
                              getDoc(doc(db, 'settings', 'contact_config'))
                                .then(() => setCloudSyncStatus('connected'))
                                .catch(() => setCloudSyncStatus('rules_needed'));
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#1E3A47] hover:bg-[#162B34] text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Reverificar Conexão
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {cloudSyncStatus === 'connected' && (
                    <div className="p-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-emerald-950">
                              Nuvem Firebase Conectada:
                            </span>
                            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                              beegining4you (Firestore Live)
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            {cloudSyncSuccessMsg || 'Suas alterações de horários e folgas estão sincronizadas e ativas para todos os visitantes do site.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleManualCloudSync}
                          disabled={isSyncingCloud}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                          title="Garante que as folgas e faixas de horários salvas no seu navegador sejam enviadas para a nuvem do Firebase"
                        >
                          {isSyncingCloud ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Sincronizando...</span>
                            </>
                          ) : (
                            <>
                              <CloudUpload className="w-3.5 h-3.5" />
                              <span>Sincronizar com a Nuvem Agora</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Weekly Schedule & Time Slots */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* CARD 1: DIAS DA SEMANA */}
                      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E5E2] shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0F0EE]">
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                              1. Dias da Semana de Atendimento
                            </h5>
                            <p className="text-[11px] text-[#666666] mt-0.5">
                              Clique no dia para ativar ou desativar o atendimento no site
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleSetPresetDays([1, 2, 3, 4, 5])}
                              className="px-2.5 py-1 rounded-lg bg-[#F5F5F3] hover:bg-[#EAEAE7] text-[10px] font-bold text-[#333333] transition-colors cursor-pointer"
                            >
                              Seg a Sex
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetPresetDays([1, 2, 3, 4, 5, 6])}
                              className="px-2.5 py-1 rounded-lg bg-[#F5F5F3] hover:bg-[#EAEAE7] text-[10px] font-bold text-[#333333] transition-colors cursor-pointer"
                            >
                              Seg a Sáb
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetPresetDays([0, 1, 2, 3, 4, 5, 6])}
                              className="px-2.5 py-1 rounded-lg bg-[#F5F5F3] hover:bg-[#EAEAE7] text-[10px] font-bold text-[#333333] transition-colors cursor-pointer"
                            >
                              Todos
                            </button>
                          </div>
                        </div>

                        {/* Weekdays Toggle Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                          {[
                            { index: 1, label: 'Seg', name: 'Segunda-feira' },
                            { index: 2, label: 'Ter', name: 'Terça-feira' },
                            { index: 3, label: 'Qua', name: 'Quarta-feira' },
                            { index: 4, label: 'Qui', name: 'Quinta-feira' },
                            { index: 5, label: 'Sex', name: 'Sexta-feira' },
                            { index: 6, label: 'Sáb', name: 'Sábado' },
                            { index: 0, label: 'Dom', name: 'Domingo' }
                          ].map((day) => {
                            const isActive = (availability.activeDaysOfWeek || []).includes(day.index);
                            return (
                              <button
                                key={day.index}
                                type="button"
                                onClick={() => handleToggleDayOfWeek(day.index)}
                                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                  isActive
                                    ? 'bg-[#1E3A47] text-white border-[#1E3A47] shadow-sm'
                                    : 'bg-white text-neutral-400 border-neutral-200 hover:border-neutral-300'
                                }`}
                              >
                                <span className="text-xs font-extrabold uppercase">{day.label}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  isActive ? 'bg-[#E5A93B] text-[#1A1A1A]' : 'bg-neutral-100 text-neutral-500'
                                }`}>
                                  {isActive ? 'Ativo' : 'Off'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* CARD 2: FAIXAS DE HORÁRIOS */}
                      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E5E2] shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0F0EE]">
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                              2. Faixas de Horários de Atendimento (Slots Padrão)
                            </h5>
                            <p className="text-[11px] text-[#666666] mt-0.5">
                              Estes são os horários oferecidos aos clientes nos dias ativos (sessões de 45 min)
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleResetSlots}
                            className="px-2.5 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-[10px] font-bold text-neutral-700 transition-colors cursor-pointer self-start sm:self-auto"
                            title="Restaurar lista de horários para 09:00, 10:00, 11:00, 14:00, 15:00, 16:00, 17:00"
                          >
                            Restaurar Padrão
                          </button>
                        </div>

                        {/* Current Slots Chips */}
                        <div className="flex flex-wrap gap-2">
                          {(availability.dailyTimeSlots || []).map((slot) => (
                            <div
                              key={slot}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E5A93B]/40 text-xs font-bold text-[#1A1A1A] shadow-2xs"
                            >
                              <Clock className="w-3.5 h-3.5 text-[#E5A93B]" />
                              <span>{slot}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(slot)}
                                className="p-0.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-full cursor-pointer transition-colors"
                                title={`Remover horário ${slot}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Slot Form */}
                        <form onSubmit={handleAddSlot} className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#F0F0EE]">
                          <div className="w-full sm:w-auto flex-1 flex items-center gap-2">
                            <input
                              type="time"
                              value={newCustomSlot}
                              onChange={(e) => setNewCustomSlot(e.target.value)}
                              placeholder="HH:mm"
                              className="px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none focus:border-[#1E3A47] w-full"
                            />
                            <button
                              type="submit"
                              disabled={!newCustomSlot}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A47] hover:bg-[#162B34] text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar Horário</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-neutral-400 font-medium">Sugestões:</span>
                            {['08:30', '13:00', '18:00'].map((suggested) => (
                              !(availability.dailyTimeSlots || []).includes(suggested) && (
                                <button
                                  key={suggested}
                                  type="button"
                                  onClick={() => {
                                    setNewCustomSlot(suggested);
                                  }}
                                  className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-[10px] font-bold text-neutral-700 cursor-pointer"
                                >
                                  +{suggested}
                                </button>
                              )
                            ))}
                          </div>
                        </form>
                      </div>

                    </div>

                    {/* Right Column: Manual Block Engine & Summary */}
                    <div className="lg:col-span-5 space-y-6">

                      {/* CARD 3: BLOQUEIO MANUAL (FOLGAS / COMPROMISSOS EXTERNOS) */}
                      <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-amber-300/80 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 text-amber-900 pb-2 border-b border-amber-200">
                          <Ban className="w-4 h-4 text-amber-600" />
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                            3. Bloquear Horário ou Folga Manualmente
                          </h5>
                        </div>

                        <p className="text-[11px] text-[#666666]">
                          Bloqueie uma data inteira (folga/feriado) ou uma faixa específica (médico, compromisso).
                          O horário bloqueado fica <strong>indisponível imediatamente</strong> no site.
                        </p>

                        <form onSubmit={handleAddBlock} className="space-y-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-[#444444] mb-1">
                              Data do Bloqueio *
                            </label>
                            <input
                              type="date"
                              required
                              value={newBlockDate}
                              onChange={(e) => setNewBlockDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-[#1E3A47] text-xs outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#444444] mb-1">
                              Horário a Bloquear *
                            </label>
                            <select
                              value={newBlockTime}
                              onChange={(e) => setNewBlockTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-[#1E3A47] text-xs outline-none bg-white font-medium"
                            >
                              <option value="ALL_DAY">🚫 Dia Todo (Bloquear todos os horários da data)</option>
                              {(availability.dailyTimeSlots || []).map((t) => (
                                <option key={t} value={t}>
                                  ⏰ Apenas o horário das {t}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#444444] mb-1">
                              Motivo / Observação Interna (Opcional)
                            </label>
                            <input
                              type="text"
                              value={newBlockReason}
                              onChange={(e) => setNewBlockReason(e.target.value)}
                              placeholder="Ex: Folga, Médico, Reunião externa com parceiro..."
                              className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-[#1E3A47] text-xs outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Confirmar Bloqueio Imediato</span>
                          </button>
                        </form>

                        {/* List of active blocks */}
                        <div className="pt-3 border-t border-neutral-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                              Bloqueios Manuais Ativos ({availability.blockedSlots?.length || 0})
                            </span>
                          </div>

                          {!availability.blockedSlots || availability.blockedSlots.length === 0 ? (
                            <p className="text-[11px] text-neutral-400 italic py-2 text-center bg-neutral-50 rounded-xl">
                              Nenhum bloqueio manual ativo. Todos os horários da sua grade semanal estão livres para clientes.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {availability.blockedSlots.map((b) => (
                                <div
                                  key={b.id}
                                  className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-amber-950">
                                        {b.date.split('-').reverse().join('/')}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-amber-200/80 text-[10px] font-extrabold text-amber-900">
                                        {b.time ? `às ${b.time}` : 'Dia Todo'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-amber-800 line-clamp-1 mt-0.5">
                                      {b.reason || 'Compromisso externo'}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBlock(b.id)}
                                    className="px-2 py-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                                    title="Desbloquear e liberar horário imediatamente para clientes"
                                  >
                                    Desbloquear
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CARD 4: VISÃO GERAL DE HORÁRIOS OCUPADOS POR CLIENTES */}
                      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E5E2] shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-1 border-b border-[#F0F0EE]">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                            Horários Ocupados por Reuniões
                          </h5>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {appointments.filter((a) => a.status !== 'cancelled').length} reuniões
                          </span>
                        </div>

                        <p className="text-[11px] text-[#666666]">
                          Estes horários foram automaticamente bloqueados pelo sistema assim que os clientes concluíram o agendamento no site.
                        </p>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {appointments.filter((a) => a.status !== 'cancelled').length === 0 ? (
                            <p className="text-[11px] text-neutral-400 italic py-2 text-center">
                              Nenhuma reunião ocupando horários no momento.
                            </p>
                          ) : (
                            appointments
                              .filter((a) => a.status !== 'cancelled')
                              .slice(0, 6)
                              .map((a) => (
                                <div
                                  key={a.id}
                                  className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-[#1A1A1A]">
                                        {a.date.split('-').reverse().join('/')} às {a.time}
                                      </span>
                                      <span className="text-[10px] font-medium text-neutral-500">
                                        (45 min)
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#666666] truncate font-medium">
                                      {a.clientName}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedMeeting(a);
                                      setActiveTab('agenda');
                                    }}
                                    className="text-[10px] font-bold text-[#1E3A47] hover:underline shrink-0"
                                  >
                                    Ver na Agenda &rarr;
                                  </button>
                                </div>
                              ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CONFIGURAÇÃO DE CONTATO & CANAIS */}
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
                        Número do WhatsApp de Atendimento:
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[#888888]" />
                        <input
                          type="text"
                          required
                          value={
                            configForm.whatsappNumber.startsWith('55')
                              ? formatWhatsAppDisplay(configForm.whatsappNumber)
                              : maskPhone(configForm.whatsappNumber) || configForm.whatsappNumber
                          }
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '');
                            // Store clean digits with 55 prefix if full Brazilian number
                            let cleanStored = digits;
                            if (digits.length === 11 && !digits.startsWith('55')) {
                              cleanStored = `55${digits}`;
                            } else if (digits.length === 13 && digits.startsWith('55')) {
                              cleanStored = digits;
                            }
                            setConfigForm({ ...configForm, whatsappNumber: cleanStored });
                          }}
                          placeholder="(11) 98629-7916"
                          maxLength={19}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5D5D0] focus:border-[#1E3A47] outline-none text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-[#888888]">
                        <span>
                          Número com máscara organizada <strong>(XX) XXXXX-XXXX</strong> que recebe as mensagens do site.
                        </span>
                        {configForm.whatsappNumber && (
                          <span className="font-semibold text-[#1E3A47] bg-[#F2F2EE] px-2 py-0.5 rounded text-[10px]">
                            Exibição no site: {formatWhatsAppDisplay(configForm.whatsappNumber)}
                          </span>
                        )}
                      </div>
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
