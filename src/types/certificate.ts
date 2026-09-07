export type CertificateType =
  | 'Participation Certificate'
  | 'Winner Certificate'
  | 'Runner-up Certificate'
  | 'Special Recognition Certificate'
  | 'Workshop Certificate'
  | 'Volunteer Certificate'
  | 'Coordinator Certificate';

export type CertificateStatus = 'VALID' | 'REVOKED' | 'issued' | 'revoked' | 'ISSUED';

/**
 * TARAS 2K26 — Firestore Certificate Record Schema
 * Matches Section 7 of specification with full backward compatibility.
 */
export interface CertificateRecord {
  /** Globally unique certificate ID: TARAS26-CERT-XXXXXXXX */
  certificateId: string;
  certId?: string; // Compatibility alias

  /** Participant identity */
  participantId: string;
  registrationId?: string;
  registrationNumber?: string;
  uid?: string;
  email?: string;

  /** Event details */
  eventId: string;
  eventName: string;

  /** Recipient information */
  participantName: string;
  fullName?: string; // Compatibility alias
  college?: string;
  collegeName?: string; // Compatibility alias

  /** Credential details */
  certificateType?: CertificateType | string;
  achievement?: string | null;
  position?: number | null;

  /** Timestamps & metadata */
  issuedAt: string;
  issueDate?: string; // Compatibility alias
  generatedAt?: string;
  generatedBy?: string;
  issuedByUid?: string;

  /** Status */
  certificateStatus: 'VALID' | 'REVOKED' | string;
  status: 'issued' | 'revoked' | 'ISSUED' | 'REVOKED' | 'VALID'; // Compatibility alias
  certificateEligible: boolean;

  /** Verification details */
  verificationUrl: string;
  verificationCode?: string;
  templateVersion?: string;

  /** Revocation metadata */
  revokedAt?: string;
  revokedBy?: string;
  revokedByUid?: string;
  revocationReason?: string;
  revokedReason?: string; // Compatibility alias
}
