/**
 * TARAS 2K26 — Production Database Reset Script (Authenticated Staff/Admin Context)
 *
 * Usage:
 *   node scripts/clean-production-data.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [k, ...rest] = line.trim().split('=');
  if (k) env[k] = rest.join('=').trim();
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

console.log('⚡ Initializing Firebase for project:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const STAFF_EMAIL = 'registration.demo@taras2k26.test';
const STAFF_PASS = 'TARAS@Demo2026';

const PRESERVED_ROLES = [
  'admin',
  'super_admin',
  'president',
  'staff',
  'registration_staff',
  'registration_team',
  'coordinator',
  'event_head',
];

async function deleteEntireCollection(collectionName) {
  console.log(`\n🧹 Cleaning collection "/${collectionName}"...`);
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    let count = 0;
    for (const d of snap.docs) {
      await deleteDoc(doc(db, collectionName, d.id));
      count++;
    }
    console.log(`✓ Deleted ${count} document(s) from "/${collectionName}".`);
  } catch (err) {
    console.warn(`⚠️ Error cleaning collection "/${collectionName}":`, err.message);
  }
}

async function cleanParticipantsCollection() {
  console.log(`\n🧹 Auditing "/participants" collection...`);
  try {
    const colRef = collection(db, 'participants');
    const snap = await getDocs(colRef);
    let deletedCount = 0;
    let preservedCount = 0;

    for (const d of snap.docs) {
      const data = d.data();
      const role = (data.role || '').toLowerCase();
      const isDemoPart = d.id === 'taras_demo_participant_001' || d.id === 'taras_demo_participant_002';

      if (isDemoPart || (!PRESERVED_ROLES.includes(role) && role !== '')) {
        await deleteDoc(doc(db, 'participants', d.id));
        deletedCount++;
        console.log(`  - Deleted participant doc: ${d.id} (${data.fullName || 'Test User'})`);
      } else {
        await updateDoc(doc(db, 'participants', d.id), {
          venueCheckIn: false,
          venueCheckInStatus: 'NOT_CHECKED_IN',
          venueCheckInTimestamp: null,
          checkedInByStaffUid: null,
          registeredEvents: [],
          teamIds: [],
          attendanceStatus: {},
          shortlistStatus: {},
          certificateStatus: 'NOT_ELIGIBLE',
          certificateUrl: null,
        });
        preservedCount++;
        console.log(`  + Preserved & reset operational state for role "${role}": ${d.id} (${data.fullName || 'Officer'})`);
      }
    }
    console.log(`✓ Participants audit complete: ${deletedCount} deleted, ${preservedCount} preserved.`);
  } catch (err) {
    console.warn(`⚠️ Error auditing "/participants":`, err.message);
  }
}

async function runProductionReset() {
  console.log('==================================================');
  console.log('TARAS 2K26 — PRODUCTION DATABASE RESET');
  console.log('==================================================\n');

  try {
    console.log(`🔑 Authenticating as Registration Desk Officer (${STAFF_EMAIL})...`);
    await signInWithEmailAndPassword(auth, STAFF_EMAIL, STAFF_PASS);
    console.log('✓ Successfully authenticated with staff privileges.\n');
  } catch (authErr) {
    console.error('❌ Authentication failed:', authErr.message);
    process.exit(1);
  }

  const collectionsToClear = [
    'registrations',
    'teams',
    'team_codes',
    'payment_proofs',
    'used_transaction_ids',
    'utr_registry',
    'certificates',
  ];

  for (const col of collectionsToClear) {
    await deleteEntireCollection(col);
  }

  await cleanParticipantsCollection();

  await signOut(auth);

  console.log('\n==================================================');
  console.log('🎉 PRODUCTION DATABASE RESET COMPLETED CLEANLY');
  console.log('==================================================\n');
  process.exit(0);
}

runProductionReset().catch((err) => {
  console.error('\n❌ Reset script failed:', err);
  process.exit(1);
});
