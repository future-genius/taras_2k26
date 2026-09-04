/**
 * TARAS 2K26 — Automated Bulk Email Communications Types
 */

export type AudienceFilterType = 
  | 'ALL_PARTICIPANTS'
  | 'EVENT_PARTICIPANTS'
  | 'YEAR'
  | 'SECTION'
  | 'ROLE'
  | 'STAFF'
  | 'TARAS_MEMBERS'
  | 'CUSTOM_COMBINED';

export interface AudienceFilter {
  type: AudienceFilterType;
  eventId?: string;
  year?: string;
  section?: string;
  role?: string;
  department?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'REGISTRATION' | 'REMINDER' | 'INSTRUCTION' | 'SCHEDULE' | 'ANNOUNCEMENT' | 'CANCELLATION' | 'RESULT' | 'CERTIFICATE';
  description: string;
}

export interface RecipientLog {
  email: string;
  name: string;
  uid?: string;
  status: 'SENT' | 'FAILED';
  error?: string;
  timestamp: string;
}

export interface EmailJob {
  emailJobId: string;
  templateId?: string;
  subject: string;
  body: string;
  audienceDescription: string;
  audienceFilter: AudienceFilter;
  createdBy: string;
  createdAt: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  completedAt?: string;
  recipientLogs?: RecipientLog[];
}
