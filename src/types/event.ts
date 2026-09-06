export type EventCategory = 'TECHNICAL' | 'NON-TECHNICAL' | 'WORKSHOP' | 'INDIVIDUAL' | 'TEAM';

export type EventStatus = 'UPCOMING' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'LIVE' | 'COMPLETED';

export interface EventRound {
  number: number;
  name: string;
  description: string;
  duration: string;
  venue?: string;
  time?: string;
}

export interface EventCoordinator {
  name: string;
  role: 'Faculty Coordinator' | 'Student Event Head' | 'Co-head' | 'Internal Coordinator' | 'External Coordinator' | string;
  phone?: string;
  email?: string;
  department?: string;
}

export interface EventPrize {
  position: '1st' | '2nd' | '3rd' | 'Special Mention';
  amount: string;
  perks?: string[];
}

export interface TARASEvent {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  theme: string;
  category: EventCategory;
  type: 'INDIVIDUAL' | 'TEAM' | 'BOTH';
  minTeamSize: number;
  maxTeamSize: number;
  duration: string;
  venue: string;
  schedule: string;
  eligibility: string[];
  about: string;
  rounds: EventRound[];
  rules: string[];
  evaluationCriteria: string[];
  requirements: string[];
  prizes: EventPrize[];
  coordinators: EventCoordinator[];
  faq: { question: string; answer: string }[];
  status: EventStatus;
  bannerImage?: string;
  registrationFee?: string;
  maxRegistrations?: number;
}
