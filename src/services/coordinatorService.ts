/**
 * TARAS 2K26 — Coordinator Service
 *
 * Enforces strict, server-side event scoping and RBAC for Event Coordinators.
 * Coordinators can ONLY view and evaluate teams registered for their assigned track.
 * Cross-event access via URL tampering, ID manipulation, or direct calls is blocked.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { EventTeam } from '../types/team';
import type { EventRegistration } from '../types/registration';
import type {
  CoordinatorTeamItem,
  CoordinatorTeamMember,
  Round1ResultRecord,
  Round1ResultStatus,
  Round2ResultRecord,
  Round2ResultStatus,
} from '../types/round1';
import type { ParticipantProfile } from '../types/participant';

/**
 * Server-side verification of coordinator event assignment.
 * Throws ACCESS_DENIED if the coordinator is not authorized for this eventId.
 */
export async function verifyCoordinatorEventAssignment(
  coordinatorUid: string,
  eventId: string
): Promise<ParticipantProfile> {
  if (!coordinatorUid) {
    throw new Error('ACCESS_DENIED: Unauthenticated coordinator request.');
  }
  if (!eventId) {
    throw new Error('ACCESS_DENIED: Event ID is required.');
  }

  const profileRef = doc(firestore, 'participants', coordinatorUid);
  const snap = await getDoc(profileRef);

  if (!snap.exists()) {
    throw new Error('ACCESS_DENIED: Coordinator profile not found in TARAS registry.');
  }

  const profile = snap.data() as ParticipantProfile;
  const role = profile.role as string;

  // Master Administrators and President bypass event-level scoping
  if (role === 'super_admin' || role === 'PRESIDENT' || role === 'admin') {
    return profile;
  }

  // Coordinators and Event Heads MUST have the eventId explicitly assigned
  const assigned = profile.assignedEventIds || [];
  const isAssigned = assigned.includes(eventId);

  if (!isAssigned) {
    throw new Error(
      `ACCESS_DENIED: Coordinator ${profile.fullName || coordinatorUid} is NOT authorized to access event track "${eventId}".`
    );
  }

  return profile;
}

/**
 * Fetch teams and members for the coordinator's assigned event.
 * Strictly scopes data to the specified eventId and verifies coordinator assignment.
 * Enforces Paper-X-Verse Internal vs External isolation.
 */
export async function getCoordinatorEventTeams(
  eventId: string,
  coordinatorUid: string
): Promise<CoordinatorTeamItem[]> {
  // 1. Server-side verification of event authorization
  await verifyCoordinatorEventAssignment(coordinatorUid, eventId);

  // 2. Query registrations strictly for this eventId
  const regsRef = collection(firestore, 'registrations');
  const qRegs = query(regsRef, where('eventId', '==', eventId));
  const regSnap = await getDocs(qRegs);

  let activeRegs = regSnap.docs
    .map((d) => d.data() as EventRegistration)
    .filter((r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED');

  // 3. Strict Paper-X-Verse Partitioning
  if (eventId === 'taras-01-int' || eventId === 'paper-x-verse-internal') {
    // Internal track only: internal participant registrations
    activeRegs = activeRegs.filter(
      (r) => r.participantType === 'internal' || r.eventId === 'taras-01-int'
    );
  } else if (eventId === 'taras-01-ext' || eventId === 'paper-x-verse-external') {
    // External track only: external participant registrations
    activeRegs = activeRegs.filter(
      (r) => r.participantType === 'external' || r.eventId === 'taras-01-ext'
    );
  }

  // Map registration by teamId
  const teamRegMap = new Map<string, EventRegistration>();
  activeRegs.forEach((r) => {
    if (r.teamId) {
      teamRegMap.set(r.teamId, r);
    }
  });

  const teamIds = Array.from(teamRegMap.keys());
  if (teamIds.length === 0) {
    return [];
  }

  // 4. Fetch Round 1 and Round 2 results for this event
  const r1ResultsRef = collection(firestore, 'round1_results');
  const qR1 = query(r1ResultsRef, where('eventId', '==', eventId));
  const r1Snap = await getDocs(qR1);

  const r1ResultMap = new Map<string, Round1ResultRecord>();
  r1Snap.docs.forEach((d) => {
    const data = d.data() as Round1ResultRecord;
    if (data.teamId) {
      r1ResultMap.set(data.teamId, data);
    }
  });

  const r2ResultsRef = collection(firestore, 'round2_results');
  const qR2 = query(r2ResultsRef, where('eventId', '==', eventId));
  const r2Snap = await getDocs(qR2);

  const r2ResultMap = new Map<string, Round2ResultRecord>();
  r2Snap.docs.forEach((d) => {
    const data = d.data() as Round2ResultRecord;
    if (data.teamId) {
      r2ResultMap.set(data.teamId, data);
    }
  });

  // 5. Fetch each team document and sanitize member details (no passwords/tokens)
  const teams: CoordinatorTeamItem[] = [];

  for (const teamId of teamIds) {
    try {
      const teamRef = doc(firestore, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);

      const reg = teamRegMap.get(teamId);
      const r1Record = r1ResultMap.get(teamId);
      const r2Record = r2ResultMap.get(teamId);

      // Determine Round 1 outcome (check round1_results collection first, then registration doc)
      const round1Result: Round1ResultStatus | 'NOT_DECLARED' =
        r1Record?.round1Result || reg?.round1Result || 'NOT_DECLARED';
      const round1UpdatedAt = r1Record?.updatedAt || reg?.round1UpdatedAt;
      const round1UpdatedBy = r1Record?.coordinatorUid || reg?.round1UpdatedBy;

      // Determine Round 2 outcome (check round2_results collection first, then r1Record, then registration doc)
      const round2Result: Round2ResultStatus | 'NOT_DECLARED' =
        r2Record?.round2Result || r1Record?.round2Result || reg?.round2Result || 'NOT_DECLARED';
      const round2UpdatedAt = r2Record?.updatedAt || r1Record?.round2UpdatedAt || reg?.round2UpdatedAt;
      const round2UpdatedBy = r2Record?.coordinatorUid || r1Record?.round2UpdatedBy || reg?.round2UpdatedBy;

      // Determine scan and progression states
      const venueCheckIn = reg?.venueCheckIn === true || reg?.status === 'CHECKED_IN' || reg?.venueCheckInStatus === 'CHECKED_IN';
      const round1Scanned = reg?.round1Scanned === true || reg?.eventAttendance === 'PRESENT';
      const round2Eligible = venueCheckIn && round1Scanned && round1Result === 'SELECTED';
      const round2Scanned = reg?.round2Scanned === true;

      if (teamSnap.exists()) {
        const teamData = teamSnap.data() as EventTeam;

        // Strip private credentials, tokens, and passwords. Keep only public participant details.
        const safeMembers: CoordinatorTeamMember[] = (teamData.members || []).map((m) => ({
          uid: m.uid,
          participantId: m.participantId || 'N/A',
          fullName: m.fullName || 'Member',
          college: m.college || 'Institution',
          isLeader: m.isLeader === true || m.uid === teamData.leaderUid,
        }));

        teams.push({
          teamId: teamData.teamId || teamId,
          teamCode: teamData.teamCode || 'N/A',
          teamName: teamData.teamName || reg?.teamName || 'Team',
          registrationId: reg?.registrationId || '',
          registrationStatus: reg?.status || 'CONFIRMED',
          paymentStatus: reg?.paymentStatus || 'NOT_REQUIRED',
          memberCount: safeMembers.length || teamData.memberCount || 1,
          members: safeMembers,
          venueCheckIn,
          venueCheckInStatus: venueCheckIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
          round1Scanned,
          round1ScannedAt: reg?.round1ScannedAt,
          round1ScannedBy: reg?.round1ScannedBy,
          round1Result,
          round1UpdatedAt,
          round1UpdatedBy,
          round2Eligible,
          round2Scanned,
          round2ScannedAt: reg?.round2ScannedAt,
          round2ScannedBy: reg?.round2ScannedBy,
          round2Result,
          round2UpdatedAt,
          round2UpdatedBy,
          registeredAt: reg?.registeredAt || teamData.createdAt,
        });
      } else if (reg) {
        // Fallback for standalone registered squad
        teams.push({
          teamId,
          teamCode: 'N/A',
          teamName: reg.teamName || 'Team',
          registrationId: reg.registrationId,
          registrationStatus: reg.status,
          paymentStatus: reg.paymentStatus || 'NOT_REQUIRED',
          memberCount: reg.teamMemberCount || 1,
          members: [
            {
              uid: reg.uid,
              participantId: reg.participantId,
              fullName: reg.teamName || 'Team Leader',
              college: 'Institution',
              isLeader: true,
            },
          ],
          venueCheckIn,
          venueCheckInStatus: venueCheckIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
          round1Scanned,
          round1ScannedAt: reg?.round1ScannedAt,
          round1ScannedBy: reg?.round1ScannedBy,
          round1Result,
          round1UpdatedAt,
          round1UpdatedBy,
          round2Eligible,
          round2Scanned,
          round2ScannedAt: reg?.round2ScannedAt,
          round2ScannedBy: reg?.round2ScannedBy,
          round2Result,
          round2UpdatedAt,
          round2UpdatedBy,
          registeredAt: reg.registeredAt,
        });
      }
    } catch (err) {
      console.warn(`[CoordinatorService] Failed to load team ${teamId}:`, err);
    }
  }

  // Sort alphabetically by team name
  return teams.sort((a, b) => a.teamName.localeCompare(b.teamName));
}

/**
 * Save Round 1 outcome for a selected team.
 * Atomically records to /round1_results/R1-${eventId}-${teamId}
 * and updates the corresponding registration document for immediate President visibility.
 */
export async function saveTeamRound1Result(params: {
  eventId: string;
  eventName: string;
  teamId: string;
  teamName: string;
  teamCode?: string;
  registrationId?: string;
  round1Result: Round1ResultStatus;
  coordinatorUid: string;
}): Promise<Round1ResultRecord> {
  const {
    eventId,
    eventName,
    teamId,
    teamName,
    teamCode,
    registrationId,
    round1Result,
    coordinatorUid,
  } = params;

  // 1. Server-side check: coordinator must be assigned to this event
  await verifyCoordinatorEventAssignment(coordinatorUid, eventId);

  // 2. Validate input values
  if (round1Result !== 'SELECTED' && round1Result !== 'NOT_SELECTED') {
    throw new Error('Invalid Round 1 result. Must be "SELECTED" or "NOT_SELECTED".');
  }

  const resultId = `R1-${eventId}-${teamId}`;
  const resultRef = doc(firestore, 'round1_results', resultId);
  const regRef = registrationId ? doc(firestore, 'registrations', registrationId) : null;
  const now = new Date().toISOString();

  const record: Round1ResultRecord = {
    resultId,
    teamId,
    teamName,
    teamCode: teamCode || '',
    eventId,
    eventName,
    round1Result,
    coordinatorUid,
    updatedByUid: coordinatorUid,
    updatedAt: now,
    status: 'ROUND1_RECORDED',
  };

  await runTransaction(firestore, async (transaction) => {
    // ── 1. ALL READS FIRST (Strictly Sequential before any write) ──
    const r2ResultRef = doc(firestore, 'round2_results', `R2-${eventId}-${teamId}`);
    const r2Snap = await transaction.get(r2ResultRef);
    const regSnap = regRef ? await transaction.get(regRef) : null;

    // Backward Direction Guard: Cannot reset Round 1 if Round 2 results already exist
    if (r2Snap.exists() || (regSnap?.exists() && regSnap.data().round2Result)) {
      throw new Error(`Cannot modify Round 1 outcome for squad "${teamName}": Round 2 final result has already been recorded.`);
    }

    // ── 2. ALL WRITES SECOND ──
    transaction.set(resultRef, {
      ...record,
      updatedAtServer: serverTimestamp(),
    });

    if (regRef && regSnap?.exists()) {
      transaction.update(regRef, {
        round1Result,
        round1UpdatedAt: now,
        round1UpdatedBy: coordinatorUid,
        updatedAt: now,
      });
    }

    const auditRef = doc(collection(firestore, 'audit_logs'));
    transaction.set(auditRef, {
      action: 'ROUND1_RESULT_SAVED',
      actorUid: coordinatorUid,
      actorRole: 'coordinator',
      eventId,
      eventName,
      targetTeamId: teamId,
      round1Result,
      timestamp: serverTimestamp(),
      createdAt: now,
    });
  });

  return record;
}

/**
 * Save Round 2 (Final Result) outcome for a selected team.
 * Atomically records to /round2_results/R2-${eventId}-${teamId},
 * preserves Round 1 outcome without overwriting,
 * and updates the corresponding registration document for immediate President visibility.
 */
export async function saveTeamRound2Result(params: {
  eventId: string;
  eventName: string;
  teamId: string;
  teamName: string;
  teamCode?: string;
  registrationId?: string;
  round2Result: Round2ResultStatus;
  coordinatorUid: string;
}): Promise<Round2ResultRecord> {
  const {
    eventId,
    eventName,
    teamId,
    teamName,
    teamCode,
    registrationId,
    round2Result,
    coordinatorUid,
  } = params;

  // 1. Server-side check: coordinator must be assigned to this event
  await verifyCoordinatorEventAssignment(coordinatorUid, eventId);

  // 2. Validate input values
  if (round2Result !== 'WINNER' && round2Result !== 'RUNNER_UP' && round2Result !== 'NOT_SELECTED') {
    throw new Error('Invalid Round 2 result. Must be "WINNER", "RUNNER_UP", or "NOT_SELECTED".');
  }

  const resultId = `R2-${eventId}-${teamId}`;
  const resultRef = doc(firestore, 'round2_results', resultId);
  const r1ResultRef = doc(firestore, 'round1_results', `R1-${eventId}-${teamId}`);
  const regRef = registrationId ? doc(firestore, 'registrations', registrationId) : null;
  const now = new Date().toISOString();

  const record: Round2ResultRecord = {
    resultId,
    teamId,
    teamName,
    teamCode: teamCode || '',
    eventId,
    eventName,
    round2Result,
    coordinatorUid,
    updatedByUid: coordinatorUid,
    updatedAt: now,
    status: 'ROUND2_RECORDED',
  };

  await runTransaction(firestore, async (transaction) => {
    // ── 1. ALL READS FIRST (Strictly Sequential before any write) ──
    const r1Snap = await transaction.get(r1ResultRef);
    const regSnap = regRef ? await transaction.get(regRef) : null;

    // Prerequisite Verification: Must be SELECTED in Round 1 before declaring Round 2 final result
    const r1Result = r1Snap.exists()
      ? r1Snap.data().round1Result
      : regSnap?.exists()
      ? regSnap.data().round1Result
      : null;

    if (r1Result !== 'SELECTED') {
      throw new Error(`Cannot declare Round 2 final result: Squad "${teamName}" was not marked SELECTED in Round 1.`);
    }

    // ── 2. ALL WRITES SECOND ──
    transaction.set(resultRef, {
      ...record,
      updatedAtServer: serverTimestamp(),
    });

    if (r1Snap.exists()) {
      transaction.update(r1ResultRef, {
        round2Result,
        round2UpdatedAt: now,
        round2UpdatedBy: coordinatorUid,
      });
    }

    if (regRef && regSnap?.exists()) {
      transaction.update(regRef, {
        round2Result,
        round2UpdatedAt: now,
        round2UpdatedBy: coordinatorUid,
        updatedAt: now,
      });
    }

    const auditRef = doc(collection(firestore, 'audit_logs'));
    transaction.set(auditRef, {
      action: 'ROUND2_RESULT_SAVED',
      actorUid: coordinatorUid,
      actorRole: 'coordinator',
      eventId,
      eventName,
      targetTeamId: teamId,
      round2Result,
      timestamp: serverTimestamp(),
      createdAt: now,
    });
  });

  return record;
}
