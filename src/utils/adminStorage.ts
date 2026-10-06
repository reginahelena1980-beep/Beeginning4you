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
  profilePhotoUrl: '',
  availability: DEFAULT_AVAILABILITY_CONFIG
};

const CONFIG_STORAGE_KEY = 'beeginning_contact_config_v1';
const FORMS_STORAGE_KEY = 'beeginning_demand_forms_v1';
const MEETINGS_STORAGE_KEY = 'beeginning_scheduled_meetings_v1';
export const STORAGE_CHANGE_EVENT = 'beeginning_storage_updated';

// In-memory CRM data storage (restricted to authenticated admin sessions only)
let inMemoryDemands: DemandForm[] = [];
let inMemoryAppointments: MeetingAppointment[] = [];
let inMemoryBookedSlots: Array<{ date: string; time: string }> = [];

let unsubscribeDemands: (() => void) | null = null;
let unsubscribeAppointments: (() => void) | null = null;

export function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
  }
}

/**
 * Remove any sensitive CRM data lingering in client browser localStorage
 * Ensures public visitors never keep other clients' information.
 */
export function purgeSensitiveCrmFromLocalStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(FORMS_STORAGE_KEY);
    localStorage.removeItem(MEETINGS_STORAGE_KEY);
    
    // Also clean up any lingering passwords from config in localStorage
    const configRaw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (configRaw) {
      const parsed = JSON.parse(configRaw);
      delete parsed.adminPassword;
      delete parsed.adminPasswordHash;
      delete parsed.gmailAppPassword;
      delete parsed.whatsappGatewayUrl;
      delete parsed.whatsappGatewayToken;
      const sanitized = sanitizeContactConfig(parsed);
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
    }
  } catch (err) {
    console.warn('[Security] Could not purge legacy sensitive storage', err);
  }
}

/**
 * Anonymized booked slots engine for public availability check
 * Contains strictly { date, time } pairs with ZERO PII (no names, emails, phones or topics).
 */
export async function refreshBookedSlots(): Promise<Array<{ date: string; time: string }>> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/booked-slots');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.bookedSlots)) {
        inMemoryBookedSlots = data.bookedSlots;
        notifyStorageChange();
        return inMemoryBookedSlots;
      }
    }
  } catch {}
  return inMemoryBookedSlots;
}

export function getBookedSlots(): Array<{ date: string; time: string }> {
  return inMemoryBookedSlots;
}

// Public Initialisation: Load public config and anonymized slot availability ONLY
if (typeof window !== 'undefined') {
  purgeSensitiveCrmFromLocalStorage();

  // 1. Fetch sanitized public configuration from backend API
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

  // 2. Fetch public configuration from Firestore
  fetchContactConfigFromFirestore().then((remoteConfig) => {
    if (remoteConfig && Object.keys(remoteConfig).length > 0) {
      const sanitized = sanitizeContactConfig(remoteConfig);
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
      notifyStorageChange();
    }
  }).catch(() => {});

  // 3. Real-time listener for public contact configuration
  subscribeContactConfigFromFirestore((remoteConfig) => {
    if (remoteConfig && Object.keys(remoteConfig).length > 0) {
      const sanitized = sanitizeContactConfig(remoteConfig);
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
      notifyStorageChange();
    }
  });

  // 4. Fetch anonymized booked slots for availability checking (NO CLIENT DATA)
  refreshBookedSlots();
}

/**
 * Authenticated Admin CRM Loader
 * Called ONLY when the administrator is authenticated via Firebase Authentication.
 */
export async function loadAdminCrmData(idToken?: string): Promise<{
  demands: DemandForm[];
  appointments: MeetingAppointment[];
}> {
  try {
    const headers: Record<string, string> = {};
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    // 1. Fetch from protected backend API if token is provided
    if (idToken) {
      try {
        const [apptsRes, demandsRes] = await Promise.all([
          fetch('/api/appointments', { headers }),
          fetch('/api/demands', { headers })
        ]);
        if (apptsRes.ok) {
          const apptsData = await apptsRes.json();
          if (Array.isArray(apptsData?.appointments)) {
            inMemoryAppointments = apptsData.appointments;
          }
        }
        if (demandsRes.ok) {
          const demandsData = await demandsRes.json();
          if (Array.isArray(demandsData?.demands)) {
            inMemoryDemands = demandsData.demands;
          }
        }
      } catch (apiErr) {
        console.warn('[Admin CRM] Fallback to direct Firestore fetch:', apiErr);
      }
    }

    // 2. Direct Firestore fetch
    const [remoteDemands, remoteAppointments] = await Promise.all([
      fetchDemandsFromFirestore().catch(() => []),
      fetchAppointmentsFromFirestore().catch(() => [])
    ]);

    if (Array.isArray(remoteDemands) && remoteDemands.length > 0) {
      inMemoryDemands = remoteDemands;
    }
    if (Array.isArray(remoteAppointments) && remoteAppointments.length > 0) {
      inMemoryAppointments = remoteAppointments;
    }

    // 3. Attach authenticated Firestore real-time listeners
    if (unsubscribeDemands) unsubscribeDemands();
    if (unsubscribeAppointments) unsubscribeAppointments();

    unsubscribeDemands = subscribeDemandsFromFirestore((updatedDemands) => {
      inMemoryDemands = updatedDemands;
      notifyStorageChange();
    });

    unsubscribeAppointments = subscribeAppointmentsFromFirestore((updatedAppts) => {
      inMemoryAppointments = updatedAppts;
      notifyStorageChange();
    });

    notifyStorageChange();
    return { demands: inMemoryDemands, appointments: inMemoryAppointments };
  } catch (err) {
    console.error('[Admin CRM] Error loading administrative CRM data:', err);
    return { demands: [], appointments: [] };
  }
}

/**
 * Authenticated Admin CRM Cleanup
 * Called when administrator logs out.
 */
export function clearAdminCrmData() {
  if (unsubscribeDemands) {
    unsubscribeDemands();
    unsubscribeDemands = null;
  }
  if (unsubscribeAppointments) {
    unsubscribeAppointments();
    unsubscribeAppointments = null;
  }
  inMemoryDemands = [];
  inMemoryAppointments = [];
  purgeSensitiveCrmFromLocalStorage();
  notifyStorageChange();
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

  // Strip any accidental password fields
  delete (merged as any).adminPassword;
  delete (merged as any).adminPasswordHash;

  const rawWa = (merged.whatsappNumber || '').replace(/\D/g, '');
  const rawDisplay = merged.whatsappDisplay || '';

  if (!rawWa || rawWa.includes('99999') || rawDisplay.includes('99999') || rawWa === '5511987654321' || !rawWa.includes('98629')) {
    merged.whatsappNumber = '5511986297916';
    merged.whatsappDisplay = '(11) 98629-7916';
  } else {
    merged.whatsappDisplay = formatWhatsAppDisplay(merged.whatsappNumber);
  }

  if (!merged.email || merged.email.includes('example.com') || merged.email === 'contato@beeginning4you.com.br') {
    merged.email = 'beeginning4you@gmail.com';
  }

  if (!merged.meetUrl || merged.meetUrl.includes('beg-4you-meet')) {
    merged.meetUrl = 'https://meet.google.com/fxx-ctnv-hgm';
  }
  if (!merged.fixedMeetUrl || merged.fixedMeetUrl.includes('beg-4you-meet')) {
    merged.fixedMeetUrl = 'https://meet.google.com/fxx-ctnv-hgm';
  }

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
    return sanitized;
  } catch (e) {
    console.error('Error loading contact config', e);
    return DEFAULT_CONTACT_CONFIG;
  }
}

export function saveContactConfig(config: ContactConfig, idToken?: string): ContactConfig {
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
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
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

export function saveAvailabilityConfig(avail: Partial<AdminAvailabilityConfig>, idToken?: string): AdminAvailabilityConfig {
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
  saveContactConfig(updatedConfig, idToken);
  return updatedAvail;
}

export function addBlockedSlot(block: { date: string; time?: string; reason?: string }, idToken?: string): BlockedSlot {
  const currentAvail = getAvailabilityConfig();
  const newBlock: BlockedSlot = {
    id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: block.date,
    time: block.time || '',
    reason: block.reason || 'Compromisso externo / Folga',
    createdAt: new Date().toISOString()
  };
  const updatedBlocked = [newBlock, ...(currentAvail.blockedSlots || [])];
  saveAvailabilityConfig({ blockedSlots: updatedBlocked }, idToken);
  return newBlock;
}

export function removeBlockedSlot(blockId: string, idToken?: string): void {
  const currentAvail = getAvailabilityConfig();
  const updatedBlocked = (currentAvail.blockedSlots || []).filter((b) => b.id !== blockId);
  saveAvailabilityConfig({ blockedSlots: updatedBlocked }, idToken);
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

/**
 * Privacy-safe booked slot checker:
 * In authenticated admin view: checks inMemoryAppointments.
 * In public visitor view: checks inMemoryBookedSlots (which contains only { date, time } with zero PII).
 */
export function isSlotBooked(dateStr: string, timeStr: string, excludeAppointmentId?: string): boolean {
  if (inMemoryAppointments.length > 0) {
    return inMemoryAppointments.some(
      (a) =>
        a.id !== excludeAppointmentId &&
        a.date === dateStr &&
        a.time === timeStr &&
        a.status !== 'cancelled'
    );
  }
  return inMemoryBookedSlots.some(
    (slot) => slot.date === dateStr && slot.time === timeStr
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
// 2. Forms & Demands Database
// ========================
export function getDemandForms(): DemandForm[] {
  return inMemoryDemands;
}

export const getAllDemandForms = getDemandForms;

export function saveDemandForm(
  formData: Partial<DemandForm> & { name: string }
): DemandForm {
  const newForm: DemandForm = {
    contactMethod: 'whatsapp',
    contactValue: '',
    biggestNeed: '',
    ...formData,
    id: formData.id || 'form-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: formData.createdAt || new Date().toISOString(),
    status: formData.status || 'Novo'
  };

  // If in admin session, keep in-memory demands updated
  if (inMemoryDemands.length > 0) {
    inMemoryDemands = [newForm, ...inMemoryDemands.filter((f) => f.id !== newForm.id)];
  }

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
  let modifiedItem: DemandForm | null = null;
  inMemoryDemands = inMemoryDemands.map((item) => {
    if (item.id === id) {
      modifiedItem = { ...item, ...updates };
      return modifiedItem;
    }
    return item;
  });
  if (modifiedItem) {
    saveDemandToFirestore(modifiedItem);
  }
  notifyStorageChange();
  return inMemoryDemands;
}

export function deleteDemandForm(id: string): DemandForm[] {
  inMemoryDemands = inMemoryDemands.filter((item) => item.id !== id);
  deleteDemandFromFirestore(id);
  notifyStorageChange();
  return inMemoryDemands;
}

// ========================
// 3. Appointments & Integrated Meeting Forms
// ========================
export function getAdminAppointments(): MeetingAppointment[] {
  return inMemoryAppointments;
}

export function saveAppointmentWithDiagnostic(
  appointment: MeetingAppointment
): MeetingAppointment[] {
  const existingIdx = inMemoryAppointments.findIndex((m) => m.id === appointment.id);

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

  if (inMemoryAppointments.length > 0) {
    if (existingIdx >= 0) {
      inMemoryAppointments[existingIdx] = withDiagnostic;
    } else {
      inMemoryAppointments.unshift(withDiagnostic);
    }
  }

  // Update privacy-safe inMemoryBookedSlots immediately
  if (withDiagnostic.status !== 'cancelled' && withDiagnostic.date && withDiagnostic.time) {
    const exists = inMemoryBookedSlots.some((s) => s.date === withDiagnostic.date && s.time === withDiagnostic.time);
    if (!exists) {
      inMemoryBookedSlots.push({ date: withDiagnostic.date, time: withDiagnostic.time });
    }
  }

  saveAppointmentToFirestore(withDiagnostic);
  try {
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment: withDiagnostic })
    }).catch(() => {});
  } catch {}

  notifyStorageChange();
  return inMemoryAppointments;
}

export function updateMeetingDiagnostic(
  meetingId: string,
  diagnosticData: Partial<MeetingDiagnosticData>,
  appointmentUpdates?: Partial<MeetingAppointment>
): MeetingAppointment[] {
  let modifiedAppt: MeetingAppointment | null = null;
  inMemoryAppointments = inMemoryAppointments.map((item) => {
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

  if (modifiedAppt) {
    saveAppointmentToFirestore(modifiedAppt);
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
  return inMemoryAppointments;
}

export function deleteAppointmentInStorage(id: string): MeetingAppointment[] {
  inMemoryAppointments = inMemoryAppointments.filter((m) => m.id !== id);
  deleteAppointmentFromFirestore(id);
  const demandId = `demand-from-${id}`;
  deleteDemandForm(demandId);
  notifyStorageChange();
  return inMemoryAppointments;
}
