import {
  ContactConfig,
  DemandForm,
  MeetingAppointment,
  MeetingDiagnosticData,
  AdminAvailabilityConfig,
  BlockedSlot
} from '../types';
import {
  saveContactConfigToFirestore,
  subscribeContactConfigFromFirestore,
  fetchContactConfigFromFirestore,
  saveDemandToFirestore,
  deleteDemandFromFirestore,
  subscribeDemandsFromFirestore,
  fetchDemandsFromFirestore,
  saveAppointmentToFirestore,
  deleteAppointmentFromFirestore,
  subscribeAppointmentsFromFirestore,
  fetchAppointmentsFromFirestore
} from '../firebase';

export const DEFAULT_AVAILABILITY_CONFIG: AdminAvailabilityConfig = {
  activeDaysOfWeek: [1, 2, 3, 4, 5], // Seg, Ter, Qua, Qui, Sex
  dailyTimeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
  slotDurationMinutes: 45,
  blockedSlots: []
};

export const DEFAULT_CONTACT_CONFIG: ContactConfig = {
  whatsappNumber: '5511986297916',
  whatsappDisplay: '(11) 98629-7916',
  whatsappMessage: 'Olá! Vim pelo site da Beeginning 4 you e gostaria de conversar sobre uma ideia de negócio.',
  email: 'beeginning4you@gmail.com',
  meetUrl: 'https://meet.google.com/fxx-ctnv-hgm',
  fixedMeetUrl: 'https://meet.google.com/fxx-ctnv-hgm',
  businessHours: 'Segunda a Sexta das 08h30 às 18h30',
  adminPassword: 'bee2026',
  adminPasswordHash: 'bee2026',
  profilePhotoUrl: '',
  gmailAppPassword: '',
  whatsappGatewayUrl: '',
  whatsappGatewayToken: '',
  availability: DEFAULT_AVAILABILITY_CONFIG
};

const CONFIG_STORAGE_KEY = 'beeginning_contact_config_v1';
const FORMS_STORAGE_KEY = 'beeginning_demand_forms_v1';
const MEETINGS_STORAGE_KEY = 'beeginning_scheduled_meetings_v1';
export const STORAGE_CHANGE_EVENT = 'beeginning_storage_updated';

export function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
  }
}

/**
 * Filter out any mock/sample items that might linger in client's localStorage
 * from previous test sessions.
 */
function isMockDemand(item: Partial<DemandForm>): boolean {
  if (!item) return false;
  const id = (item.id || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  return (
    id.includes('sample') ||
    id === 'form-sample-1' ||
    id === 'form-sample-2' ||
    id === 'demand-from-meet-sample-1' ||
    name === 'mariana duarte' ||
    name === 'carlos alberto lima'
  );
}

function isMockMeeting(item: Partial<MeetingAppointment>): boolean {
  if (!item) return false;
  const id = (item.id || '').toLowerCase();
  const name = (item.clientName || '').toLowerCase();
  return (
    id.includes('sample') ||
    id === 'meet-sample-1' ||
    name === 'carla vasconcelos'
  );
}

function purgeLegacyMockData() {
  if (typeof window === 'undefined') return;
  try {
    const configRaw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (configRaw) {
      const parsed = JSON.parse(configRaw);
      const sanitized = sanitizeContactConfig(parsed);
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
    } else {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_CONTACT_CONFIG));
    }

    const formsRaw = localStorage.getItem(FORMS_STORAGE_KEY);
    if (formsRaw) {
      const parsed: DemandForm[] = JSON.parse(formsRaw);
      const cleaned = parsed.filter((f) => !isMockDemand(f));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(cleaned));
      }
    }

    const meetingsRaw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (meetingsRaw) {
      const parsed: MeetingAppointment[] = JSON.parse(meetingsRaw);
      const cleaned = parsed.filter((m) => !isMockMeeting(m));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(cleaned));
      }
    }
  } catch (err) {
    console.warn('Could not purge legacy mock data', err);
  }
}

// Initialise Firebase real-time listeners, server API dual-sync, and direct initial fetch
if (typeof window !== 'undefined') {
  purgeLegacyMockData();

  // 0. Immediate fetch from backend API (fast, reliable server persistence)
  fetch('/api/config')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.config && Object.keys(data.config).length > 0) {
        const sanitized = sanitizeContactConfig(data.config);
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
        notifyStorageChange();
      }
    })
    .catch(() => {});

  fetch('/api/appointments')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (Array.isArray(data?.appointments)) {
        const cleaned = data.appointments.filter((m: any) => !isMockMeeting(m));
        localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(cleaned));
        notifyStorageChange();
      }
    })
    .catch(() => {});

  fetch('/api/demands')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (Array.isArray(data?.demands)) {
        const cleaned = data.demands.filter((f: any) => !isMockDemand(f));
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(cleaned));
        notifyStorageChange();
      }
    })
    .catch(() => {});

  // 1. One-off initial direct fetch to prime cache from live Firestore
  fetchContactConfigFromFirestore().then((remoteConfig) => {
    if (remoteConfig && Object.keys(remoteConfig).length > 0) {
      // If remote has valid availability, adopt it
      if (remoteConfig.availability && Object.keys(remoteConfig.availability).length > 0) {
        const sanitized = sanitizeContactConfig(remoteConfig);
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
        notifyStorageChange();
      } else {
        // Remote exists but lacks availability - if local has availability, upload local config to Firestore
        const local = getContactConfig();
        if (local?.availability && (local.availability.blockedSlots?.length || (local.availability.activeDaysOfWeek && local.availability.activeDaysOfWeek.length < 7))) {
          saveContactConfigToFirestore(local);
        } else {
          const sanitized = sanitizeContactConfig(remoteConfig);
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
          notifyStorageChange();
        }
      }
    } else {
      // Firestore has no config yet - upload current local config
      const local = getContactConfig();
      if (local) {
        saveContactConfigToFirestore(local);
      }
    }
  }).catch(() => {});

  fetchDemandsFromFirestore().then((remoteDemands) => {
    if (Array.isArray(remoteDemands)) {
      const cleaned = remoteDemands.filter((f) => !isMockDemand(f));
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(cleaned));
      notifyStorageChange();
    }
  }).catch(() => {});

  fetchAppointmentsFromFirestore().then((remoteAppointments) => {
    if (Array.isArray(remoteAppointments)) {
      const cleaned = remoteAppointments.filter((m) => !isMockMeeting(m));
      localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(cleaned));
      notifyStorageChange();
    }
  }).catch(() => {});

  // 2. Continuous real-time Firestore listeners
  subscribeContactConfigFromFirestore((remoteConfig) => {
    if (remoteConfig && Object.keys(remoteConfig).length > 0) {
      const sanitized = sanitizeContactConfig(remoteConfig);
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
      notifyStorageChange();
    }
  });

  subscribeDemandsFromFirestore((remoteDemands) => {
    if (Array.isArray(remoteDemands)) {
      const cleaned = remoteDemands.filter((f) => !isMockDemand(f));
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(cleaned));
      notifyStorageChange();
    }
  });

  subscribeAppointmentsFromFirestore((remoteAppointments) => {
    if (Array.isArray(remoteAppointments)) {
      const cleaned = remoteAppointments.filter((m) => !isMockMeeting(m));
      localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(cleaned));
      notifyStorageChange();
    }
  });
}

export function formatWhatsAppDisplay(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 9);
    const part2 = digits.slice(9, 13);
    return `(${ddd}) ${part1}-${part2}`;
  }
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const part1 = digits.slice(2, 7);
    const part2 = digits.slice(7, 11);
    return `(${ddd}) ${part1}-${part2}`;
  }
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const part1 = digits.slice(2, 6);
    const part2 = digits.slice(6, 10);
    return `(${ddd}) ${part1}-${part2}`;
  }
  return raw || '(11) 98629-7916';
}

export function sanitizeContactConfig(config: Partial<ContactConfig> | null | undefined): ContactConfig {
  const merged: ContactConfig = {
    ...DEFAULT_CONTACT_CONFIG,
    ...(config || {}),
  };

  const rawWa = (merged.whatsappNumber || '').replace(/\D/g, '');
  const rawDisplay = merged.whatsappDisplay || '';

  // If number or display is placeholder or not containing official 98629
  if (!rawWa || rawWa.includes('99999') || rawDisplay.includes('99999') || rawWa === '5511987654321' || !rawWa.includes('98629')) {
    merged.whatsappNumber = '5511986297916';
    merged.whatsappDisplay = '(11) 98629-7916';
  } else {
    merged.whatsappDisplay = formatWhatsAppDisplay(merged.whatsappNumber);
  }

  // Ensure official email if empty or old placeholder
  if (!merged.email || merged.email.includes('example.com') || merged.email === 'contato@beeginning4you.com.br') {
    merged.email = 'beeginning4you@gmail.com';
  }

  if (!merged.meetUrl || merged.meetUrl.includes('beg-4you-meet')) {
    merged.meetUrl = 'https://meet.google.com/fxx-ctnv-hgm';
  }
  if (!merged.fixedMeetUrl || merged.fixedMeetUrl.includes('beg-4you-meet')) {
    merged.fixedMeetUrl = 'https://meet.google.com/fxx-ctnv-hgm';
  }

  // Sanitize Availability configuration
  const rawAvail = config?.availability || merged.availability;
  const sanitizedAvailability: AdminAvailabilityConfig = {
    activeDaysOfWeek: Array.isArray(rawAvail?.activeDaysOfWeek) && rawAvail.activeDaysOfWeek.length > 0
      ? rawAvail.activeDaysOfWeek
      : DEFAULT_AVAILABILITY_CONFIG.activeDaysOfWeek,
    dailyTimeSlots: Array.isArray(rawAvail?.dailyTimeSlots) && rawAvail.dailyTimeSlots.length > 0
      ? rawAvail.dailyTimeSlots
      : DEFAULT_AVAILABILITY_CONFIG.dailyTimeSlots,
    slotDurationMinutes: rawAvail?.slotDurationMinutes || 45,
    blockedSlots: Array.isArray(rawAvail?.blockedSlots) ? rawAvail.blockedSlots : []
  };
  merged.availability = sanitizedAvailability;

  return merged;
}

// ========================
// 1. Contact Configuration & Availability
// ========================
export function getContactConfig(): ContactConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTACT_CONFIG;
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeContactConfig(parsed);
    // If sanitized differs in display or number, persist it
    if (sanitized.whatsappDisplay !== parsed.whatsappDisplay || sanitized.whatsappNumber !== parsed.whatsappNumber || sanitized.email !== parsed.email) {
      try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
      } catch {}
    }
    return sanitized;
  } catch (e) {
    console.error('Error loading contact config', e);
    return DEFAULT_CONTACT_CONFIG;
  }
}

export function saveContactConfig(config: ContactConfig): ContactConfig {
  try {
    let cleanWa = (config.whatsappNumber || '').replace(/\D/g, '');
    if (cleanWa.length === 11 && !cleanWa.startsWith('55')) {
      cleanWa = `55${cleanWa}`;
    }
    const updated: ContactConfig = {
      ...config,
      whatsappNumber: cleanWa || DEFAULT_CONTACT_CONFIG.whatsappNumber,
      whatsappDisplay: formatWhatsAppDisplay(cleanWa || DEFAULT_CONTACT_CONFIG.whatsappNumber),
      availability: config.availability || DEFAULT_AVAILABILITY_CONFIG
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
    saveContactConfigToFirestore(updated);
    try {
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updated })
      }).catch(() => {});
    } catch {}
    notifyStorageChange();
    return updated;
  } catch (e) {
    console.error('Error saving contact config', e);
  }
  return config;
}

// ========================
// Availability & Schedule Management
// ========================
export function getAvailabilityConfig(): AdminAvailabilityConfig {
  const config = getContactConfig();
  return config.availability || DEFAULT_AVAILABILITY_CONFIG;
}

export function saveAvailabilityConfig(avail: Partial<AdminAvailabilityConfig>): AdminAvailabilityConfig {
  const curConfig = getContactConfig();
  const currentAvail = curConfig.availability || DEFAULT_AVAILABILITY_CONFIG;
  const updatedAvail: AdminAvailabilityConfig = {
    ...currentAvail,
    ...avail,
    updatedAt: new Date().toISOString()
  };
  const updatedConfig: ContactConfig = {
    ...curConfig,
    availability: updatedAvail
  };
  saveContactConfig(updatedConfig);
  return updatedAvail;
}

export function addBlockedSlot(block: { date: string; time?: string; reason?: string }): BlockedSlot {
  const currentAvail = getAvailabilityConfig();
  const newBlock: BlockedSlot = {
    id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: block.date,
    time: block.time || '',
    reason: block.reason || 'Compromisso externo / Folga',
    createdAt: new Date().toISOString()
  };
  const updatedBlocked = [newBlock, ...(currentAvail.blockedSlots || [])];
  saveAvailabilityConfig({ blockedSlots: updatedBlocked });
  return newBlock;
}

export function removeBlockedSlot(blockId: string): void {
  const currentAvail = getAvailabilityConfig();
  const updatedBlocked = (currentAvail.blockedSlots || []).filter((b) => b.id !== blockId);
  saveAvailabilityConfig({ blockedSlots: updatedBlocked });
}

export function isDateBlocked(dateStr: string): boolean {
  const currentAvail = getAvailabilityConfig();
  return (currentAvail.blockedSlots || []).some(
    (b) => b.date === dateStr && (!b.time || b.time === 'ALL_DAY' || b.time.trim() === '')
  );
}

export function isSlotBlocked(dateStr: string, timeStr: string): boolean {
  const currentAvail = getAvailabilityConfig();
  return (currentAvail.blockedSlots || []).some(
    (b) => b.date === dateStr && (!b.time || b.time === 'ALL_DAY' || b.time.trim() === '' || b.time === timeStr)
  );
}

export function isSlotBooked(dateStr: string, timeStr: string, excludeAppointmentId?: string): boolean {
  const appointments = getAdminAppointments();
  return appointments.some(
    (a) =>
      a.id !== excludeAppointmentId &&
      a.date === dateStr &&
      a.time === timeStr &&
      a.status !== 'cancelled'
  );
}

export function isSlotAvailable(dateStr: string, timeStr: string, excludeAppointmentId?: string): boolean {
  if (isSlotBlocked(dateStr, timeStr)) return false;
  if (isSlotBooked(dateStr, timeStr, excludeAppointmentId)) return false;
  return true;
}

export function getAvailableSlotsForDate(
  dateStr: string,
  excludeAppointmentId?: string
): {
  allSlots: string[];
  freeSlots: string[];
  occupiedSlots: string[];
  blockedSlots: string[];
} {
  const avail = getAvailabilityConfig();
  const allSlots = avail.dailyTimeSlots || DEFAULT_AVAILABILITY_CONFIG.dailyTimeSlots;

  if (isDateBlocked(dateStr)) {
    return {
      allSlots,
      freeSlots: [],
      occupiedSlots: [],
      blockedSlots: [...allSlots]
    };
  }

  const freeSlots: string[] = [];
  const occupiedSlots: string[] = [];
  const blockedSlots: string[] = [];

  allSlots.forEach((slot) => {
    if (isSlotBlocked(dateStr, slot)) {
      blockedSlots.push(slot);
    } else if (isSlotBooked(dateStr, slot, excludeAppointmentId)) {
      occupiedSlots.push(slot);
    } else {
      freeSlots.push(slot);
    }
  });

  return {
    allSlots,
    freeSlots,
    occupiedSlots,
    blockedSlots
  };
}

// ========================
// 2. Forms & Demands Database (Clean, Dynamic from Firestore)
// ========================
export function getDemandForms(): DemandForm[] {
  try {
    const raw = localStorage.getItem(FORMS_STORAGE_KEY);
    let forms: DemandForm[] = raw ? JSON.parse(raw) : [];

    // Filter out any mock entries
    forms = forms.filter((f) => !isMockDemand(f));

    // Check if there are scheduled meetings not yet in forms
    const meetingsRaw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (meetingsRaw) {
      const meetings: MeetingAppointment[] = JSON.parse(meetingsRaw).filter(
        (m: MeetingAppointment) => !isMockMeeting(m)
      );
      let added = false;
      meetings.forEach((m) => {
        const demandId = `demand-from-${m.id}`;
        const hasForm = forms.some(
          (f) => f.id === demandId || (f.name === m.clientName && f.createdAt === m.createdAt)
        );
        if (!hasForm) {
          const diag = m.diagnosticNotes;
          forms.unshift({
            id: demandId,
            createdAt: m.createdAt || new Date().toISOString(),
            name: m.clientName,
            phone: m.clientPhone,
            email: m.clientEmail,
            contactMethod: m.clientPhone ? 'whatsapp' : 'email',
            contactValue: m.clientPhone || m.clientEmail,
            businessDescription:
              diag?.currentChallenges ||
              `[Reunião agendada: ${m.date.split('-').reverse().join('/')} às ${m.time}] ${m.topic || 'Discussão de projeto'}`,
            biggestNeed: m.topic || 'Discussão inicial de projeto sob medida',
            source: 'agendamento',
            origin: 'meeting_booking',
            status:
              m.status === 'confirmed'
                ? 'Reunião Agendada'
                : m.status === 'cancelled'
                ? 'Cancelado'
                : 'Novo',
            businessName: '',
            segment: diag?.businessSegment || '',
            projectStage: 'Reunião agendada via plataforma',
            adminNotes: diag?.recommendedSolution
              ? `Solução: ${diag.recommendedSolution} | Orçamento: ${diag.estimatedBudget || 'A definir'}`
              : `Reunião agendada para ${m.date} às ${m.time}. Meet: ${m.meetLink}`
          });
          added = true;
        }
      });
      if (added) {
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
      }
    }

    return forms;
  } catch (e) {
    console.error('Error loading demand forms', e);
    return [];
  }
}

export const getAllDemandForms = getDemandForms;

export function saveDemandForm(
  formData: Partial<DemandForm> & { name: string }
): DemandForm {
  const forms = getDemandForms();
  const newForm: DemandForm = {
    contactMethod: 'whatsapp',
    contactValue: '',
    biggestNeed: '',
    ...formData,
    id: formData.id || 'form-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: formData.createdAt || new Date().toISOString(),
    status: formData.status || 'Novo'
  };

  const updated = [newForm, ...forms.filter((f) => f.id !== newForm.id)];
  localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(updated));
  saveDemandToFirestore(newForm);
  try {
    fetch('/api/demands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demand: newForm })
    }).catch(() => {});
  } catch {}
  notifyStorageChange();
  return newForm;
}

export function updateDemandForm(
  id: string,
  updates: Partial<DemandForm>
): DemandForm[] {
  const forms = getDemandForms();
  let modifiedItem: DemandForm | null = null;
  const updated = forms.map((item) => {
    if (item.id === id) {
      modifiedItem = { ...item, ...updates };
      return modifiedItem;
    }
    return item;
  });
  localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(updated));
  if (modifiedItem) {
    saveDemandToFirestore(modifiedItem);
  }
  notifyStorageChange();
  return updated;
}

export function deleteDemandForm(id: string): DemandForm[] {
  const forms = getDemandForms();
  const updated = forms.filter((item) => item.id !== id);
  localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(updated));
  deleteDemandFromFirestore(id);
  notifyStorageChange();
  return updated;
}

// ========================
// 3. Appointments & Integrated Meeting Forms (Clean, Dynamic from Firestore)
// ========================
export function getAdminAppointments(): MeetingAppointment[] {
  try {
    const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: MeetingAppointment[] = JSON.parse(raw);
    const cleaned = parsed.filter((m) => !isMockMeeting(m));

    let changed = false;
    const sanitized = cleaned.map((m) => {
      if (!m.meetLink || m.meetLink.includes('beg-4you-meet')) {
        changed = true;
        return { ...m, meetLink: 'https://meet.google.com/fxx-ctnv-hgm' };
      }
      return m;
    });

    if (changed || sanitized.length !== parsed.length) {
      localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (e) {
    console.error('Error loading appointments', e);
    return [];
  }
}

export function saveAppointmentWithDiagnostic(
  appointment: MeetingAppointment
): MeetingAppointment[] {
  const current = getAdminAppointments();
  const existingIdx = current.findIndex((m) => m.id === appointment.id);
  let updated: MeetingAppointment[];

  const diag = appointment.diagnosticNotes || {
    problemDescription: appointment.topic || 'Necessidade inicial levantada no agendamento',
    currentChallenges: appointment.topic || 'Necessidade inicial levantada no agendamento',
    businessSegment: '',
    currentTools: '',
    urgencyLevel: 'media',
    recommendedSolution: '',
    estimatedBudget: '',
    meetingSummary: '',
    nextSteps: '',
    opportunityStatus: 'novo',
    updatedAt: new Date().toISOString()
  };

  const withDiagnostic: MeetingAppointment = {
    ...appointment,
    diagnosticNotes: diag
  };

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = withDiagnostic;
  } else {
    updated = [withDiagnostic, ...current];
  }

  // Synchronize with Demand Forms database
  const demandId = `demand-from-${appointment.id}`;
  const forms = getDemandForms();
  const existingDemand = forms.find((f) => f.id === demandId);

  const statusLabel =
    appointment.status === 'cancelled'
      ? 'Cancelado'
      : diag.opportunityStatus === 'fechado'
      ? 'Concluído'
      : diag.opportunityStatus === 'proposta_enviada'
      ? 'Proposta Enviada'
      : diag.opportunityStatus === 'proposta_elaboracao'
      ? 'Proposta em Elaboração'
      : diag.opportunityStatus === 'reuniao_realizada'
      ? 'Reunião Realizada'
      : 'Reunião Agendada';

  const notesParts = [
    `Reunião: ${appointment.date.split('-').reverse().join('/')} às ${appointment.time}`,
    diag.recommendedSolution ? `Solução: ${diag.recommendedSolution}` : '',
    diag.estimatedBudget ? `Orçamento: ${diag.estimatedBudget}` : '',
    diag.nextSteps ? `Próximos passos: ${diag.nextSteps}` : '',
    diag.meetingSummary ? `Anotações: ${diag.meetingSummary}` : ''
  ].filter(Boolean).join(' | ');

  if (existingDemand) {
    updateDemandForm(demandId, {
      name: appointment.clientName,
      phone: appointment.clientPhone,
      email: appointment.clientEmail,
      contactValue: appointment.clientPhone || appointment.clientEmail,
      businessDescription: diag.currentChallenges || diag.problemDescription || appointment.topic,
      biggestNeed: appointment.topic || existingDemand.biggestNeed,
      status: statusLabel,
      adminNotes: notesParts || existingDemand.adminNotes,
      origin: 'meeting_booking'
    });
  } else {
    saveDemandForm({
      id: demandId,
      name: appointment.clientName,
      phone: appointment.clientPhone,
      email: appointment.clientEmail,
      contactMethod: appointment.clientPhone ? 'whatsapp' : 'email',
      contactValue: appointment.clientPhone || appointment.clientEmail,
      businessDescription: diag.currentChallenges || `[Reunião: ${appointment.date.split('-').reverse().join('/')} às ${appointment.time}] ${appointment.topic || 'Discussão de projeto'}`,
      biggestNeed: `[Reunião: ${appointment.date.split('-').reverse().join('/')} às ${appointment.time}] ${appointment.topic || 'Discussão inicial de projeto'}`,
      source: 'agendamento',
      origin: 'meeting_booking',
      status: statusLabel,
      businessName: '',
      segment: diag.businessSegment || '',
      projectStage: 'Reunião agendada via plataforma',
      adminNotes: notesParts || `Reunião agendada para ${appointment.date} às ${appointment.time}. Sala Meet: ${appointment.meetLink}`
    });
  }

  localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updated));
  saveAppointmentToFirestore(withDiagnostic);
  try {
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment: withDiagnostic })
    }).catch(() => {});
  } catch {}
  notifyStorageChange();
  return updated;
}

export function updateMeetingDiagnostic(
  meetingId: string,
  diagnosticData: Partial<MeetingDiagnosticData>,
  appointmentUpdates?: Partial<MeetingAppointment>
): MeetingAppointment[] {
  const current = getAdminAppointments();
  let modifiedAppt: MeetingAppointment | null = null;
  const updated = current.map((item) => {
    if (item.id === meetingId) {
      modifiedAppt = {
        ...item,
        ...appointmentUpdates,
        updatedAt: new Date().toISOString(),
        diagnosticNotes: {
          ...(item.diagnosticNotes || {}),
          ...diagnosticData,
          updatedAt: new Date().toISOString()
        }
      };
      return modifiedAppt;
    }
    return item;
  });

  localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updated));
  if (modifiedAppt) {
    saveAppointmentToFirestore(modifiedAppt);

    // Also synchronize updated notes to the corresponding demand in Firestore
    const demandId = `demand-from-${meetingId}`;
    const diag = (modifiedAppt as MeetingAppointment).diagnosticNotes;
    const statusLabel =
      (modifiedAppt as MeetingAppointment).status === 'cancelled'
        ? 'Cancelado'
        : diag?.opportunityStatus === 'fechado'
        ? 'Concluído'
        : diag?.opportunityStatus === 'proposta_enviada'
        ? 'Proposta Enviada'
        : diag?.opportunityStatus === 'proposta_elaboracao'
        ? 'Proposta em Elaboração'
        : diag?.opportunityStatus === 'reuniao_realizada'
        ? 'Reunião Realizada'
        : 'Reunião Agendada';

    const notesParts = [
      `Reunião: ${(modifiedAppt as MeetingAppointment).date.split('-').reverse().join('/')} às ${(modifiedAppt as MeetingAppointment).time}`,
      diag?.recommendedSolution ? `Solução: ${diag.recommendedSolution}` : '',
      diag?.estimatedBudget ? `Orçamento: ${diag.estimatedBudget}` : '',
      diag?.nextSteps ? `Próximos passos: ${diag.nextSteps}` : '',
      diag?.meetingSummary ? `Anotações: ${diag.meetingSummary}` : ''
    ].filter(Boolean).join(' | ');

    updateDemandForm(demandId, {
      status: statusLabel,
      adminNotes: notesParts,
      businessDescription: diag?.currentChallenges || diag?.problemDescription || (modifiedAppt as MeetingAppointment).topic
    });
  }
  notifyStorageChange();
  return updated;
}

export function deleteAppointmentInStorage(id: string): MeetingAppointment[] {
  const current = getAdminAppointments();
  const updated = current.filter((m) => m.id !== id);
  localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updated));
  deleteAppointmentFromFirestore(id);

  // Also remove corresponding demand if it exists
  const demandId = `demand-from-${id}`;
  const forms = getDemandForms();
  const remainingForms = forms.filter((f) => f.id !== demandId);
  localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(remainingForms));
  deleteDemandFromFirestore(demandId);

  notifyStorageChange();
  return updated;
}
