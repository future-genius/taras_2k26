export type CertificateType =
  | 'Participation Certificate'
  | 'Winner Certificate'
  | 'Runner-up Certificate'
  | 'Special Recognition Certificate'
  | 'Workshop Certificate'
  | 'Volunteer Certificate'
  | 'Coordinator Certificate';

export type CertificateStatus = 'issued' | 'revoked' | 'ISSUED' | 'REVOKED';

export interface CertificateRecord {
  certificateId: string; // e.g. TARAS26-CERT-7F4A92C81D
  certId?: string; // Compatibility alias

  participantId: string;
  uid?: string;

  eventId: string;
  eventName: string;

  participantName: string;
  fullName?: string; // Compatibility alias
  college?: string;

  certificateType: CertificateType | string;
  achievement: string | null;
  position: number | null;

  issuedAt: string; // ISO string or Timestamp representation
  issueDate?: string; // Compatibility alias

  certificateEligible: boolean;
  status: 'issued' | 'revoked' | 'ISSUED' | 'REVOKED';

  issuedByUid?: string;
  verificationCode?: string;
  verificationUrl?: string;
}
