export type UserRole =
  | 'super_admin'   // TARAS 2K26 President — highest authority
  | 'admin'
  | 'staff'
  | 'registration_staff'
  | 'coordinator'
  | 'participant'
  | 'PRESIDENT'           // legacy alias — treated as super_admin if found
  | 'REGISTRATION_TEAM'  // legacy alias for staff
  | 'EVENT_HEAD'         // legacy alias for coordinator
  | 'PARTICIPANT';        // legacy alias for participant


export type VenueCheckInStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN';
export type VenuePresenceStatus = 'NOT_ARRIVED' | 'CONFIRMED';
export type EventAttendanceStatus = 'NOT_MARKED' | 'PRESENT' | 'ABSENT';
export type CertificateStatus = 'PENDING' | 'PROCESSING' | 'READY';
export type ShortlistStatus = 'NOT_EVALUATED' | 'UNDER_EVALUATION' | 'SHORTLISTED' | 'NOT_SHORTLISTED' | 'FINALIST' | 'WINNER';

export interface ParticipantProfile {
  uid: string;
  participantId: string; // e.g. TARAS26-89420194
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: 'I' | 'II' | 'III' | 'IV' | 'PG';
  section?: string;
  registrationNumber?: string;
  profilePhoto?: string;
  role: UserRole;
  assignedEventIds?: string[]; // Coordinator explicit event assignments
  qrToken: string; // Secure unique lookup verification token
  venueCheckIn: boolean; // MUST be true before event attendance can be present
  venueCheckInStatus: VenueCheckInStatus;
  venueCheckInTimestamp?: string;
  registeredEvents: string[];
  teamIds: string[];
  attendanceStatus: Record<string, EventAttendanceStatus>; // eventId -> PRESENT/ABSENT
  shortlistStatus: Record<string, ShortlistStatus>; // eventId -> ShortlistStatus
  certificateStatus: CertificateStatus;
  certificateUrl?: string;
  isDemo?: boolean; // Isolated demo participant indicator
  createdAt: string;
  updatedAt: string;
}

export interface DigitalPass {
  passId: string;
  participantId: string;
  holderName: string;
  email: string;
  college: string;
  department: string;
  qrToken: string;
  venueCheckIn: boolean;
  registeredEvents: string[];
  issuedAt: string;
}
