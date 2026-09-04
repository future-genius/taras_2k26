import type { EventAttendanceStatus, VenuePresenceStatus } from './participant';

export interface RegistrationScanRecord {
  id: string;
  participantId: string;
  scannedByDeskUserId: string;
  timestamp: string;
  venueStatusConfirmed: VenuePresenceStatus;
  deskLocation: string;
}

export interface EventAttendanceRecord {
  id: string;
  eventId: string;
  participantId: string;
  markedByCoordinatorUid: string;
  timestamp: string;
  attendanceStatus: EventAttendanceStatus;
  requiresVenuePresenceCheck: boolean; // Enforces venue presence = CONFIRMED prerequisite
}

export interface CertificateJob {
  id: string;
  participantId: string;
  eventId: string;
  certificateType: 'PARTICIPATION' | 'WINNER' | 'RUNNER_UP' | 'SPECIAL_MENTION';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  downloadUrl?: string;
  generatedAt?: string;
}
