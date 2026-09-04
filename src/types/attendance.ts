import type { VenueCheckInStatus, EventAttendanceStatus } from './participant';

export interface VenueCheckInRecord {
  checkInId: string;
  participantId: string;
  uid: string;
  fullName: string;
  college: string;
  status: VenueCheckInStatus;
  checkInTimestamp: string;
  registrationDeskId: string;
}

export interface EventAttendanceRecord {
  attendanceId: string;
  eventId: string;
  participantId: string;
  uid: string;
  teamId?: string;
  status: EventAttendanceStatus; // MUST be checked if venueCheckIn === true
  markedByCoordinatorId: string;
  markedAt: string;
}
