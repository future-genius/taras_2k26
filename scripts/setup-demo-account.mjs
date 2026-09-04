/**
 * TARAS 2K26 — Demo Day Provisioning & Setup Script
 *
 * Provisions:
 * 1. Demo Registration Staff Account:
 *    Email:    registration.demo@taras2k26.test
 *    Password: TARAS@Demo2026
 *    Role:     registration_staff
 *
 * 2. Deterministic Demo Participant Record:
 *    Name:             TARAS Demo Participant
 *    Registration ID:  TARAS-DEMO-001
 *    QR Token:         QR-TARAS-DEMO-001-TOKEN
 *    Event:            Demo Event
 *    Department:       Electronics and Communication Engineering
 *    Year/Sec:         IV Year (Demo)
 *    isDemo:           true
 *
 * Usage:
 *   node scripts/setup-demo-account.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [k, ...rest] = line.trim().split('=');
  if (k) env[k] = rest.join('=');
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

async function setup() {
  console.log('\n==================================================');
  console.log('TARAS 2K26 — DEMO DAY PROVISIONING');
  console.log('==================================================\n');

  const DEMO_STAFF_EMAIL = 'registration.demo@taras2k26.test';
  const DEMO_STAFF_PASS = 'TARAS@Demo2026';

  let staffUid = '';

  // 1. Authenticate or Create Registration Staff in Firebase Auth
  try {
    console.log(`[1/3] Checking Auth for: ${DEMO_STAFF_EMAIL}...`);
    const cred = await signInWithEmailAndPassword(auth, DEMO_STAFF_EMAIL, DEMO_STAFF_PASS);
    staffUid = cred.user.uid;
    console.log(`✓ Registration Staff already exists in Firebase Auth (UID: ${staffUid})`);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        console.log(`Creating Firebase Auth user for ${DEMO_STAFF_EMAIL}...`);
        const newCred = await createUserWithEmailAndPassword(auth, DEMO_STAFF_EMAIL, DEMO_STAFF_PASS);
        staffUid = newCred.user.uid;
        console.log(`✓ Successfully created Registration Staff in Firebase Auth (UID: ${staffUid})`);
      } catch (createErr) {
        console.error('Failed to create Firebase Auth user:', createErr.message);
        throw createErr;
      }
    } else {
      console.error('Auth error:', err.message);
      throw err;
    }
  }

  // 2. Set Firestore Profile for Registration Staff
  console.log(`[2/3] Provisioning Firestore role "registration_staff" for UID: ${staffUid}...`);
  const now = new Date().toISOString();
  const staffDocRef = doc(db, 'participants', staffUid);

  await setDoc(
    staffDocRef,
    {
      uid: staffUid,
      participantId: 'TARAS26-STAFF-DEMO',
      fullName: 'Registration Demo Officer',
      email: DEMO_STAFF_EMAIL,
      phone: '+91 98765 00000',
      college: 'Saveetha Engineering College',
      department: 'Electronics and Communication Engineering',
      year: 'IV',
      section: 'Staff',
      role: 'registration_staff',
      qrToken: 'QR-REG-STAFF-DEMO-TOKEN',
      venueCheckIn: true,
      venueCheckInStatus: 'CHECKED_IN',
      venueCheckInTimestamp: now,
      registeredEvents: [],
      teamIds: [],
      attendanceStatus: {},
      shortlistStatus: {},
      certificateStatus: 'READY',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
  console.log(`✓ Registration Staff profile confirmed in Firestore (/participants/${staffUid})`);

  // 3. Provision Isolated Demo Participant
  console.log('[3/3] Provisioning Isolated Demo Participant (TARAS-DEMO-001)...');

  const DEMO_PART_UID = 'taras_demo_participant_001';
  const partDocRef = doc(db, 'participants', DEMO_PART_UID);

  const existingPart = await getDoc(partDocRef);
  const currentVenueCheckIn = existingPart.exists() ? existingPart.data().venueCheckIn : false;
  const currentCertStatus = existingPart.exists() ? existingPart.data().certificateStatus : 'PENDING';

  await setDoc(
    partDocRef,
    {
      uid: DEMO_PART_UID,
      participantId: 'TARAS-DEMO-001',
      fullName: 'TARAS Demo Participant',
      email: 'demo.participant@taras2k26.test',
      phone: '+91 98765 43210',
      college: 'Saveetha Engineering College',
      department: 'Electronics and Communication Engineering',
      year: 'IV',
      section: 'Demo',
      registrationNumber: '312220106000',
      role: 'participant',
      qrToken: 'QR-TARAS-DEMO-001-TOKEN',
      venueCheckIn: currentVenueCheckIn,
      venueCheckInStatus: currentVenueCheckIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
      venueCheckInTimestamp: currentVenueCheckIn ? now : null,
      registeredEvents: ['Demo Event'],
      teamIds: [],
      attendanceStatus: { 'TR-DEMO': 'PRESENT' },
      shortlistStatus: {},
      certificateStatus: currentCertStatus,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  console.log('✓ Demo Participant confirmed in Firestore (/participants/taras_demo_participant_001)');

  console.log('\n==================================================');
  console.log('🎉 DEMO DAY SETUP COMPLETED SUCCESSFULLY');
  console.log('==================================================');
  console.log(`\nRegistration Staff Credentials:`);
  console.log(`  Email:    ${DEMO_STAFF_EMAIL}`);
  console.log(`  Password: ${DEMO_STAFF_PASS}`);
  console.log(`  Role:     registration_staff`);
  console.log(`  URL:      /registration or /registration-demo`);
  console.log(`\nDemo Participant Record:`);
  console.log(`  Name:     TARAS Demo Participant`);
  console.log(`  ID:       TARAS-DEMO-001`);
  console.log(`  Token:    QR-TARAS-DEMO-001-TOKEN`);
  console.log(`  Event:    Demo Event`);
  console.log(`  Admin:    /admin/certificate-demo`);
  console.log('==================================================\n');

  await signOut(auth);
  process.exit(0);
}

setup().catch((err) => {
  console.error('\n❌ Setup script failed:', err);
  process.exit(1);
});
