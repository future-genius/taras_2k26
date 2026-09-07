export type CheckInResultState =
  | 'VALID'
  | 'ALREADY_CHECKED_IN'
  | 'INVALID_QR'
  | 'NOT_FOUND'
  | 'NOT_AUTHENTICATED'
  | 'DATABASE_ERROR';

export type EventCheckInStatus = 'CHECKED_IN' | 'CANCELLED';

export type EventAttendanceRound = 'ROUND_1' | 'ROUND_2' | 'FINAL';

export type EventLifecycleState =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'LIVE'
  | 'SCORING'
  | 'RESULTS_PENDING'
  | 'RESULTS_PUBLISHED'
  | 'COMPLETED';

export interface EventCheckIn {
  checkInId: string; // e.g. EVCHK-{eventId}-{uid}
  eventId: string;
  eventName: string;
  participantId: string;
  uid: string;
  isTeam: boolean;
  teamId?: string;
  round?: EventAttendanceRound;
  status: EventCheckInStatus;
  checkedInAt: string;
  checkedInByUid: string;
}

export interface ScoreCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight?: number;
}

export type ScorecardStatus = 'DRAFT' | 'SUBMITTED' | 'REOPENED';

export interface Scorecard {
  scorecardId: string; // e.g. SCORE-{eventId}-{targetId}-{judgeUid}
  eventId: string;
  eventName: string;
  targetId: string; // uid for individual event, teamId for team event
  targetName: string;
  isTeam: boolean;
  teamId?: string;
  teamCode?: string;
  judgeUid: string;
  judgeName: string;
  criteria: Record<string, number>; // criterionId -> score (0..maxScore)
  totalScore: number;
  status: ScorecardStatus;
  notes?: string;
  submittedAt?: string;
  submittedByUid?: string;
  reopenedAt?: string;
  reopenedByUid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RankedResultItem {
  targetId: string;
  name: string;
  college: string;
  totalScore: number;
  rank: number;
  achievement?: 'WINNER' | 'RUNNER_UP' | 'FINALIST' | 'SPECIAL_MENTION';
  isTeam?: boolean;
  teamCode?: string;
  teamMembers?: string[];
  notes?: string;
}

export type ResultPublicationStatus = 'DRAFT' | 'PUBLISHED';

export interface EventResult {
  resultId: string; // e.g. RES-{eventId}
  eventId: string;
  eventName: string;
  category: string;
  winner: {
    targetId: string;
    name: string;
    college: string;
    score: number;
    teamCode?: string;
    members?: string[];
  };
  runnerUp: {
    targetId: string;
    name: string;
    college: string;
    score: number;
    teamCode?: string;
    members?: string[];
  };
  specialMention?: {
    targetId: string;
    name: string;
    college: string;
    score: number;
    teamCode?: string;
    members?: string[];
  };
  rankings: RankedResultItem[];
  status: ResultPublicationStatus;
  publishedAt?: string;
  publishedByUid?: string;
  createdAt: string;
  updatedAt: string;
}

export type CertificateStatus = 'PENDING' | 'ELIGIBLE' | 'GENERATED' | 'ISSUED' | 'REVOKED';

export type CertificateType =
  | 'PARTICIPANT'
  | 'WINNER'
  | 'RUNNER_UP'
  | 'FINALIST'
  | 'VOLUNTEER'
  | 'COORDINATOR'
  | 'MERIT'
  | 'PARTICIPATION'
  | 'ORGANIZER';

export interface CertificateRecord {
  certId: string; // e.g. TARAS26-CERT-89A4B2
  participantId: string;
  uid: string;
  fullName: string;
  college: string;
  eventId?: string;
  eventName?: string;
  achievement: string; // e.g. "WINNER", "RUNNER UP", "FINALIST", "PARTICIPANT", "VOLUNTEER", "COORDINATOR"
  certificateType: CertificateType;
  status: CertificateStatus;
  issueDate: string;
  issuedByUid: string;
  verificationCode: string; // Unique alphanumeric code
  verificationUrl: string;
  filePath?: string;
}

export type AuditAction =
  | 'VENUE_CHECK_IN'
  | 'EVENT_CHECK_IN'
  | 'ATTENDANCE_UPDATED'
  | 'SCORE_SUBMITTED'
  | 'SCORE_REOPENED'
  | 'SHORTLIST_UPDATED'
  | 'RESULT_CREATED'
  | 'RESULT_PUBLISHED'
  | 'CERTIFICATE_ISSUED'
  | 'CERTIFICATE_REVOKED'
  | 'CERTIFICATE_DOWNLOADED'
  | 'BULK_CERTIFICATES_GENERATED'
  | 'BULK_EMAIL_SENT'
  | 'BULK_EMAIL_RETRIED'
  | 'SUPER_ADMIN_CREATED_ADMIN'
  | 'SUPER_ADMIN_DISABLED_ADMIN'
  | 'SUPER_ADMIN_CREATED_EVENT_HEAD'
  | 'SUPER_ADMIN_UPDATED_EVENT_ASSIGNMENT'
  | 'SUPER_ADMIN_CREATED_STAFF'
  | 'SUPER_ADMIN_CHANGED_ROLE'
  | 'SUPER_ADMIN_GLOBAL_REGISTRATION_FREEZE'
  | 'SUPER_ADMIN_EMERGENCY_BROADCAST'
  | 'SUPER_ADMIN_DIAGNOSTIC_RESYNC';

export interface AuditLog {
  logId: string;
  action: AuditAction;
  actorUid: string;
  actorRole: string;
  targetUid?: string;
  targetParticipantId?: string;
  eventId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
