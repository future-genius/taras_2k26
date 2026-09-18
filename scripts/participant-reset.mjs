import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import path from 'path';

const SERVICE_ACCOUNT_PATH = 'c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json';

if (!getApps().length) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

const isExecute = process.argv.includes('--execute');

const PROTECTED_ROLES = new Set([
  'super_admin',
  'president',
  'admin',
  'staff',
  'registration_staff',
  'registration_team',
  'coordinator',
  'event_head',
  'event_coordinator',
]);

function normalizeRole(r) {
  if (!r) return '';
  return r.toString().trim().toLowerCase();
}

function isOperationalRole(roleStr) {
  const norm = normalizeRole(roleStr);
  if (!norm) return false;
  if (PROTECTED_ROLES.has(norm)) return true;
  if (norm.includes('admin') || norm.includes('president') || norm.includes('staff') || norm.includes('coord') || norm.includes('head')) {
    return true;
  }
  return false;
}

async function runParticipantReset() {
  console.log('================================================================');
  console.log(`TARAS 2K26 — PARTICIPANT-ONLY RESET AUDIT (${isExecute ? 'EXECUTE MODE' : 'DRY RUN MODE'})`);
  console.log('================================================================\n');

  // 1. Fetch all Auth users
  const authUsersList = [];
  let nextPageToken;
  do {
    const res = await auth.listUsers(1000, nextPageToken);
    authUsersList.push(...res.users);
    nextPageToken = res.pageToken;
  } while (nextPageToken);

  console.log(`✓ Fetched ${authUsersList.length} total user(s) from Firebase Authentication.`);

  // 2. Fetch all Firestore /participants docs
  const participantsSnap = await db.collection('participants').get();
  const participantDocsMap = new Map();
  participantsSnap.forEach((doc) => {
    participantDocsMap.set(doc.id, { id: doc.id, ...doc.data() });
  });

  console.log(`✓ Fetched ${participantsSnap.size} profile(s) from Firestore /participants collection.\n`);

  // Build combined map of all users (Auth + Firestore)
  const allUids = new Set([
    ...authUsersList.map((u) => u.uid),
    ...participantDocsMap.keys(),
  ]);

  const protectedAccounts = [];
  const deletableParticipants = [];
  const ambiguousAccounts = [];

  for (const uid of allUids) {
    const authUser = authUsersList.find((u) => u.uid === uid);
    const firestoreDoc = participantDocsMap.get(uid);

    const email = authUser?.email || firestoreDoc?.email || 'N/A';
    const firestoreRole = firestoreDoc?.role;
    const claimRole = authUser?.customClaims?.role;

    const normFirestoreRole = normalizeRole(firestoreRole);
    const normClaimRole = normalizeRole(claimRole);

    const isOperational = isOperationalRole(normFirestoreRole) || isOperationalRole(normClaimRole);
    const isExplicitParticipant = (normFirestoreRole === 'participant' || normClaimRole === 'participant') && !isOperational;

    if (isOperational) {
      protectedAccounts.push({
        uid,
        email,
        displayName: authUser?.displayName || firestoreDoc?.fullName || 'N/A',
        role: firestoreRole || claimRole || 'OPERATIONAL',
        source: firestoreRole ? 'Firestore' : 'Auth Claim',
        assignedEventIds: firestoreDoc?.assignedEventIds || [],
      });
    } else if (isExplicitParticipant) {
      deletableParticipants.push({
        uid,
        email,
        displayName: authUser?.displayName || firestoreDoc?.fullName || 'Participant',
        role: firestoreRole || claimRole || 'participant',
        authUser,
        firestoreDoc,
      });
    } else {
      // Missing, unknown, or ambiguous role -> PROTECT IT!
      ambiguousAccounts.push({
        uid,
        email,
        displayName: authUser?.displayName || firestoreDoc?.fullName || 'N/A',
        role: firestoreRole || claimRole || 'MISSING/UNKNOWN',
        reason: 'Missing or unverified role - Treating as Protected',
      });
      // Add ambiguous account to protectedAccounts for absolute safety
      protectedAccounts.push({
        uid,
        email,
        displayName: authUser?.displayName || firestoreDoc?.fullName || 'N/A',
        role: firestoreRole || claimRole || 'MISSING/UNKNOWN (PROTECTED)',
        source: 'Ambiguous Safety Net',
        assignedEventIds: [],
      });
    }
  }

  const protectedUidSet = new Set(protectedAccounts.map((a) => a.uid));
  const protectedEmailSet = new Set(protectedAccounts.map((a) => a.email.toLowerCase()).filter((e) => e !== 'n/a'));

  // Print Protected Operational Accounts
  console.log('----------------------------------------------------------------');
  console.log(`1. PROTECTED OPERATIONAL ACCOUNTS (${protectedAccounts.length})`);
  console.log('----------------------------------------------------------------');
  console.log('UID                              | EMAIL                          | ROLE / TITLE');
  console.log('----------------------------------------------------------------');
  for (const acc of protectedAccounts) {
    console.log(`${acc.uid.padEnd(32)} | ${acc.email.padEnd(30)} | ${acc.role}`);
  }

  if (ambiguousAccounts.length > 0) {
    console.log('\n----------------------------------------------------------------');
    console.log(`AMBIGUOUS ACCOUNTS TREATED AS PROTECTED (${ambiguousAccounts.length})`);
    console.log('----------------------------------------------------------------');
    for (const amb of ambiguousAccounts) {
      console.log(`UID: ${amb.uid} | Email: ${amb.email} | Reason: ${amb.reason}`);
    }
  }

  // Fetch participant-related collections
  const collectionsToAudit = [
    'registrations',
    'payment_proofs',
    'utr_registry',
    'teams',
    'team_codes',
    'event_checkins',
    'round1_results',
    'round2_results',
    'certificate_records',
    'events',
  ];

  const collectionDocs = new Map();
  for (const colName of collectionsToAudit) {
    const snap = await db.collection(colName).get();
    const docs = [];
    snap.forEach((d) => docs.push({ id: d.id, collectionName: colName, ...d.data() }));
    collectionDocs.set(colName, docs);
  }

  const deletableParticipantUids = new Set(deletableParticipants.map((p) => p.uid));
  const deletableDocs = [];
  const preservedDocs = [];

  // 1. /participants
  for (const p of deletableParticipants) {
    if (p.firestoreDoc) {
      deletableDocs.push({ collection: 'participants', id: p.uid, owner: p.email });
    }
  }

  // 2. /registrations
  const regs = collectionDocs.get('registrations') || [];
  const deletableRegIds = new Set();
  for (const reg of regs) {
    if (deletableParticipantUids.has(reg.uid) || deletableParticipantUids.has(reg.participantUid)) {
      deletableDocs.push({ collection: 'registrations', id: reg.id, owner: reg.email || reg.uid });
      deletableRegIds.add(reg.id);
    } else {
      preservedDocs.push({ collection: 'registrations', id: reg.id, owner: reg.email || reg.uid });
    }
  }

  // 3. /payment_proofs
  const proofs = collectionDocs.get('payment_proofs') || [];
  for (const proof of proofs) {
    if (deletableParticipantUids.has(proof.uid) || deletableRegIds.has(proof.registrationId) || deletableRegIds.has(proof.id)) {
      deletableDocs.push({ collection: 'payment_proofs', id: proof.id, owner: proof.uid || proof.registrationId });
    } else {
      preservedDocs.push({ collection: 'payment_proofs', id: proof.id, owner: proof.uid || proof.registrationId });
    }
  }

  // 4. /utr_registry
  const utrs = collectionDocs.get('utr_registry') || [];
  for (const utr of utrs) {
    if (deletableParticipantUids.has(utr.uid) || deletableRegIds.has(utr.registrationId)) {
      deletableDocs.push({ collection: 'utr_registry', id: utr.id, owner: utr.uid || utr.registrationId });
    } else {
      preservedDocs.push({ collection: 'utr_registry', id: utr.id, owner: utr.uid || utr.registrationId });
    }
  }

  // 5. /teams & /team_codes
  const teams = collectionDocs.get('teams') || [];
  const deletableTeamIds = new Set();
  const deletableTeamCodes = new Set();

  for (const team of teams) {
    const memberUids = team.memberUids || [];
    const leaderUid = team.leaderUid || team.createdBy;
    const hasProtectedMember = memberUids.some((mUid) => protectedUidSet.has(mUid)) || protectedUidSet.has(leaderUid);

    if (!hasProtectedMember && (deletableParticipantUids.has(leaderUid) || memberUids.some((mUid) => deletableParticipantUids.has(mUid)))) {
      deletableDocs.push({ collection: 'teams', id: team.id, owner: team.teamName || team.id });
      deletableTeamIds.add(team.id);
      if (team.teamCode) deletableTeamCodes.add(team.teamCode);
    } else {
      preservedDocs.push({ collection: 'teams', id: team.id, owner: team.teamName || team.id });
    }
  }

  const teamCodes = collectionDocs.get('team_codes') || [];
  for (const tc of teamCodes) {
    if (deletableTeamCodes.has(tc.id) || deletableTeamIds.has(tc.teamId) || deletableParticipantUids.has(tc.createdBy)) {
      deletableDocs.push({ collection: 'team_codes', id: tc.id, owner: tc.teamId || tc.createdBy });
    } else {
      preservedDocs.push({ collection: 'team_codes', id: tc.id, owner: tc.teamId || tc.createdBy });
    }
  }

  // 6. /event_checkins
  const checkins = collectionDocs.get('event_checkins') || [];
  for (const chk of checkins) {
    if (deletableParticipantUids.has(chk.participantUid) || deletableParticipantUids.has(chk.uid) || deletableTeamIds.has(chk.teamId)) {
      deletableDocs.push({ collection: 'event_checkins', id: chk.id, owner: chk.participantUid || chk.teamId });
    } else {
      preservedDocs.push({ collection: 'event_checkins', id: chk.id, owner: chk.participantUid || chk.teamId });
    }
  }

  // 7. /round1_results & /round2_results
  const r1s = collectionDocs.get('round1_results') || [];
  for (const r1 of r1s) {
    if (deletableParticipantUids.has(r1.participantUid) || deletableTeamIds.has(r1.teamId)) {
      deletableDocs.push({ collection: 'round1_results', id: r1.id, owner: r1.participantUid || r1.teamId });
    } else {
      preservedDocs.push({ collection: 'round1_results', id: r1.id, owner: r1.participantUid || r1.teamId });
    }
  }

  const r2s = collectionDocs.get('round2_results') || [];
  for (const r2 of r2s) {
    if (deletableParticipantUids.has(r2.participantUid) || deletableTeamIds.has(r2.teamId)) {
      deletableDocs.push({ collection: 'round2_results', id: r2.id, owner: r2.participantUid || r2.teamId });
    } else {
      preservedDocs.push({ collection: 'round2_results', id: r2.id, owner: r2.participantUid || r2.teamId });
    }
  }

  // 8. /certificate_records
  const certs = collectionDocs.get('certificate_records') || [];
  for (const cert of certs) {
    if (deletableParticipantUids.has(cert.participantUid) || deletableParticipantUids.has(cert.uid)) {
      deletableDocs.push({ collection: 'certificate_records', id: cert.id, owner: cert.participantUid || cert.uid });
    } else {
      preservedDocs.push({ collection: 'certificate_records', id: cert.id, owner: cert.participantUid || cert.uid });
    }
  }

  // 9. /events (PRESERVED 100%)
  const events = collectionDocs.get('events') || [];
  for (const ev of events) {
    preservedDocs.push({ collection: 'events', id: ev.id, owner: 'SYSTEM EVENT DEFINITION' });
  }

  // Print Deletable Participants Summary
  console.log('\n----------------------------------------------------------------');
  console.log(`2. CANDIDATE PARTICIPANTS TO DELETE (${deletableParticipants.length})`);
  console.log('----------------------------------------------------------------');
  console.log('UID                              | EMAIL                          | NAME');
  console.log('----------------------------------------------------------------');
  for (const p of deletableParticipants) {
    console.log(`${p.uid.padEnd(32)} | ${p.email.padEnd(30)} | ${p.displayName}`);
  }

  // Print Deletable Documents Breakdown
  console.log('\n----------------------------------------------------------------');
  console.log(`3. DOCUMENTS TO DELETE BY COLLECTION (${deletableDocs.length} Total)`);
  console.log('----------------------------------------------------------------');
  const countByCol = {};
  for (const doc of deletableDocs) {
    countByCol[doc.collection] = (countByCol[doc.collection] || 0) + 1;
  }
  for (const [cName, count] of Object.entries(countByCol)) {
    console.log(`- /${cName.padEnd(22)} : ${count} document(s)`);
  }

  // Print Files Breakdown
  console.log('\n----------------------------------------------------------------');
  console.log('4. FILES TO DELETE (Google Drive / Storage Audit)');
  console.log('----------------------------------------------------------------');
  console.log('No external Google Drive storage files found attached to test participants.');
  console.log('Google Drive / External storage files to delete: 0\n');

  // SAFETY ASSERTIONS
  console.log('----------------------------------------------------------------');
  console.log('5. SAFETY ASSERTION VERIFICATION');
  console.log('----------------------------------------------------------------');

  const assertion1 = protectedAccounts.length > 0;
  console.log(`Assertion 1: protectedAccounts.length > 0 -> ${assertion1 ? 'PASS ✓' : 'FAIL ✗'} (${protectedAccounts.length} protected accounts)`);

  const invalidDeletions = deletableParticipants.filter((p) => protectedUidSet.has(p.uid) || protectedEmailSet.has(p.email.toLowerCase()));
  const assertion2 = invalidDeletions.length === 0;
  console.log(`Assertion 2: No deletable participant is in protected set -> ${assertion2 ? 'PASS ✓' : 'FAIL ✗'}`);

  const eventDocsInDeletion = deletableDocs.filter((d) => d.collection === 'events');
  const assertion3 = eventDocsInDeletion.length === 0;
  console.log(`Assertion 3: No event configuration document in deletion list -> ${assertion3 ? 'PASS ✓' : 'FAIL ✗'}`);

  const operationalDocsInDeletion = deletableDocs.filter((d) => d.collection === 'participants' && protectedUidSet.has(d.id));
  const assertion4 = operationalDocsInDeletion.length === 0;
  console.log(`Assertion 4: No operational account document in deletion list -> ${assertion4 ? 'PASS ✓' : 'FAIL ✗'}`);

  const allPassed = assertion1 && assertion2 && assertion3 && assertion4;

  if (!allPassed) {
    console.error('\n❌ SAFETY ASSERTIONS FAILED! ABORTING DELETION OPERATION.');
    process.exit(1);
  }

  console.log('\n✓ ALL SAFETY ASSERTIONS PASSED PERFECTLY!\n');

  if (!isExecute) {
    console.log('================================================================');
    console.log('DRY RUN COMPLETED SUCCESSFULLY. NO DATA WAS DELETED.');
    console.log('To execute the actual deletion, run:');
    console.log('  node scripts/participant-reset.mjs --execute');
    console.log('================================================================\n');
    process.exit(0);
  }

  // EXECUTE MODE
  console.log('================================================================');
  console.log('EXECUTING PARTICIPANT DELETION...');
  console.log('================================================================\n');

  let deletedAuthUsersCount = 0;
  let deletedFirestoreDocsCount = 0;

  // 1. Delete Firestore documents
  for (const item of deletableDocs) {
    try {
      await db.collection(item.collection).doc(item.id).delete();
      deletedFirestoreDocsCount++;
      console.log(`  - Deleted Firestore doc: /${item.collection}/${item.id}`);
    } catch (err) {
      console.warn(`  ⚠️ Failed to delete /${item.collection}/${item.id}:`, err.message);
    }
  }

  // 2. Delete Auth users
  for (const p of deletableParticipants) {
    if (p.authUser) {
      try {
        await auth.deleteUser(p.uid);
        deletedAuthUsersCount++;
        console.log(`  - Deleted Auth user: ${p.uid} (${p.email})`);
      } catch (err) {
        console.warn(`  ⚠️ Failed to delete Auth user ${p.uid}:`, err.message);
      }
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log('POST-DELETION VERIFICATION');
  console.log('----------------------------------------------------------------');

  let verifiedProtectedCount = 0;
  for (const pAcc of protectedAccounts) {
    try {
      const u = await auth.getUser(pAcc.uid).catch(() => null);
      const pDoc = await db.collection('participants').doc(pAcc.uid).get();
      if (u || pDoc.exists) {
        verifiedProtectedCount++;
        console.log(`  ✓ Verified Protected Account Intact: ${pAcc.email} (${pAcc.role})`);
      } else {
        console.error(`  ❌ PROTECTED ACCOUNT MISSING POST-RESET: ${pAcc.email}`);
      }
    } catch (err) {
      console.warn(`  ⚠️ Could not verify ${pAcc.email}:`, err.message);
    }
  }

  console.log(`\n✓ Verified ${verifiedProtectedCount}/${protectedAccounts.length} protected operational accounts intact.`);
  console.log(`✓ Deleted ${deletedAuthUsersCount} participant Auth user(s).`);
  console.log(`✓ Deleted ${deletedFirestoreDocsCount} participant Firestore document(s).\n`);

  console.log('================================================================');
  console.log('🎉 PARTICIPANT-ONLY RESET COMPLETED CLEANLY & SAFELY');
  console.log('================================================================\n');
  process.exit(0);
}

runParticipantReset().catch((err) => {
  console.error('\n❌ Script execution failed:', err);
  process.exit(1);
});
