import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { EventTeam, RegistrationTeamMember, TeamJoinRequest } from '../types/team';

const BASE_FEE_PER_PERSON = 150; // ₹150 per person

export { BASE_FEE_PER_PERSON };

/**
 * Generates a unique, human-friendly 6-character team code (e.g. TR-A7K92)
 */
function generateRawCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function generateUniqueTeamCode(): Promise<string> {
  const teamsRef = collection(firestore, 'teams');
  let code = '';
  let unique = false;
  let attempts = 0;

  while (!unique && attempts < 10) {
    attempts++;
    const raw = generateRawCode();
    code = `TR-${raw}`;
    const q = query(teamsRef, where('teamCode', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) {
      unique = true;
    }
  }

  if (!unique) {
    code = `TR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }
  return code;
}

/**
 * Checks whether a team name already exists globally (case-insensitive).
 * Teams are now event-independent so uniqueness is global.
 */
export async function verifyUniqueTeamName(
  teamName: string,
  excludeTeamId?: string
): Promise<boolean> {
  const trimmed = teamName.trim();
  if (!trimmed) return false;

  const teamsRef = collection(firestore, 'teams');
  const snap = await getDocs(teamsRef);

  const normalizedInput = trimmed.toLowerCase();
  for (const documentSnap of snap.docs) {
    if (excludeTeamId && documentSnap.id === excludeTeamId) continue;
    const data = documentSnap.data();
    if (data.teamName && String(data.teamName).trim().toLowerCase() === normalizedInput) {
      return false; // Name taken
    }
  }
  return true; // Unique name
}

/**
 * Fetch team document by team ID
 */
export async function getTeam(teamId: string): Promise<EventTeam | null> {
  const teamRef = doc(firestore, 'teams', teamId);
  const snap = await getDoc(teamRef);
  if (!snap.exists()) return null;
  return snap.data() as EventTeam;
}

/**
 * Subscribe to real-time updates for teams associated with a participant
 */
export function subscribeToUserTeams(
  participantUid: string,
  onUpdate: (teams: EventTeam[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const teamsRef = collection(firestore, 'teams');
  const q = query(teamsRef, where('memberUids', 'array-contains', participantUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const teams = snapshot.docs.map((d) => d.data() as EventTeam);
      onUpdate(teams);
    },
    (err) => {
      console.warn('subscribeToUserTeams snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Create a new event-independent team atomically.
 *
 * IMPORTANT: Team creation NEVER selects an event.
 * A team is simply a team — event registration is a separate operation.
 */
export async function createTeam(
  leaderUid: string,
  leaderParticipantId: string,
  leaderFullName: string,
  leaderEmail: string,
  leaderCollege: string,
  leaderQrToken: string,
  teamName: string,
  memberCount: number,
  minTeamSize: number = 1,
  maxTeamSize: number = 10
): Promise<EventTeam> {
  const trimmedName = teamName.trim();
  if (!trimmedName) throw new Error('Team name cannot be empty.');
  if (!memberCount || memberCount < 1) throw new Error('Member count must be at least 1.');
  if (memberCount > 10) throw new Error('Member count cannot exceed 10.');

  const isUnique = await verifyUniqueTeamName(trimmedName);
  if (!isUnique) {
    throw new Error(`Team name "${trimmedName}" is already taken. Please choose a different name.`);
  }

  const teamCode = await generateUniqueTeamCode();
  const teamId = `TEAM-${teamCode}`;
  const now = new Date().toISOString();

  const leaderMember: RegistrationTeamMember = {
    uid: leaderUid,
    participantId: leaderParticipantId,
    fullName: leaderFullName,
    college: leaderCollege,
    isLeader: true,
  };

  const newTeam: EventTeam = {
    teamId,
    teamCode,
    teamName: trimmedName,
    leaderUid,
    leaderParticipantId,
    memberUids: [leaderUid],
    members: [leaderMember],
    memberCount,
    minTeamSize,
    maxTeamSize,
    status: 'FORMING',
    eventRegistrationStarted: false,
    createdAt: now,
    updatedAt: now,
  };

  const teamRef = doc(firestore, 'teams', teamId);
  const codeRef = doc(firestore, 'team_codes', teamCode);
  const partRef = doc(firestore, 'participants', leaderUid);

  await runTransaction(firestore, async (transaction) => {
    const pSnap = await transaction.get(partRef);
    if (!pSnap.exists()) throw new Error('Participant profile not found.');

    const pData = pSnap.data();
    const teamIds = (pData.teamIds as string[]) || [];

    // Write team document
    transaction.set(teamRef, {
      ...newTeam,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Write minimal team_code projection document (non-PII)
    transaction.set(codeRef, {
      teamId,
      teamCode,
      teamName: trimmedName,
      leaderUid,
      memberCount,
      currentMemberCount: 1,
      maxTeamSize,
      isLocked: false,
      isFull: 1 >= memberCount,
      updatedAt: serverTimestamp(),
    });

    // Update leader profile teamIds
    transaction.update(partRef, {
      teamIds: Array.from(new Set([...teamIds, teamId])),
      updatedAt: serverTimestamp(),
    });
  });

  return newTeam;
}

/**
 * Lock team composition after first event registration.
 * Sets eventRegistrationStarted = true to prevent adding/removing members.
 * This is called by eventRegistrationService when creating the first event registration.
 */
export async function lockTeamComposition(teamId: string): Promise<void> {
  const teamRef = doc(firestore, 'teams', teamId);
  const now = new Date().toISOString();
  await runTransaction(firestore, async (transaction) => {
    const snap = await transaction.get(teamRef);
    if (!snap.exists()) throw new Error('Team not found.');
    // Only lock if not already locked
    const data = snap.data() as EventTeam;
    if (!data.eventRegistrationStarted) {
      transaction.update(teamRef, {
        eventRegistrationStarted: true,
        status: 'LOCKED',
        lockedAt: now,
        updatedAt: serverTimestamp(),
      });
      const codeRef = doc(firestore, 'team_codes', data.teamCode);
      transaction.set(codeRef, { isLocked: true, updatedAt: serverTimestamp() }, { merge: true });
    }
  });
}

/**
 * Participant submits a PENDING join request using a team code
 */
export async function requestToJoinTeam(
  participantUid: string,
  participantId: string,
  fullName: string,
  email: string,
  college: string,
  _qrToken: string | undefined,
  rawTeamCode: string
): Promise<TeamJoinRequest> {
  const normalizedCode = rawTeamCode.trim().toUpperCase();
  if (!normalizedCode) throw new Error('Please enter a valid team code.');

  const codeRef = doc(firestore, 'team_codes', normalizedCode);
  const codeSnap = await getDoc(codeRef);

  let targetTeamId: string;
  let targetTeamCode: string;
  let targetTeamName: string;
  let targetLeaderUid: string;
  let currentMemberCount: number;
  let targetMemberCount: number;
  let targetMaxTeamSize: number;
  let isLocked: boolean;

  if (codeSnap.exists()) {
    const codeData = codeSnap.data();
    targetTeamId = codeData.teamId;
    targetTeamCode = codeData.teamCode || normalizedCode;
    targetTeamName = codeData.teamName;
    targetLeaderUid = codeData.leaderUid;
    currentMemberCount = codeData.currentMemberCount || 0;
    targetMemberCount = codeData.memberCount || 10;
    targetMaxTeamSize = codeData.maxTeamSize || 10;
    isLocked = !!codeData.isLocked;
  } else {
    // Fallback for pre-existing legacy teams before team_codes collection
    const teamsRef = collection(firestore, 'teams');
    const q = query(teamsRef, where('teamCode', '==', normalizedCode));
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error(`No squad found with team code "${normalizedCode}". Please verify the code and try again.`);
    }

    const teamData = snap.docs[0].data() as EventTeam;
    targetTeamId = teamData.teamId;
    targetTeamCode = teamData.teamCode;
    targetTeamName = teamData.teamName;
    targetLeaderUid = teamData.leaderUid;
    currentMemberCount = teamData.members.length;
    targetMemberCount = teamData.memberCount;
    targetMaxTeamSize = teamData.maxTeamSize;
    isLocked = !!teamData.eventRegistrationStarted;

    if (teamData.memberUids.includes(participantUid)) {
      throw new Error(`You are already a member of squad "${targetTeamName}".`);
    }
  }

  if (targetLeaderUid === participantUid) {
    throw new Error(`You are already the captain of squad "${targetTeamName}".`);
  }

  // Block new join requests if team composition is locked
  if (isLocked) {
    throw new Error(
      `Squad "${targetTeamName}" has already registered for an event and is now locked. New members cannot join a locked squad.`
    );
  }

  if (currentMemberCount >= targetMaxTeamSize) {
    throw new Error(`Squad "${targetTeamName}" is full (maximum ${targetMaxTeamSize} members allowed).`);
  }

  // Also check against the declared memberCount
  if (currentMemberCount >= targetMemberCount) {
    throw new Error(
      `Squad "${targetTeamName}" has reached its declared member count of ${targetMemberCount}. The team leader must update the squad to allow more members.`
    );
  }

  const requestId = `REQ-${targetTeamId}-${participantId}`;
  const reqRef = doc(firestore, 'team_join_requests', requestId);
  const reqSnap = await getDoc(reqRef);

  if (reqSnap.exists()) {
    const existing = reqSnap.data() as TeamJoinRequest;
    if (existing.status === 'PENDING') {
      throw new Error(`You already have a pending join request for squad "${targetTeamName}". Please wait for the team captain to review it.`);
    }
  }

  const now = new Date().toISOString();
  const joinReq: TeamJoinRequest = {
    requestId,
    teamId: targetTeamId,
    teamCode: targetTeamCode,
    leaderUid: targetLeaderUid,
    participantUid,
    participantId,
    fullName,
    college,
    status: 'PENDING',
    requestedAt: now,
  };

  await runTransaction(firestore, async (transaction) => {
    transaction.set(reqRef, {
      ...joinReq,
      requestedAt: serverTimestamp(),
    });
  });

  return joinReq;
}

/**
 * Fetch all join requests for teams led by a captain
 */
export async function getTeamJoinRequestsForLeader(leaderUid: string): Promise<TeamJoinRequest[]> {
  const reqsRef = collection(firestore, 'team_join_requests');
  const q = query(reqsRef, where('leaderUid', '==', leaderUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TeamJoinRequest);
}

/**
 * Fetch all join requests submitted by a participant
 */
export async function getParticipantJoinRequests(participantUid: string): Promise<TeamJoinRequest[]> {
  const reqsRef = collection(firestore, 'team_join_requests');
  const q = query(reqsRef, where('participantUid', '==', participantUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TeamJoinRequest);
}

/**
 * Team Captain approves a PENDING join request
 */
export async function approveJoinRequest(
  leaderUid: string,
  requestId: string
): Promise<{ team: EventTeam }> {
  const reqRef = doc(firestore, 'team_join_requests', requestId);

  return await runTransaction(firestore, async (transaction) => {
    // ── 1. READ ALL DOCUMENTS SEQUENTIALLY FIRST ──
    const reqSnap = await transaction.get(reqRef);
    if (!reqSnap.exists()) throw new Error('Join request not found.');
    const reqData = reqSnap.data() as TeamJoinRequest;

    if (reqData.status !== 'PENDING') {
      throw new Error(`This join request has already been ${reqData.status.toLowerCase()}.`);
    }

    const teamRef = doc(firestore, 'teams', reqData.teamId);
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists()) throw new Error('Team not found.');
    const teamData = teamSnap.data() as EventTeam;

    if (teamData.leaderUid !== leaderUid) {
      throw new Error('Only the team captain can approve join requests.');
    }

    // Block approval if team is already locked
    if (teamData.eventRegistrationStarted) {
      throw new Error(
        'Cannot approve new members. This squad has already registered for an event and is now locked.'
      );
    }

    if (teamData.memberUids.includes(reqData.participantUid)) {
      throw new Error('Participant is already a member of this team.');
    }

    if (teamData.members.length >= teamData.maxTeamSize) {
      throw new Error(`Cannot approve: Team "${teamData.teamName}" is full (max ${teamData.maxTeamSize} members).`);
    }

    // Block if already at declared memberCount
    if (teamData.members.length >= teamData.memberCount) {
      throw new Error(
        `Cannot approve: Team "${teamData.teamName}" has reached its declared member count of ${teamData.memberCount}.`
      );
    }

    const partRef = doc(firestore, 'participants', reqData.participantUid);

    // ── 2. PREPARE MUTATIONS (Strip email & qrToken from embedded member) ──
    const now = new Date().toISOString();
    const updatedMemberUids = [...teamData.memberUids, reqData.participantUid];
    const sanitizedExistingMembers = teamData.members.map((m) => {
      const { email, qrToken, ...rest } = m as any;
      return rest as RegistrationTeamMember;
    });

    const newMember: RegistrationTeamMember = {
      uid: reqData.participantUid,
      participantId: reqData.participantId,
      fullName: reqData.fullName,
      college: reqData.college,
      isLeader: false,
    };
    const updatedMembers = [...sanitizedExistingMembers, newMember];

    const updatedTeamStatus = updatedMembers.length >= teamData.minTeamSize ? 'CONFIRMED' : 'FORMING';

    // ── 3. EXECUTE WRITES ──
    transaction.update(teamRef, {
      memberUids: updatedMemberUids,
      members: updatedMembers,
      status: updatedTeamStatus,
      updatedAt: serverTimestamp(),
    });

    const codeRef = doc(firestore, 'team_codes', teamData.teamCode);
    transaction.set(
      codeRef,
      {
        teamId: teamData.teamId,
        teamCode: teamData.teamCode,
        teamName: teamData.teamName,
        leaderUid: teamData.leaderUid,
        memberCount: teamData.memberCount,
        currentMemberCount: updatedMembers.length,
        maxTeamSize: teamData.maxTeamSize,
        isLocked: teamData.eventRegistrationStarted || false,
        isFull: updatedMembers.length >= teamData.memberCount,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.update(partRef, {
      teamIds: arrayUnion(teamData.teamId),
      updatedAt: serverTimestamp(),
    });

    transaction.update(reqRef, {
      status: 'APPROVED',
      reviewedAt: now,
      reviewedBy: leaderUid,
      updatedAt: serverTimestamp(),
    });

    return {
      team: {
        ...teamData,
        memberUids: updatedMemberUids,
        members: updatedMembers,
        status: updatedTeamStatus as EventTeam['status'],
        updatedAt: now,
      },
    };
  });
}

/**
 * Team Captain rejects a PENDING join request
 */
export async function rejectJoinRequest(leaderUid: string, requestId: string): Promise<void> {
  const reqRef = doc(firestore, 'team_join_requests', requestId);

  await runTransaction(firestore, async (transaction) => {
    const snap = await transaction.get(reqRef);
    if (!snap.exists()) throw new Error('Join request not found.');

    const data = snap.data() as TeamJoinRequest;
    if (data.status !== 'PENDING') {
      throw new Error(`This join request has already been ${data.status.toLowerCase()}.`);
    }

    if (data.leaderUid !== leaderUid) {
      throw new Error('Only the team captain can reject join requests.');
    }

    const now = new Date().toISOString();
    transaction.update(reqRef, {
      status: 'REJECTED',
      reviewedAt: now,
      reviewedBy: leaderUid,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Team Captain renames their team
 */
export async function renameTeam(leaderUid: string, teamId: string, newTeamName: string): Promise<void> {
  const trimmed = newTeamName.trim();
  if (!trimmed) throw new Error('Team name cannot be empty.');

  const teamRef = doc(firestore, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error('Team not found.');

  const teamData = teamSnap.data() as EventTeam;
  if (teamData.leaderUid !== leaderUid) {
    throw new Error('Only the team captain can rename this squad.');
  }

  if (teamData.teamName.trim().toLowerCase() === trimmed.toLowerCase()) return;

  const isUnique = await verifyUniqueTeamName(trimmed, teamId);
  if (!isUnique) {
    throw new Error(`Team name "${trimmed}" is already taken. Please choose a different name.`);
  }

  const batch = writeBatch(firestore);
  batch.update(teamRef, {
    teamName: trimmed,
    updatedAt: serverTimestamp(),
  });

  const codeRef = doc(firestore, 'team_codes', teamData.teamCode);
  batch.set(codeRef, { teamName: trimmed, updatedAt: serverTimestamp() }, { merge: true });

  await batch.commit();
}

/**
 * Team Captain removes a member from their squad.
 * BLOCKED if the team has already started event registration.
 */
export async function removeMemberFromTeam(
  leaderUid: string,
  teamId: string,
  targetMemberUid: string
): Promise<EventTeam> {
  const teamRef = doc(firestore, 'teams', teamId);
  const partRef = doc(firestore, 'participants', targetMemberUid);

  return await runTransaction(firestore, async (transaction) => {
    // ── 1. READ ALL DOCUMENTS SEQUENTIALLY FIRST ──
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists()) throw new Error('Team not found.');
    const teamData = teamSnap.data() as EventTeam;

    if (teamData.leaderUid !== leaderUid) {
      throw new Error('Only the team captain can remove squad members.');
    }

    if (targetMemberUid === leaderUid) {
      throw new Error('The team captain cannot be removed from the squad roster.');
    }

    // Enforce team lock — composition cannot change after event registration
    if (teamData.eventRegistrationStarted) {
      throw new Error(
        'Team composition is locked. This squad has already registered for an event. Members cannot be added or removed.'
      );
    }

    const targetMember = teamData.members.find((m) => m.uid === targetMemberUid);
    if (!targetMember) throw new Error('Member not found in squad roster.');

    const reqId = `REQ-${teamId}-${targetMember.participantId}`;
    const reqRef = doc(firestore, 'team_join_requests', reqId);
    const reqSnap = await transaction.get(reqRef);

    // ── 2. PREPARE MUTATIONS (Strip email & qrToken) ──
    const updatedMemberUids = teamData.memberUids.filter((uid) => uid !== targetMemberUid);
    const updatedMembers = teamData.members
      .filter((m) => m.uid !== targetMemberUid)
      .map((m) => {
        const { email, qrToken, ...rest } = m as any;
        return rest as RegistrationTeamMember;
      });
    const updatedStatus = updatedMembers.length >= teamData.minTeamSize ? 'CONFIRMED' : 'FORMING';

    // ── 3. EXECUTE WRITES ──
    transaction.update(teamRef, {
      memberUids: updatedMemberUids,
      members: updatedMembers,
      status: updatedStatus,
      updatedAt: serverTimestamp(),
    });

    const codeRef = doc(firestore, 'team_codes', teamData.teamCode);
    transaction.set(
      codeRef,
      {
        currentMemberCount: updatedMembers.length,
        isFull: updatedMembers.length >= teamData.memberCount,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.update(partRef, {
      teamIds: arrayRemove(teamId),
      updatedAt: serverTimestamp(),
    });

    if (reqSnap.exists()) {
      transaction.update(reqRef, {
        status: 'REJECTED',
        reviewedAt: new Date().toISOString(),
        reviewedBy: leaderUid,
        updatedAt: serverTimestamp(),
      });
    }

    return {
      ...teamData,
      memberUids: updatedMemberUids,
      members: updatedMembers,
      status: updatedStatus as EventTeam['status'],
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Squad member voluntarily leaves a squad.
 * BLOCKED if the team has already started event registration.
 */
export async function leaveTeam(memberUid: string, teamId: string): Promise<void> {
  const teamRef = doc(firestore, 'teams', teamId);
  const partRef = doc(firestore, 'participants', memberUid);

  return await runTransaction(firestore, async (transaction) => {
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists()) throw new Error('Team not found.');
    const teamData = teamSnap.data() as EventTeam;

    if (teamData.leaderUid === memberUid) {
      throw new Error('Team captain cannot leave the squad. Use "Disband Squad" to delete the team.');
    }

    const member = teamData.members.find((m) => m.uid === memberUid);
    if (!member) throw new Error('You are not a member of this squad.');

    // Enforce team lock — composition cannot change after event registration
    if (teamData.eventRegistrationStarted) {
      throw new Error(
        'Team composition is locked. This squad has already registered for an event. You cannot leave a locked squad.'
      );
    }

    const partSnap = await transaction.get(partRef);

    const updatedMemberUids = teamData.memberUids.filter((uid) => uid !== memberUid);
    const updatedMembers = teamData.members
      .filter((m) => m.uid !== memberUid)
      .map((m) => {
        const { email, qrToken, ...rest } = m as any;
        return rest as RegistrationTeamMember;
      });
    const updatedStatus = updatedMembers.length >= teamData.minTeamSize ? 'CONFIRMED' : 'FORMING';

    transaction.update(teamRef, {
      memberUids: updatedMemberUids,
      members: updatedMembers,
      status: updatedStatus,
      updatedAt: serverTimestamp(),
    });

    const codeRef = doc(firestore, 'team_codes', teamData.teamCode);
    transaction.set(
      codeRef,
      {
        currentMemberCount: updatedMembers.length,
        isFull: updatedMembers.length >= teamData.memberCount,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (partSnap.exists()) {
      const pData = partSnap.data();
      const teamIds = ((pData.teamIds as string[]) || []).filter((id) => id !== teamId);
      transaction.update(partRef, {
        teamIds,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/**
 * Team Captain disbands and deletes the squad cleanly and atomically.
 * BLOCKED if the team has already started event registration
 * (to protect registered participants from losing their registrations).
 */
export async function deleteTeam(
  leaderUid: string,
  teamId: string
): Promise<{ success: boolean; message: string }> {
  const teamRef = doc(firestore, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) {
    throw new Error('Team not found.');
  }
  const teamData = teamSnap.data() as EventTeam;
  if (teamData.leaderUid !== leaderUid) {
    throw new Error('Only the team captain can disband this squad.');
  }

  // Cannot disband after event registration — registrations would become orphaned
  if (teamData.eventRegistrationStarted) {
    throw new Error(
      'Cannot disband this squad. The team has already registered for an event. Contact the TARAS Registration Team if you need to cancel.'
    );
  }

  const allowedStatuses = ['FORMING', 'CONFIRMED', 'READY'];
  if (teamData.status && !allowedStatuses.includes(teamData.status)) {
    throw new Error(`Cannot disband squad in status "${teamData.status}".`);
  }

  let teamPendingReqs: TeamJoinRequest[] = [];
  try {
    const joinReqs = await getTeamJoinRequestsForLeader(leaderUid);
    teamPendingReqs = joinReqs.filter((r) => r.teamId === teamId);
  } catch (err) {
    console.warn('Error fetching join requests for disband:', err);
  }

  const memberUids = teamData.members.map((m) => m.uid);

  return await runTransaction(firestore, async (transaction) => {
    // ── 1. READ ALL DOCUMENTS SEQUENTIALLY FIRST ──
    const tSnap = await transaction.get(teamRef);
    if (!tSnap.exists()) throw new Error('Team not found.');

    const qSnaps = [];
    for (const qReq of teamPendingReqs) {
      const qSnap = await transaction.get(doc(firestore, 'team_join_requests', qReq.requestId));
      qSnaps.push(qSnap);
    }

    // ── 2. EXECUTE WRITES ──
    // A. Reject pending join requests
    const now = new Date().toISOString();
    qSnaps.forEach((qSnap, i) => {
      if (qSnap.exists()) {
        transaction.update(doc(firestore, 'team_join_requests', teamPendingReqs[i].requestId), {
          status: 'REJECTED',
          reviewedAt: now,
          reviewedBy: leaderUid,
          updatedAt: serverTimestamp(),
        });
      }
    });

    // B. Update all member profiles (remove teamId reference)
    memberUids.forEach((mUid) => {
      transaction.update(doc(firestore, 'participants', mUid), {
        teamIds: arrayRemove(teamId),
        updatedAt: serverTimestamp(),
      });
    });

    // C. Delete team document and code projection document
    transaction.delete(teamRef);
    const codeRef = doc(firestore, 'team_codes', teamData.teamCode);
    transaction.delete(codeRef);

    return {
      success: true,
      message: `Squad "${teamData.teamName}" has been disbanded successfully.`,
    };
  });
}
