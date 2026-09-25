export interface NavItem {
  label: string;
  href: string;
}

export interface PhilosophyStep {
  id: string;
  number: string;
  title: string;
  tagline: string;
  quote: string;
  description: string;
  practicalExample: string;
  iconName: string;
  deliverables: string[];
}

export interface SolutionItem {
  id: string;
  title: string;
  shortDesc: string;
  badge: string;
  iconName: string;
  practicalPain: string;
  ourSolution: string;
  features: string[];
  estimatedDelivery: string;
  idealFor: string;
}

export interface RealProjectExample {
  id: string;
  title: string;
  badge: string;
  iconName: string;
  tagline: string;
  challenge: string;
  solution: string;
  highlights: string[];
  resultsNote: string;
}

export interface AudienceProfile {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  commonStruggle: string;
  solutionOutcome: string;
  highlightTag: string;
}

export interface UseCaseStory {
  id: string;
  clientName: string;
  businessName: string;
  segment: string;
  before: string;
  after: string;
  quote: string;
  metric: string;
}

export interface DiagnosticOption {
  id: string;
  title: string;
  description: string;
  recommendedSolution: string;
  iconName: string;
}

export interface ContactFormData {
  name: string;
  businessName: string;
  segment: string;
  contactMethod: 'whatsapp' | 'email';
  contactValue: string;
  biggestNeed: string;
  projectStage: string;
}

export interface MeetingDiagnosticData {
  businessType?: string;
  problemDescription?: string;
  businessSegment?: string;
  currentTools?: string;
  currentChallenges?: string;
  urgencyLevel?: 'baixa' | 'media' | 'alta' | 'imediata';
  recommendedSolution?: string;
  estimatedBudget?: string;
  meetingSummary?: string;
  nextSteps?: string;
  opportunityStatus?: 'novo' | 'reuniao_realizada' | 'proposta_elaboracao' | 'proposta_enviada' | 'negociacao' | 'fechado' | 'arquivado';
  updatedAt?: string;
}

export interface MeetingAppointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  topic: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  meetLink: string;
  status: 'confirmed' | 'rescheduled' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  confidentialityAccepted: boolean;
  diagnosticNotes?: MeetingDiagnosticData;
  history?: Array<{
    date: string;
    action: string;
  }>;
}

export interface DemandForm {
  id: string;
  createdAt: string;
  name: string;
  businessName?: string;
  segment?: string;
  contactMethod?: 'whatsapp' | 'email';
  contactValue?: string;
  biggestNeed?: string;
  projectStage?: string;
  source?: 'diagnostico_rapido' | 'formulario_contato' | 'agendamento' | 'whatsapp_modal' | string;
  status: 'Novo' | 'Em Análise' | 'Reunião Marcada' | 'Proposta Enviada' | 'Concluído' | string;
  adminNotes?: string;
  email?: string;
  phone?: string;
  notes?: string;
  businessDescription?: string;
  mainGoal?: string;
  urgency?: string;
  origin?: string;
}

export interface BlockedSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm or empty/ALL_DAY for full day
  reason?: string;
  createdAt: string;
}

export interface AdminAvailabilityConfig {
  activeDaysOfWeek: number[]; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado. Default: [1, 2, 3, 4, 5]
  dailyTimeSlots: string[]; // e.g. ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
  slotDurationMinutes: number; // default 45
  blockedSlots: BlockedSlot[]; // manual blocks
  updatedAt?: string;
}

export interface ContactConfig {
  whatsappNumber: string; // Clean number for wa.me e.g. 5511999999999
  whatsappDisplay: string; // Formatted e.g. (11) 99999-9999
  whatsappMessage: string;
  email: string;
  meetUrl: string;
  fixedMeetUrl?: string;
  businessHours: string;
  adminPassword?: string;
  adminPasswordHash: string; // Simple password comparison
  profilePhotoUrl?: string; // Custom profile photo for Regina
  gmailAppPassword?: string; // Senha de Aplicativo do Gmail (16 caracteres) para disparo automático
  whatsappGatewayUrl?: string; // URL do Gateway de WhatsApp para disparo direto (opcional)
  whatsappGatewayToken?: string; // Token do Gateway de WhatsApp (opcional)
  availability?: AdminAvailabilityConfig; // Gestão de disponibilidade e bloqueios de horários
}
