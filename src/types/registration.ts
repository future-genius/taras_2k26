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
  registrationNumber?: string;
  participantType?: 'internal' | 'external';
  uid: string;
  eventId: string;
  eventName: string;
  category: 'TECHNICAL' | 'NON_TECHNICAL' | 'HACKATHON';
  isTeamEvent: boolean;
  teamId?: string;
  teamName?: string;

  /**
   * Snapshot of team member count at the time of registration.
   * Used for fee calculation and is immutable after creation.
   */
  teamMemberCount?: number;

  /**
   * Authoritative paid member count once payment is confirmed.
   */
  paidMemberCount?: number;

  /**
   * Fee per person — always ₹200 (BASE_FEE_PER_PERSON).
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

  venueCheckIn?: boolean;
  venueCheckInStatus?: string;
  venueCheckInTimestamp?: string;

  // Round 1 Scan & Result progression
  round1Scanned?: boolean;
  round1ScannedAt?: string;
  round1ScannedBy?: string;
  round1Result?: 'SELECTED' | 'NOT_SELECTED';
  round1UpdatedAt?: string;
  round1UpdatedBy?: string;

  // Round 2 Scan & Final Result progression
  round2Scanned?: boolean;
  round2ScannedAt?: string;
  round2ScannedBy?: string;
  round2Result?: 'WINNER' | 'RUNNER_UP' | 'NOT_SELECTED';
  round2UpdatedAt?: string;
  round2UpdatedBy?: string;

  // Payment lifecycle fields
  paymentProofId?: string;
  feeAmount?: number;
  paymentStatus?: PaymentStatus;
  utrNumber?: string;
  utr?: string; // Backward compatibility alias for utrNumber
  bankName?: string;
  transactionDate?: string;
  /** Drive web view URL — used as the primary proof viewing link */
  paymentScreenshotUrl?: string;
  paymentProofUrl?: string; // Backward compatibility alias for paymentScreenshotUrl
  /** Drive folder path or legacy storage path */
  paymentScreenshotPath?: string;
  paymentScreenshotSize?: number;
  paymentScreenshotContentType?: string;
  uploadedAt?: string;
  uploadedAtIST?: string;
  leaderName?: string;
  registeredEventName?: string;
  createdAt?: any;
  updatedAt?: any;
  /** @deprecated Legacy Supabase path — kept for reading historical records only */
  supabasePath?: string;
  /** @deprecated Legacy Supabase upload status — kept for reading historical records only */
  supabaseUploadStatus?: 'SUCCESS' | 'FAILED';
  googleDriveFileId?: string;
  googleDriveFolderId?: string;
  googleDrivePath?: string;
  googleDriveUploadStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  presidentOverrideAt?: string;
  presidentOverrideBy?: string;
  presidentOverrideAction?: string;
  presidentOverrideReason?: string;
  paymentProof?: {
    paymentProofId?: string;
    /** 'googledrive' for new uploads; legacy values kept for historical compat */
    provider: 'googledrive' | 'supabase' | 'firebase' | 'firestore';
    /** Drive folder path */
    drivePath?: string;
    /** Drive file ID */
    driveFileId?: string;
    /** Drive web view URL */
    driveFileUrl?: string;
    /** Sanitized filename in Drive */
    driveFileName?: string;
    /** Drive folder ID */
    driveFolderId?: string;
    driveUploadStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
    bankName?: string;
    transactionDate?: string;
    fileSize?: number;
    contentType?: string;
    uploadedAt?: string;
    uploadedAtIST?: string;
    /** @deprecated Legacy Supabase path */
    supabasePath?: string;
    /** @deprecated Legacy Supabase upload status */
    supabaseUploadStatus?: 'SUCCESS' | 'FAILED';
    /** @deprecated Legacy Supabase bucket */
    bucket?: string;
    /** @deprecated Legacy storage path */
    path?: string;
    googleDriveFileId?: string;
    googleDriveFolderId?: string;
    googleDrivePath?: string;
    googleDriveUploadStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  };
  paymentSubmittedAt?: string;
  paymentVerifiedAt?: string;
  verifiedAt?: string; // Backward compatibility alias for paymentVerifiedAt
  paymentVerifiedBy?: string;
  verifiedBy?: string; // Backward compatibility alias for paymentVerifiedBy
  paymentRejectedAt?: string;
  paymentRejectedBy?: string;
  rejectionReason?: string;
  possibleDuplicate?: boolean;
  isDemo?: boolean;
}
