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

async function runExecution() {
  console.log('================================================================');
  console.log('TARAS 2K26 — EXECUTE CLEAN PRODUCTION DATABASE RESET');
  console.log('================================================================\n');

  let totalDeleted = 0;

  // 1. Clean participants
  console.log('--- CLEANING: participants ---');
  const participantsSnap = await db.collection('participants').get();
  for (const d of participantsSnap.docs) {
    const data = d.data();
    const role = (data.role || '').toLowerCase();

    if (SYSTEM_ROLES.has(role)) {
      console.log(`[PRESERVED] /participants/${d.id} | Role: ${role}`);
    } else {
      console.log(`[DELETED] /participants/${d.id} | Role: ${role || 'participant'}`);
      await d.ref.delete();
      totalDeleted++;
    }
  }

  // 2. Clean other application collections
  for (const col of APPLICATION_COLLECTIONS) {
    console.log(`\n--- CLEANING: ${col} ---`);
    const snap = await db.collection(col).get();
    if (snap.empty) {
      console.log(`(Empty)`);
      continue;
    }
    for (const d of snap.docs) {
      console.log(`[DELETED] /${col}/${d.id}`);
      await d.ref.delete();
      totalDeleted++;
    }
  }

  console.log('\n================================================================');
  console.log('EXECUTION COMPLETE');
  console.log('================================================================');
  console.log(`Total Documents DELETED: ${totalDeleted}`);
  console.log('================================================================\n');
}

runExecution().catch(console.error);
