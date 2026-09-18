const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc, runTransaction, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');

async function main() {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  
  const testEnv = await initializeTestEnvironment({
    projectId: 'taras-2k26-test-' + Date.now(),
    firestore: { rules }
  });

  const leaderUid = 'user123';
  const participantUid = 'user456';
  const teamId = 'TEAM-123';
  const teamCode = '123';
  const requestId = 'REQ-123';

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'teams', teamId), {
      teamId,
      teamCode,
      leaderUid,
      memberUids: [leaderUid],
      members: [{ uid: leaderUid, isLeader: true }],
      status: 'FORMING',
      eventRegistrationStarted: false,
      memberCount: 2,
      maxTeamSize: 3,
      minTeamSize: 2
    });

    await setDoc(doc(db, 'team_codes', teamCode), {
      teamId,
      teamCode,
      leaderUid,
      memberCount: 2,
      currentMemberCount: 1,
      isLocked: false
    });

    await setDoc(doc(db, 'team_join_requests', requestId), {
      requestId,
      teamId,
      leaderUid,
      participantUid,
      status: 'PENDING'
    });
  });

  const leaderContext = testEnv.authenticatedContext(leaderUid);
  const db = leaderContext.firestore();

  try {
    await runTransaction(db, async (transaction) => {
      const teamRef = doc(db, 'teams', teamId);
      const codeRef = doc(db, 'team_codes', teamCode);
      const reqRef = doc(db, 'team_join_requests', requestId);

      const teamSnap = await transaction.get(teamRef);
      const reqSnap = await transaction.get(reqRef);

      const updatedMemberUids = [leaderUid, participantUid];
      const updatedMembers = [
        { uid: leaderUid, isLeader: true },
        { uid: participantUid, isLeader: false }
      ];

      transaction.update(teamRef, {
        memberUids: updatedMemberUids,
        members: updatedMembers,
        status: 'CONFIRMED',
      });

      transaction.set(codeRef, {
        teamId,
        teamCode,
        leaderUid,
        currentMemberCount: 2,
        isFull: true
      }, { merge: true });

      transaction.update(reqRef, {
        status: 'APPROVED',
        reviewedBy: leaderUid,
      });
    });
    console.log("SUCCESS!");
  } catch (error) {
    console.error("FAILED!", error);
  }

  await testEnv.cleanup();
}

main().catch(console.error);
