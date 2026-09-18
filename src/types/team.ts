export type TeamStatus = 'FORMING' | 'LOCKED' | 'CONFIRMED' | 'DISQUALIFIED';

export type TeamJoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RegistrationTeamMember {
  uid: string;
  participantId: string;
  fullName: string;
  college: string;
  isLeader: boolean;
  email?: string;
}

export interface EventTeam {
  teamId: string;
  teamCode: string; // Unique 6-character code (e.g. TR-89A4)
  teamName: string;

  // Teams are now event-independent. eventId/eventName are kept for
  // backward-compatibility with teams created under the old architecture,
  // but NEW teams will NOT have these fields set.
  eventId?: string;
  eventName?: string;
  registeredEvents?: any[];
  registeredEventName?: string;

  leaderUid: string;
  leaderParticipantId: string;
  leaderName?: string;
  captainId?: string; // Backward compatibility alias for leaderUid
  captainParticipantId?: string; // Backward compatibility alias for leaderParticipantId
  squadId?: string; // Backward compatibility alias for teamId
  memberUids: string[];
  members: RegistrationTeamMember[];

  /**
   * Authoritative member count set at team creation.
   * Used for fee calculation: memberCount × ₹200.
   * Cannot be changed after the team is created.
   */
  memberCount: number;

  minTeamSize: number;
  maxTeamSize: number;
  status: TeamStatus;

  /**
   * Set to true once the team registers for its first event.
   * After this, team composition (members/memberCount) is LOCKED.
   * Enforced by Firestore Security Rules — never trust frontend alone.
   */
  eventRegistrationStarted: boolean;

  /** ISO timestamp of when team composition was locked */
  lockedAt?: string;

  /**
   * Authoritative paid member count set upon payment verification/confirmation.
   * Lock rule: currentMemberCount <= paidMemberCount
   */
  paidMemberCount?: number;

  /**
   * True once payment for the team registration is verified by staff/president.
   * Locks team member count permanently.
   */
  isPaymentVerified?: boolean;

  /** ISO timestamp when payment was verified */
  paymentVerifiedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface TeamJoinRequest {
  requestId: string;
  teamId: string;
  teamCode: string;

  // Kept for backwards compatibility with old join request records
  eventId?: string;
  eventName?: string;

  leaderUid: string;
  captainId?: string; // Backward compatibility alias for leaderUid
  participantUid: string;
  userId?: string; // Backward compatibility alias for participantUid
  participantId: string;
  fullName: string;
  email?: string;
  college: string;
  status: TeamJoinRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

/** @deprecated Use EventTeam instead */
export type Team = EventTeam;
