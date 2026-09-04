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
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  const EMAIL = 'eventhead.demo@taras2k26.test';
  const PASS = 'TARAS@Demo2026';

  console.log(`Setting up Event Head account for ${EMAIL}...`);

  let uid = '';
  try {
    const cred = await signInWithEmailAndPassword(auth, EMAIL, PASS);
    uid = cred.user.uid;
    console.log(`✓ User already exists in Firebase Auth (UID: ${uid})`);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      const newCred = await createUserWithEmailAndPassword(auth, EMAIL, PASS);
      uid = newCred.user.uid;
      console.log(`✓ Created Firebase Auth user (UID: ${uid})`);
    } else {
      throw err;
    }
  }

  const now = new Date().toISOString();
  const docRef = doc(db, 'participants', uid);

  await setDoc(
    docRef,
    {
      uid,
      participantId: 'TARAS26-COORD-DEMO',
      fullName: 'Demo Event Head',
      email: EMAIL,
      phone: '+91 98401 99999',
      college: 'Saveetha Engineering College',
      department: 'Electronics and Communication Engineering',
      year: 'IV',
      section: 'A',
      registrationNumber: '312220106099',
      role: 'coordinator',
      assignedEventIds: [
        'taras-01',
        'taras-02',
        'taras-03',
        'taras-04',
        'taras-05',
        'taras-06',
        'taras-07',
        'taras-08',
      ],
      qrToken: 'QR-TARAS26-COORD-DEMO',
      venueCheckIn: true,
      venueCheckInStatus: 'CHECKED_IN',
      venueCheckInTimestamp: now,
      registeredEvents: ['taras-01', 'taras-02'],
      teamIds: [],
      attendanceStatus: {},
      shortlistStatus: {},
      certificateStatus: 'PENDING',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  console.log('✓ Firestore profile created successfully!');
  console.log('\n=============================================');
  console.log('EVENT HEAD DUMMY CREDENTIALS:');
  console.log(`Email:    ${EMAIL}`);
  console.log(`Password: ${PASS}`);
  console.log('Role:     coordinator (EVENT HEAD)');
  console.log('Route:    /coordinator/dashboard');
  console.log('=============================================\n');

  await signOut(auth);
  process.exit(0);
}

run().catch((e) => {
  console.error('Error during setup:', e);
  process.exit(1);
});
