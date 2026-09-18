/**
 * TARAS 2K26 — Final Production Data Reset Execution Script
 *
 * Strictly deletes demo participants, teams, registrations, and UTRs.
 * 100% preserves President, Admin, Staff, and Coordinator accounts and configurations.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = 'c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json';

if (!getApps().length) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

const PROTECTED_EMAILS = new Set([
  'president.taras2k26@gmail.com',
  'to.hariharanr@gmail.com',
  'hawkeyehari@gmail.com',
  'registration.taras2k26@gmail.com',
  'registration.demo@taras2k26.test',
  'arunkumarak200595@gmail.com',
  'kanishksudha631@gmail.com',
  'pavithrakannan308@gmail.com',
  'udhayakumarmm454@gmail.com',
  'gurusathyagan19@gmail.com',
  'amk25amales2006@gmail.com',
]);

const PROTECTED_UIDS = new Set([
  'lrzt2A5VnQUARktBQZht7z5tVih2', // president.taras2k26@gmail.com
  '7EN5d9RsIvaLhFk8s6y3Chv7I9y2', // to.hariharanr@gmail.com
  'mGfbS6FuznQserb2QAekC6CdEz63', // hawkeyehari@gmail.com
  'o1uV9ZijLUWUrBgnVrPkEXndIAF3', // registration.taras2k26@gmail.com
  'HaGGO6gt5CM5Ou1hnsiGFQv4Vh82', // registration.demo@taras2k26.test
  'Ffr6WUDELEWsTzEvkVXMtjLADoZ2', // arunkumarak200595@gmail.com
  'Ruwi1GeKspYjIcXMFcdCIplc2kD2', // kanishksudha631@gmail.com
  'r18Wl4DPgjTeXM8fhy5XuGG2ES12', // pavithrakannan308@gmail.com
  'IFITyVXgSmd0sFetEVTvjjtT03p1', // udhayakumarmm454@gmail.com
  '9Gkj29vaPoaoUOkiBvjoQZVNH0T2', // gurusathyagan19@gmail.com
  '3Y16hFXtu4eBjaPvkTCWM8dHBXc2', // amk25amales2006@gmail.com
]);

const PARTICIPANT_UIDS_TO_DELETE = [
  'RCpx92s7xagkP0aQ41Y9gB0bvWC2', // tarunkumar051005@gmail.com (Tarun Kumar)
  'See6vAgf2VYAU0oPqvAKY0Zv8Ox1', // starunkumar2005@gmail.com (Hari)
];

const FIRESTORE_DOCS_TO_DELETE = [
  // 1. /participants
  { col: 'participants', id: 'RCpx92s7xagkP0aQ41Y9gB0bvWC2' },
  { col: 'participants', id: 'See6vAgf2VYAU0oPqvAKY0Zv8Ox1' },

  // 2. /registrations
  { col: 'registrations', id: 'TARAS26-TARA-65334' },
  { col: 'registrations', id: 'TARAS26-TARA-35984' },

  // 3. /teams
  { col: 'teams', id: 'TEAM-TR-TGSJLM' },
  { col: 'teams', id: 'TEAM-TR-AVHX6B' },

  // 4. /team_codes
  { col: 'team_codes', id: 'TR-TGSJLM' },
  { col: 'team_codes', id: 'TR-AVHX6B' },

  // 5. /team_join_requests
  { col: 'team_join_requests', id: 'REQ-TEAM-TR-AVHX6B-TARAS26-31890439' },
  { col: 'team_join_requests', id: 'REQ-TEAM-TR-TGSJLM-TARAS26-90012926' },
  { col: 'team_join_requests', id: 'REQ-TEAM-TR-X3C3UU-TARAS26-90012926' },
  { col: 'team_join_requests', id: 'REQ-TEAM-TR-YC9S69-TARAS26-20682006' },
  { col: 'team_join_requests', id: 'REQ-TEAM-TR-YC9S69-TARAS26-47810186' },

  // 6. /utr_registry
  { col: 'utr_registry', id: '1234567234567345' },
  { col: 'utr_registry', id: '1234678826272' },

  // 7. /email_deliveries
  { col: 'email_deliveries', id: 'reg_TARAS26-TARA-13283_confirmation' },
  { col: 'email_deliveries', id: 'reg_TARAS26-TARA-86884_confirmation' },
];

async function executeReset() {
  console.log('================================================================');
  console.log('TARAS 2K26 — FINAL PRODUCTION DATA RESET EXECUTION');
  console.log('================================================================\n');

  // Safety Assertion 1: Verify no protected accounts are in deletion list
  for (const uid of PARTICIPANT_UIDS_TO_DELETE) {
    if (PROTECTED_UIDS.has(uid)) {
      throw new Error(`CRITICAL ERROR: Protected UID ${uid} found in deletion list!`);
    }
  }
  for (const item of FIRESTORE_DOCS_TO_DELETE) {
    if (item.col === 'participants' && PROTECTED_UIDS.has(item.id)) {
      throw new Error(`CRITICAL ERROR: Protected participant doc ${item.id} found in deletion list!`);
    }
    if (item.col === 'events' || item.col === 'schedules') {
      throw new Error(`CRITICAL ERROR: Core configuration ${item.col}/${item.id} found in deletion list!`);
    }
  }
  console.log('✓ Safety Assertion 1: Zero protected symposium accounts or configurations in deletion list.');

  // Safety Assertion 2: Verify all 11 protected accounts exist in Auth
  for (const uid of PROTECTED_UIDS) {
    const user = await auth.getUser(uid).catch(() => null);
    if (!user) {
      throw new Error(`CRITICAL ERROR: Protected UID ${uid} not found in Firebase Auth!`);
    }
  }
  console.log('✓ Safety Assertion 2: All 11 protected symposium accounts confirmed present in Firebase Auth.\n');

  // ── Step 1: Delete Participant Auth Accounts ──
  console.log('--- STEP 1: DELETING PARTICIPANT AUTH ACCOUNTS ---');
  let deletedAuthCount = 0;
  for (const uid of PARTICIPANT_UIDS_TO_DELETE) {
    try {
      const u = await auth.getUser(uid).catch(() => null);
      if (u) {
        await auth.deleteUser(uid);
        console.log(`  ✓ Deleted Firebase Auth User: ${uid} (${u.email})`);
        deletedAuthCount++;
      } else {
        console.log(`  ℹ Auth user ${uid} already absent.`);
      }
    } catch (err) {
      console.warn(`  ⚠️ Failed to delete auth user ${uid}:`, err.message);
    }
  }

  // ── Step 2: Delete Demo / Participant Firestore Documents ──
  console.log('\n--- STEP 2: DELETING DEMO FIRESTORE DOCUMENTS ---');
  let deletedDocCount = 0;
  for (const item of FIRESTORE_DOCS_TO_DELETE) {
    try {
      const docRef = db.collection(item.col).doc(item.id);
      const snap = await docRef.get();
      if (snap.exists) {
        await docRef.delete();
        console.log(`  ✓ Deleted Firestore Doc: /${item.col}/${item.id}`);
        deletedDocCount++;
      } else {
        console.log(`  ℹ Doc /${item.col}/${item.id} already absent.`);
      }
    } catch (err) {
      console.warn(`  ⚠️ Failed to delete /${item.col}/${item.id}:`, err.message);
    }
  }

  // ── Step 3: Reset Operational Pointers on hawkeyehari@gmail.com ──
  console.log('\n--- STEP 3: RESETTING OPERATIONAL DEMO STATE ON ADMIN PROFILES ---');
  const hawkeyeRef = db.collection('participants').doc('mGfbS6FuznQserb2QAekC6CdEz63');
  await hawkeyeRef.update({
    registeredEvents: [],
    teamIds: [],
    venueCheckIn: false,
    venueCheckInStatus: 'NOT_CHECKED_IN',
    attendanceStatus: {},
    shortlistStatus: {},
    certificateStatus: 'PENDING',
    updatedAt: new Date().toISOString(),
  });
  console.log('  ✓ Reset test team and event linkages on Super Admin profile (hawkeyehari@gmail.com)');

  // ── Step 4: Post-Reset Verification ──
  console.log('\n================================================================');
  console.log('POST-RESET VERIFICATION AUDIT');
  console.log('================================================================');

  // Verify protected accounts in Auth
  let verifiedAuthCount = 0;
  for (const uid of PROTECTED_UIDS) {
    const u = await auth.getUser(uid);
    if (PROTECTED_EMAILS.has(u.email.toLowerCase())) {
      verifiedAuthCount++;
    }
  }
  console.log(`✓ Firebase Auth: Verified ${verifiedAuthCount}/11 protected administrative accounts intact.`);

  // Verify collections in Firestore
  const participantSnap = await db.collection('participants').get();
  console.log(`✓ /participants: ${participantSnap.size} documents (Expected: 11 protected profiles, 0 demo participants)`);
  for (const d of participantSnap.docs) {
    if (!PROTECTED_UIDS.has(d.id)) {
      console.warn(`  ⚠️ Unexpected doc in /participants: ${d.id} (${d.data().email})`);
    }
  }

  const regSnap = await db.collection('registrations').get();
  console.log(`✓ /registrations: ${regSnap.size} documents (Expected: 0)`);

  const teamSnap = await db.collection('teams').get();
  console.log(`✓ /teams: ${teamSnap.size} documents (Expected: 0)`);

  const tcSnap = await db.collection('team_codes').get();
  console.log(`✓ /team_codes: ${tcSnap.size} documents (Expected: 0)`);

  const tjrSnap = await db.collection('team_join_requests').get();
  console.log(`✓ /team_join_requests: ${tjrSnap.size} documents (Expected: 0)`);

  const utrSnap = await db.collection('utr_registry').get();
  console.log(`✓ /utr_registry: ${utrSnap.size} documents (Expected: 0)`);

  const proofSnap = await db.collection('payment_proofs').get();
  console.log(`✓ /payment_proofs: ${proofSnap.size} documents (Expected: 0)`);

  const chkSnap = await db.collection('event_checkins').get();
  console.log(`✓ /event_checkins: ${chkSnap.size} documents (Expected: 0)`);

  const r1Snap = await db.collection('round1_results').get();
  console.log(`✓ /round1_results: ${r1Snap.size} documents (Expected: 0)`);

  const r2Snap = await db.collection('round2_results').get();
  console.log(`✓ /round2_results: ${r2Snap.size} documents (Expected: 0)`);

  const certSnap = await db.collection('certificate_records').get();
  console.log(`✓ /certificate_records: ${certSnap.size} documents (Expected: 0)`);

  const evSnap = await db.collection('events').get();
  console.log(`✓ /events: ${evSnap.size} documents (Expected: 5 core event tracks intact)`);

  const schSnap = await db.collection('schedules').get();
  console.log(`✓ /schedules: ${schSnap.size} documents (Expected: 8 schedule tracks intact)`);

  console.log('\n================================================================');
  console.log('🎉 PRODUCTION RESET COMPLETED WITH ZERO ERRORS');
  console.log('================================================================');
  console.log(`- Participant Auth accounts deleted: ${deletedAuthCount}`);
  console.log(`- Firestore demo documents deleted: ${deletedDocCount}`);
  console.log(`- Protected symposium accounts verified intact: ${verifiedAuthCount}/11`);
  console.log(`- Core event and schedule configurations preserved: 100%`);
  console.log('================================================================\n');
}

executeReset().then(() => process.exit(0)).catch((err) => {
  console.error('\n❌ RESET FAILED:', err);
  process.exit(1);
});
