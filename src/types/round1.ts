/**
 * TARAS 2K26 — Coordinator Event Track Result Types (Round 1 & Round 2 Final Result)
 *
 * Streamlined outcome tracking for coordinator event tracks.
 * Replaces complex criteria rubrics, marks, and leaderboards
 * with clean binary / final progression outcomes.
 */

// ── Round 1 Types ─────────────────────────────────────────────────────────────
export type Round1ResultStatus = 'SELECTED' | 'NOT_SELECTED';

export type Round1DisplayStatus =
  | 'Selected for Next Round'
  | 'Not Selected for Next Round'
  | 'Result Not Declared';

export interface Round1ResultRecord {
  resultId: string; // e.g. R1-${eventId}-${teamId}
  teamId: string;
  teamName: string;
  teamCode?: string;
  eventId: string;
  eventName: string;
  round1Result: Round1ResultStatus;
  round2Result?: Round2ResultStatus;
  round2UpdatedAt?: string;
  round2UpdatedBy?: string;
  coordinatorUid: string;
  updatedByUid: string;
  updatedAt: string;
  createdAt?: string;
  status: 'ROUND1_RECORDED';
}

// ── Round 2 / Final Result Types ──────────────────────────────────────────────
export type Round2ResultStatus = 'WINNER' | 'RUNNER_UP' | 'NOT_SELECTED';

export type Round2DisplayStatus =
  | 'Winner'
  | 'Runner-Up'
  | 'Not Selected'
  | 'Result Not Declared';

export interface Round2ResultRecord {
  resultId: string; // e.g. R2-${eventId}-${teamId}
  teamId: string;
  teamName: string;
  teamCode?: string;
  eventId: string;
  eventName: string;
  round2Result: Round2ResultStatus;
  coordinatorUid: string;
  updatedByUid: string;
  updatedAt: string;
  createdAt?: string;
  status: 'ROUND2_RECORDED';
}

// ── Coordinator View Models ───────────────────────────────────────────────────
export interface CoordinatorTeamMember {
  uid: string;
  participantId: string;
  fullName: string;
  college: string;
  isLeader: boolean;
  registrationNumber?: string;
  department?: string;
}

export interface CoordinatorTeamItem {
  teamId: string;
  teamCode: string;
  teamName: string;
  registrationId: string;
  registrationStatus: string;
  paymentStatus: string;
  memberCount: number;
  members: CoordinatorTeamMember[];
  venueCheckIn: boolean;
  venueCheckInStatus?: string;
  round1Scanned: boolean;
  round1ScannedAt?: string;
  round1ScannedBy?: string;
  round1Result: Round1ResultStatus | 'NOT_DECLARED';
  round1UpdatedAt?: string;
  round1UpdatedBy?: string;
  round2Eligible: boolean;
  round2Scanned: boolean;
  round2ScannedAt?: string;
  round2ScannedBy?: string;
  round2Result: Round2ResultStatus | 'NOT_DECLARED';
  round2UpdatedAt?: string;
  round2UpdatedBy?: string;
  registeredAt?: string;
}
