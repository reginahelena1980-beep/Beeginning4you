import { ContactConfig, DemandForm, MeetingAppointment, MeetingDiagnosticData } from '../types';

export const DEFAULT_CONTACT_CONFIG: ContactConfig = {
  whatsappNumber: '5511999999999',
  whatsappDisplay: '(11) 99999-9999',
  whatsappMessage: 'Olá! Vim pelo site da Beeginning 4 you e gostaria de conversar sobre uma ideia de negócio.',
  email: 'contato@beeginning4you.com.br',
  meetUrl: 'https://meet.google.com/beg-4you-meet',
  fixedMeetUrl: 'https://meet.google.com/beg-4you-meet',
  businessHours: 'Segunda a Sexta das 08h30 às 18h30',
  adminPassword: 'bee2026',
  adminPasswordHash: 'bee2026',
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

// ========================
// 1. Contact Configuration
// ========================
export function getContactConfig(): ContactConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTACT_CONFIG;
    return { ...DEFAULT_CONTACT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading contact config', e);
    return DEFAULT_CONTACT_CONFIG;
  }
}

export function saveContactConfig(config: ContactConfig): ContactConfig {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
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
    biggestNeed: 'Preciso calcular o preço de venda dos meus óleos essenciais e kits de presente sem ficar no prejuízo, além de organizar os pedidos que chegam pelo WhatsApp.',
    projectStage: 'Já vendo mas sinto que estou pagando para trabalhar',
    source: 'diagnostico_rapido',
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
    biggestNeed: 'Controle de fluxo de caixa e envio de orçamentos rápidos em PDF para clientes de condomínios.',
    projectStage: 'Quero profissionalizar meus orçamentos',
    source: 'formulario_contato',
    status: 'Em Análise',
    adminNotes: 'Combinar reunião para demonstrar painel financeiro descomplicado.'
  }
];

export function getDemandForms(): DemandForm[] {
  try {
    const raw = localStorage.getItem(FORMS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(SAMPLE_FORMS));
      return SAMPLE_FORMS;
    }
    return JSON.parse(raw);
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
  notifyStorageChange();
  return newForm;
}

export function updateDemandForm(
  id: string,
  updates: Partial<DemandForm>
): DemandForm[] {
  const forms = getDemandForms();
  const updated = forms.map((item) => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    return item;
  });
  localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(updated));
  notifyStorageChange();
  return updated;
}

export function deleteDemandForm(id: string): DemandForm[] {
  const forms = getDemandForms();
  const updated = forms.filter((item) => item.id !== id);
  localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(updated));
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
    meetLink: 'https://meet.google.com/beg-4you-meet',
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
    return JSON.parse(raw);
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

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = appointment;
  } else {
    // If not existing, initialize diagnostic notes with customer's input
    const withDiagnostic: MeetingAppointment = {
      ...appointment,
      diagnosticNotes: appointment.diagnosticNotes || {
        problemDescription: appointment.topic || 'Necessidade inicial levantada no agendamento',
        businessSegment: '',
        currentTools: '',
        urgencyLevel: 'media',
        recommendedSolution: '',
        estimatedBudget: '',
        meetingSummary: '',
        nextSteps: '',
        opportunityStatus: 'novo',
        updatedAt: new Date().toISOString()
      }
    };
    updated = [withDiagnostic, ...current];

    // Also automatically create an entry in the Demand Forms database!
    saveDemandForm({
      name: appointment.clientName,
      contactMethod: appointment.clientPhone ? 'whatsapp' : 'email',
      contactValue: appointment.clientPhone || appointment.clientEmail,
      biggestNeed: `[Agendamento de Reunião para ${appointment.date} às ${appointment.time}] ${appointment.topic || 'Discussão inicial de projeto sob medida'}`,
      source: 'agendamento',
      businessName: '',
      segment: '',
      projectStage: 'Reunião agendada via plataforma',
      adminNotes: `Reunião agendada para ${appointment.date} às ${appointment.time}. Meet: ${appointment.meetLink}`
    });
  }

  localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updated));
  notifyStorageChange();
  return updated;
}

export function updateMeetingDiagnostic(
  meetingId: string,
  diagnosticData: Partial<MeetingDiagnosticData>,
  appointmentUpdates?: Partial<MeetingAppointment>
): MeetingAppointment[] {
  const current = getAdminAppointments();
  const updated = current.map((item) => {
    if (item.id === meetingId) {
      return {
        ...item,
        ...appointmentUpdates,
        updatedAt: new Date().toISOString(),
        diagnosticNotes: {
          ...(item.diagnosticNotes || {}),
          ...diagnosticData,
          updatedAt: new Date().toISOString()
        }
      };
    }
    return item;
  });

  localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updated));
  notifyStorageChange();
  return updated;
}

export function deleteAppointmentInStorage(id: string): MeetingAppointment[] {
  const current = getAdminAppointments();
  const updated = current.filter((m) => m.id !== id);
  localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updated));
  notifyStorageChange();
  return updated;
}
