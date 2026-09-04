import type { EventAttendanceStatus, ShortlistStatus } from './participant';

export type RegistrationStatus =
  | 'NOT_REGISTERED'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'DRAFT'
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_VERIFICATION_PENDING'
  | 'CONFIRMED'
  | 'WAITLISTED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'CHECKED_IN'
  | 'ATTENDED'
  | 'SHORTLISTED'
  | 'WINNER'
  | 'CERTIFICATE_READY';

export type PaymentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED';

export interface EventRegistration {
  registrationId: string;
  participantId: string;
  uid: string;
  eventId: string;
  eventName: string;
  category: 'TECHNICAL' | 'NON_TECHNICAL' | 'WORKSHOP' | 'HACKATHON';
  isTeamEvent: boolean;
  teamId?: string;
  teamName?: string;

  /**
   * Snapshot of team member count at the time of registration.
   * Used for fee calculation and is immutable after creation.
   */
  teamMemberCount?: number;

  /**
   * Fee per person — always ₹150 (BASE_FEE_PER_PERSON).
   * Set by server logic; participants cannot modify this.
   */
  feePerPerson?: number;

  /**
   * Calculated total fee = feePerPerson × teamMemberCount.
   * Is ₹0 for subsequent event registrations after a verified first payment.
   * Set by server logic; participants cannot modify this.
   */
  calculatedFee?: number;

  /**
   * True if this registration required the team's first payment.
   * False for subsequent event registrations (fee = ₹0).
   */
  isFirstPayment?: boolean;

  status: RegistrationStatus;
  registeredAt: string;
  venueCheckInRequired: boolean;
  eventAttendance: EventAttendanceStatus;
  shortlistStatus: ShortlistStatus;
  certificateEligible: boolean;

  // Payment lifecycle fields
  feeAmount?: number;
  paymentStatus?: PaymentStatus;
  utrNumber?: string;
  paymentScreenshotUrl?: string;
  paymentScreenshotPath?: string;
  paymentScreenshotSize?: number;
  paymentScreenshotContentType?: string;
  paymentProof?: {
    provider: 'supabase' | 'firebase';
    bucket: string;
    path: string;
    fileSize?: number;
    contentType?: string;
    uploadedAt?: string;
  };
  paymentSubmittedAt?: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  paymentRejectedAt?: string;
  paymentRejectedBy?: string;
  rejectionReason?: string;
  possibleDuplicate?: boolean;
  isDemo?: boolean;
}
