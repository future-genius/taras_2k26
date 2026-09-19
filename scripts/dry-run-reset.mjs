import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Use the existing service account
const SERVICE_ACCOUNT_PATH = 'c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json';

if (!getApps().length) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const SYSTEM_ROLES = new Set([
  'super_admin',
  'admin',
  'staff',
  'registration_staff',
  'coordinator',
  'president',
  'registration_team',
  'event_head',
]);

const APPLICATION_COLLECTIONS = [
  'registrations',
  'teams',
  'team_codes',
  'team_join_requests',
  'payment_proofs',
  'used_transaction_ids',
  'utr_registry',
  'certificates',
  'certificate_records',
  'email_deliveries',
  'event_checkins',
  'round1_results',
  'round2_results',
];

async function runDryRun() {
  console.log('================================================================');
  console.log('TARAS 2K26 — CLEAN PRODUCTION DATABASE DRY RUN');
  console.log('================================================================\n');

  let totalToDelete = 0;
  let totalToPreserve = 0;

  // 1. Audit participants
  console.log('--- AUDITING: participants ---');
  const participantsSnap = await db.collection('participants').get();
  for (const d of participantsSnap.docs) {
    const data = d.data();
    const role = (data.role || '').toLowerCase();

    if (SYSTEM_ROLES.has(role)) {
      console.log(`[PRESERVE — REQUIRED SYSTEM DATA] /participants/${d.id} | Role: ${role} | Name: ${data.fullName || 'N/A'}`);
      totalToPreserve++;
    } else {
      console.log(`[DELETE — OLD APPLICATION DATA] /participants/${d.id} | Role: ${role || 'participant'} | Name: ${data.fullName || 'N/A'}`);
      totalToDelete++;
    }
  }

  // 2. Audit other application collections
  for (const col of APPLICATION_COLLECTIONS) {
    console.log(`\n--- AUDITING: ${col} ---`);
    const snap = await db.collection(col).get();
    if (snap.empty) {
      console.log(`(Empty)`);
      continue;
    }
    for (const d of snap.docs) {
      console.log(`[DELETE — OLD APPLICATION DATA] /${col}/${d.id}`);
      totalToDelete++;
    }
  }

  // 3. Audit configuration collections (Events, Schedules)
  console.log(`\n--- AUDITING: events ---`);
  const eventsSnap = await db.collection('events').get();
  for (const d of eventsSnap.docs) {
    console.log(`[PRESERVE — REQUIRED SYSTEM DATA] /events/${d.id}`);
    totalToPreserve++;
  }

  console.log(`\n--- AUDITING: schedules ---`);
  const schedulesSnap = await db.collection('schedules').get();
  for (const d of schedulesSnap.docs) {
    console.log(`[PRESERVE — REQUIRED SYSTEM DATA] /schedules/${d.id}`);
    totalToPreserve++;
  }

  console.log('\n================================================================');
  console.log('DRY RUN SUMMARY');
  console.log('================================================================');
  console.log(`Total Documents to DELETE: ${totalToDelete}`);
  console.log(`Total Documents to PRESERVE: ${totalToPreserve}`);
  console.log('================================================================\n');
}

runDryRun().catch(console.error);
