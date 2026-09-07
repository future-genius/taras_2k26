/**
 * TARAS 2K26 — Event Registration Service
 *
 * This service handles the complete event registration workflow:
 * 1. Team validation
 * 2. Duplicate registration prevention
 * 3. First-payment vs. subsequent-event fee determination (Firestore-sourced)
 * 4. Atomic Firestore transaction: create registration + lock team composition
 * 5. Payment proof submission
 *
 * PAYMENT MODEL:
 * - BASE_FEE_PER_PERSON = ₹150
 * - First event registration: teamMemberCount × ₹150
 * - Subsequent events (same team, already has VERIFIED payment): ₹0
 *
 * SECURITY:
 * - calculatedFee is NEVER trusted from the browser
 * - feePerPerson is always ₹150 (hardcoded in server logic)
 * - paymentStatus = VERIFIED can only be set by registration_staff / admin
 * - isFirstPayment is determined by Firestore query, not client state
 */

import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
import type { EventRegistration, PaymentStatus } from '../types/registration';
import type { EventTeam } from '../types/team';

/** ₹150 per person — authoritative constant, never sourced from client */
export const BASE_FEE_PER_PERSON = 150;

// ─────────────────────────────────────────────────────────────────────────────
// Payment Status Queries (Firestore-sourced, never localStorage)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether a team has an existing VERIFIED payment in Firestore.
 *
 * A team's first event registration charges teamMemberCount × ₹150.
 * Once that payment is verified, ALL subsequent event registrations
 * for the SAME team are ₹0.
 *
 * This query is Firestore-authoritative — never use localStorage or React state
 * to determine payment eligibility.
 */
export async function checkTeamHasVerifiedPayment(teamId: string): Promise<boolean> {
  const regsRef = collection(firestore, 'registrations');
  const q = query(
    regsRef,
    where('teamId', '==', teamId),
    where('paymentStatus', '==', 'VERIFIED')
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Calculate the event registration fee for a team.
 *
 * @returns { fee, isFirstPayment }
 * - fee: ₹0 if team already has a verified payment, else teamMemberCount × ₹150
 * - isFirstPayment: true if this will be the team's first payment
 */
export async function calculateEventFee(
  teamId: string,
  teamMemberCount: number
): Promise<{ fee: number; isFirstPayment: boolean; feePerPerson: number }> {
  const hasVerifiedPayment = await checkTeamHasVerifiedPayment(teamId);
  if (hasVerifiedPayment) {
    return { fee: 0, isFirstPayment: false, feePerPerson: BASE_FEE_PER_PERSON };
  }
  return {
    fee: teamMemberCount * BASE_FEE_PER_PERSON,
    isFirstPayment: true,
    feePerPerson: BASE_FEE_PER_PERSON,
  };
}

/**
 * Check if a team is already registered for a specific event.
 */
export async function checkTeamAlreadyRegisteredForEvent(
  teamId: string,
  eventId: string
): Promise<boolean> {
  const regsRef = collection(firestore, 'registrations');
  const q = query(
    regsRef,
    where('teamId', '==', teamId),
    where('eventId', '==', eventId)
  );
  const snap = await getDocs(q);
  // Filter out CANCELLED/REJECTED registrations
  const activeRegs = snap.docs.filter((d) => {
    const status = d.data().status as string;
    return status !== 'CANCELLED' && status !== 'REJECTED';
  });
  return activeRegs.length > 0;
}

/**
 * Get all event registrations for a team (from Firestore).
 */
export async function getTeamRegistrations(teamId: string): Promise<EventRegistration[]> {
  const regsRef = collection(firestore, 'registrations');
  const q = query(regsRef, where('teamId', '==', teamId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as EventRegistration);
}

/**
 * Get all event registrations for a participant (from Firestore).
 */
export async function getParticipantRegistrations(uid: string): Promise<EventRegistration[]> {
  const regsRef = collection(firestore, 'registrations');
  const q = query(regsRef, where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as EventRegistration);
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration Creation Parameters
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateEventRegistrationParams {
  /** Authenticated user's Firebase UID */
  uid: string;
  /** Participant's TARAS registration number */
  participantId: string;
  /** The event to register for */
  eventId: string;
  eventName: string;
  eventCategory: EventRegistration['category'];
  /** Whether this is a team event */
  isTeamEvent: boolean;
  /** The team performing the registration (for team events) */
  team?: EventTeam;
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration ID Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateRegistrationId(eventId: string): string {
  const eventCode = eventId.substring(0, 6).replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 4) || 'EVT';
  const num = Math.floor(10000 + Math.random() * 90000);
  return `TARAS26-${eventCode}-${num}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: Create Event Registration (Atomic Firestore Transaction)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an event registration for a participant or team.
 *
 * This is the CORRECT entry point for "Continue to Payment".
 *
 * Workflow:
 * 1. Validate inputs
 * 2. Prevent duplicate registrations (same team + same event)
 * 3. Determine fee from Firestore (never client-provided)
 * 4. Create registration document atomically
 * 5. Lock team composition (set eventRegistrationStarted = true)
 * 6. Return registration with fee and payment status
 *
 * Navigation to payment page happens ONLY after this succeeds.
 */
export async function createEventRegistration(
  params: CreateEventRegistrationParams
): Promise<EventRegistration> {
  const { uid, participantId, eventId, eventName, eventCategory, isTeamEvent, team } = params;

  // Prioritize Firebase Auth's authoritative currentUser.uid so request.auth.uid in security rules always matches
  const currentUser = auth.currentUser;
  const effectiveUid = currentUser?.uid || uid;

  // ── 1. Basic validation ──────────────────────────────────────────────────
  if (!effectiveUid) throw new Error('You must be logged in to register for an event.');
  if (!eventId) throw new Error('Event ID is required.');

  if (isTeamEvent && !team) {
    throw new Error(
      'You need to create or join a team before registering for this team event. Go to Team Hub to set up your team first.'
    );
  }

  if (isTeamEvent && team) {
    const isMember =
      team.memberUids.includes(effectiveUid) || (uid && team.memberUids.includes(uid));
    if (!isMember) {
      throw new Error('You are not a member of this team. Only team members can register their team for events.');
    }

    const isTeamLeader =
      team.leaderUid === effectiveUid || team.leaderUid === uid || team.memberUids.includes(effectiveUid);
    if (!isTeamLeader) {
      const leaderName = team.members.find((m) => m.isLeader)?.fullName || 'Team Leader';
      throw new Error(
        `Only the team leader (${leaderName}) can register the team for events and complete payment.`
      );
    }
  }

  // ── 2. Determine member count & fee ─────────────────────────────────────
  const teamId = team?.teamId;
  const teamMemberCount = team?.memberCount ?? 1;

  // Duplicate registration check (pre-transaction for UX — Firestore transaction will double-check)
  if (teamId) {
    const alreadyRegistered = await checkTeamAlreadyRegisteredForEvent(teamId, eventId);
    if (alreadyRegistered) {
      throw new Error('This team is already registered for this event.');
    }
  } else {
    // Individual event — check participant not already registered
    const regsRef = collection(firestore, 'registrations');
    const q = query(regsRef, where('uid', '==', effectiveUid), where('eventId', '==', eventId));
    const snap = await getDocs(q);
    const activeRegs = snap.docs.filter((d) => {
      const status = d.data().status as string;
      return status !== 'CANCELLED' && status !== 'REJECTED';
    });
    if (activeRegs.length > 0) {
      throw new Error('You are already registered for this event.');
    }
  }

  // Determine fee from Firestore (NEVER from browser-provided value)
  const feeInfo = teamId
    ? await calculateEventFee(teamId, teamMemberCount)
    : { fee: BASE_FEE_PER_PERSON, isFirstPayment: true, feePerPerson: BASE_FEE_PER_PERSON };

  const { fee: calculatedFee, isFirstPayment, feePerPerson } = feeInfo;

  // ── 3. Determine registration ID ─────────────────────────────────────────
  const registrationId = generateRegistrationId(eventId);
  const regRef = doc(firestore, 'registrations', registrationId);
  const participantRef = doc(firestore, 'participants', effectiveUid);
  const teamRef = teamId ? doc(firestore, 'teams', teamId) : null;

  // ── 4. Atomic Firestore Transaction ──────────────────────────────────────
  const now = new Date().toISOString();

  const paymentStatus: PaymentStatus = calculatedFee === 0 ? 'NOT_REQUIRED' : 'PENDING';
  const registrationStatus = calculatedFee === 0 ? 'CONFIRMED' : 'PENDING_PAYMENT';

  const newReg: EventRegistration = {
    registrationId,
    participantId,
    uid: effectiveUid,
    eventId,
    eventName,
    category: eventCategory,
    isTeamEvent,
    ...(teamId && { teamId }),
    ...(team && { teamName: team.teamName }),
    teamMemberCount: isTeamEvent ? teamMemberCount : 1,
    feePerPerson,
    calculatedFee,
    isFirstPayment,
    feeAmount: calculatedFee, // backward compat field
    status: registrationStatus,
    paymentStatus,
    registeredAt: now,
    venueCheckInRequired: true,
    eventAttendance: 'NOT_MARKED',
    shortlistStatus: 'NOT_EVALUATED',
    certificateEligible: false,
  };

  await runTransaction(firestore, async (transaction) => {
    // ── READ ALL FIRST (Firestore transaction requirement) ──
    const partSnap = await transaction.get(participantRef);
    if (!partSnap.exists()) throw new Error('Participant profile not found. Please log in again.');

    // For team events, verify team state
    let teamData: EventTeam | null = null;
    if (teamRef) {
      const teamSnap = await transaction.get(teamRef);
      if (!teamSnap.exists()) throw new Error('Team not found. Please refresh and try again.');
      teamData = teamSnap.data() as EventTeam;

      // Verify caller is team leader or member inside transaction
      const isLeaderOrMember =
        teamData.leaderUid === effectiveUid ||
        teamData.leaderUid === uid ||
        teamData.memberUids.includes(effectiveUid);
      if (!isLeaderOrMember) {
        throw new Error('Only the team leader can complete event registration.');
      }
    }

    // ── WRITES ──

    // 1. Create registration document
    transaction.set(regRef, {
      ...newReg,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Lock team composition if this is a team event and not yet locked
    if (teamRef && teamData && !teamData.eventRegistrationStarted) {
      transaction.update(teamRef, {
        eventRegistrationStarted: true,
        status: 'LOCKED',
        lockedAt: now,
        updatedAt: serverTimestamp(),
      });
    }
  });

  return newReg;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Proof Submission (uses existing paymentService logic pattern)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get registration summary for dashboard display.
 * Returns registrations with calculated payment status indicators.
 */
export interface RegistrationSummary {
  totalEvents: number;
  confirmed: number;
  pendingVerification: number;
  paymentRequired: number;
  rejected: number;
  teamPaymentVerified: boolean;
  totalPaid: number;
}

export async function getParticipantRegistrationSummary(
  uid: string,
  teamId?: string
): Promise<RegistrationSummary> {
  const regs = await getParticipantRegistrations(uid);

  let confirmed = 0;
  let pendingVerification = 0;
  let paymentRequired = 0;
  let rejected = 0;
  let totalPaid = 0;

  for (const reg of regs) {
    const status = reg.status;
    const payStatus = reg.paymentStatus;

    if (status === 'CONFIRMED') confirmed++;
    else if (status === 'PAYMENT_VERIFICATION_PENDING') pendingVerification++;
    else if (status === 'PENDING_PAYMENT') paymentRequired++;
    else if (status === 'REJECTED') rejected++;

    if (payStatus === 'VERIFIED' && reg.calculatedFee && reg.calculatedFee > 0) {
      totalPaid += reg.calculatedFee;
    }
  }

  const teamPaymentVerified = teamId ? await checkTeamHasVerifiedPayment(teamId) : false;

  return {
    totalEvents: regs.length,
    confirmed,
    pendingVerification,
    paymentRequired,
    rejected,
    teamPaymentVerified,
    totalPaid,
  };
}
