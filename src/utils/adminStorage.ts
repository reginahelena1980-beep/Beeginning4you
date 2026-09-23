import { ContactConfig, DemandForm, MeetingAppointment, MeetingDiagnosticData } from '../types';
import {
  saveContactConfigToFirestore,
  subscribeContactConfigFromFirestore,
  saveDemandToFirestore,
  deleteDemandFromFirestore,
  subscribeDemandsFromFirestore,
  saveAppointmentToFirestore,
  deleteAppointmentFromFirestore,
  subscribeAppointmentsFromFirestore
} from '../firebase';

export const DEFAULT_CONTACT_CONFIG: ContactConfig = {
  whatsappNumber: '5511999999999',
  whatsappDisplay: '(11) 99999-9999',
  whatsappMessage: 'Olá! Vim pelo site da Beeginning 4 you e gostaria de conversar sobre uma ideia de negócio.',
  email: 'contato@beeginning4you.com.br',
  meetUrl: 'https://meet.google.com/fxx-ctnv-hgm',
  fixedMeetUrl: 'https://meet.google.com/fxx-ctnv-hgm',
  businessHours: 'Segunda a Sexta das 08h30 às 18h30',
  adminPassword: 'bee2026',
  adminPasswordHash: 'bee2026',
  profilePhotoUrl: '',
};

const CONFIG_STORAGE_KEY = 'beeginning_contact_config_v1';
const FORMS_STORAGE_KEY = 'beeginning_demand_forms_v1';
const MEETINGS_STORAGE_KEY = 'beeginning_scheduled_meetings_v1';
export const STORAGE_CHANGE_EVENT = 'beeginning_storage_updated';

function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
  }
}

// Initialise Firebase real-time listeners to sync across all devices
if (typeof window !== 'undefined') {
  subscribeContactConfigFromFirestore((remoteConfig) => {
    if (remoteConfig && Object.keys(remoteConfig).length > 0) {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(remoteConfig));
      notifyStorageChange();
    }
  });

  subscribeDemandsFromFirestore((remoteDemands) => {
    if (remoteDemands && remoteDemands.length > 0) {
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(remoteDemands));
      notifyStorageChange();
    }
  });

  subscribeAppointmentsFromFirestore((remoteAppointments) => {
    if (remoteAppointments && remoteAppointments.length > 0) {
      localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(remoteAppointments));
      notifyStorageChange();
    }
  });
}

// ========================
// 1. Contact Configuration
// ========================
export function getContactConfig(): ContactConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTACT_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed.meetUrl || parsed.meetUrl.includes('beg-4you-meet')) {
      parsed.meetUrl = 'https://meet.google.com/fxx-ctnv-hgm';
    }
    if (!parsed.fixedMeetUrl || parsed.fixedMeetUrl.includes('beg-4you-meet')) {
      parsed.fixedMeetUrl = 'https://meet.google.com/fxx-ctnv-hgm';
    }
    return { ...DEFAULT_CONTACT_CONFIG, ...parsed };
  } catch (e) {
    console.error('Error loading contact config', e);
    return DEFAULT_CONTACT_CONFIG;
  }
}

export function saveContactConfig(config: ContactConfig): ContactConfig {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    saveContactConfigToFirestore(config);
    notifyStorageChange();
  } catch (e) {
    console.error('Error saving contact config', e);
  }
  return config;
}

// ========================
// 2. Forms & Demands Database
// ========================
const SAMPLE_FORMS: DemandForm[] = [
  {
    id: 'form-sample-1',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    name: 'Mariana Duarte',
    businessName: 'Ateliê Flora Aromas',
    segment: 'Comércio / Cosméticos Artesanais',
    contactMethod: 'whatsapp',
    contactValue: '(11) 98765-4321',
    phone: '(11) 98765-4321',
    email: 'mariana@floraaromas.com.br',
    biggestNeed: 'Preciso calcular o preço de venda dos meus óleos essenciais e kits de presente sem ficar no prejuízo, além de organizar os pedidos que chegam pelo WhatsApp.',
    businessDescription: 'Preciso calcular o preço de venda dos meus óleos essenciais e kits de presente sem ficar no prejuízo, além de organizar os pedidos que chegam pelo WhatsApp.',
    projectStage: 'Já vendo mas sinto que estou pagando para trabalhar',
    source: 'diagnostico_rapido',
    origin: 'diagnostic_pedir',
    status: 'Novo',
    adminNotes: 'Interesse imediato em calculadora inteligente de precificação e catálogo no WhatsApp.'
  },
  {
    id: 'form-sample-2',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    name: 'Carlos Alberto Lima',
    businessName: 'Lima Manutenção Elétrica',
    segment: 'Prestação de Serviços',
    contactMethod: 'whatsapp',
    contactValue: '(11) 97123-9988',
    phone: '(11) 97123-9988',
    email: 'carlos@limaeletrica.com.br',
    biggestNeed: 'Controle de fluxo de caixa e envio de orçamentos rápidos em PDF para clientes de condomínios.',
    businessDescription: 'Controle de fluxo de caixa e envio de orçamentos rápidos em PDF para clientes de condomínios.',
    projectStage: 'Quero profissionalizar meus orçamentos',
    source: 'formulario_contato',
    origin: 'formulario_contato',
    status: 'Em Análise',
    adminNotes: 'Combinar reunião para demonstrar painel financeiro descomplicado.'
  }
];

export function getDemandForms(): DemandForm[] {
  try {
    const raw = localStorage.getItem(FORMS_STORAGE_KEY);
    let forms: DemandForm[] = raw ? JSON.parse(raw) : [...SAMPLE_FORMS];

    // Check if there are scheduled meetings not yet in forms
    const meetingsRaw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (meetingsRaw) {
      const meetings: MeetingAppointment[] = JSON.parse(meetingsRaw);
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

    if (!raw && forms.length > 0) {
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
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

  const updated = [newForm, ...forms];
  localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(updated));
  saveDemandToFirestore(newForm);
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
// 3. Appointments & Integrated Meeting Forms
// ========================
const SAMPLE_MEETINGS: MeetingAppointment[] = [
  {
    id: 'meet-sample-1',
    clientName: 'Carla Vasconcelos',
    clientEmail: 'carla@vasconcelosdoces.com.br',
    clientPhone: '(11) 98888-2233',
    topic: 'Implantação de Cálculo de Preço Inteligente e Catálogo Digital',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    time: '14:00',
    durationMinutes: 45,
    meetLink: 'https://meet.google.com/fxx-ctnv-hgm',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    confidentialityAccepted: true,
    diagnosticNotes: {
      problemDescription: 'Trabalha 14 horas por dia confeitando bolos e doces finos, mas não sabe a margem líquida real de cada bolo. Perde pedidos no WhatsApp por demora em passar orçamento.',
      businessSegment: 'Confeitaria Artesanal de Alto Padrão',
      currentTools: 'Caderno espiral e calculadora do celular; anotações avulsas no WhatsApp.',
      urgencyLevel: 'alta',
      recommendedSolution: 'Calculadora de Precificação Dinâmica (insumos + horas trabalhadas) + Catálogo digital enxuto.',
      estimatedBudget: 'R$ 1.800 a R$ 2.400',
      meetingSummary: 'Cliente muito receptiva. Já enviou tabela de ingredientes principais para montagem do protótipo.',
      nextSteps: 'Apresentar protótipo navegável na quinta-feira às 14h.',
      opportunityStatus: 'proposta_enviada'
    }
  }
];

export function getAdminAppointments(): MeetingAppointment[] {
  try {
    const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(SAMPLE_MEETINGS));
      return SAMPLE_MEETINGS;
    }
    const parsed: MeetingAppointment[] = JSON.parse(raw);
    let changed = false;
    const sanitized = parsed.map((m) => {
      if (!m.meetLink || m.meetLink.includes('beg-4you-meet')) {
        changed = true;
        return { ...m, meetLink: 'https://meet.google.com/fxx-ctnv-hgm' };
      }
      return m;
    });
    if (changed) {
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
