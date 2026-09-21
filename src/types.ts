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
