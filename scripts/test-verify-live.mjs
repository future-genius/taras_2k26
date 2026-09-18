import { initializeApp as initAdmin, cert, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp as initClient } from 'firebase/app';
import { getAuth as getClientAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// 1. Init Admin
const SERVICE_ACCOUNT_PATH = 'c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json';
if (!getApps().length) {
  initAdmin({ credential: cert(JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))) });
}
const adminAuth = getAdminAuth();

// 2. Init Client
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach((l) => {
  const [k, ...rest] = l.trim().split('=');
  if (k) env[k] = rest.join('=');
});

const clientApp = initClient({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
});
const clientAuth = getClientAuth(clientApp);
const firestore = getFirestore(clientApp);

async function testAsUser(email) {
  console.log(`\n========================================`);
  console.log(`TESTING AS: ${email}`);
  console.log(`========================================`);

  const adminUser = await adminAuth.getUserByEmail(email);
  const customToken = await adminAuth.createCustomToken(adminUser.uid);
  const userCred = await signInWithCustomToken(clientAuth, customToken);
  console.log(`✓ Signed in client as ${email} (UID: ${userCred.user.uid})`);

  const regId = 'TARAS26-TARA-35984';
  const staffUid = userCred.user.uid;
  const regRef = doc(firestore, 'registrations', regId);
  const now = new Date().toISOString();

  try {
    await runTransaction(firestore, async (transaction) => {
      const regSnap = await transaction.get(regRef);
      if (!regSnap.exists()) throw new Error('Registration record not found.');

      const regData = regSnap.data();
      const partRef = doc(firestore, 'participants', regData.uid);
      const teamRef = regData.teamId ? doc(firestore, 'teams', regData.teamId) : null;

      const partSnap = await transaction.get(partRef);
      const teamSnap = teamRef ? await transaction.get(teamRef) : null;

      const paidCount = regData.teamMemberCount || 1;

      console.log('-> Executing Write 1 (registrations)...');
      transaction.update(regRef, {
        paymentStatus: 'VERIFIED',
        status: 'CONFIRMED',
        paidMemberCount: paidCount,
        paymentVerifiedAt: now,
        paymentVerifiedBy: staffUid,
        updatedAt: serverTimestamp(),
      });

      if (teamRef && teamSnap?.exists()) {
        console.log('-> Executing Write 2 (teams)...');
        const teamData = teamSnap.data();
        transaction.update(teamRef, {
          isPaymentVerified: true,
          paidMemberCount: paidCount,
          paymentVerifiedAt: now,
          eventRegistrationStarted: true,
          status: 'LOCKED',
          updatedAt: serverTimestamp(),
        });
        if (teamData.teamCode) {
          console.log('-> Executing Write 2b (team_codes)...');
          const codeRef = doc(firestore, 'team_codes', teamData.teamCode);
          transaction.set(codeRef, { isLocked: true, isPaymentVerified: true, updatedAt: serverTimestamp() }, { merge: true });
        }
      }

      if (partSnap.exists()) {
        console.log('-> Executing Write 3 (participants)...');
        const pData = partSnap.data();
        const currentEvents = pData.registeredEvents || [];
        if (!currentEvents.includes(regData.eventId)) {
          transaction.update(partRef, {
            registeredEvents: [...currentEvents, regData.eventId],
            updatedAt: serverTimestamp(),
          });
        }
      }
    });
    console.log(`🎉 SUCCESS! Transaction succeeded for ${email}!`);
  } catch (err) {
    console.error(`❌ FAILED for ${email}:`, err.code, err.message);
  }
}

async function main() {
  await testAsUser('to.hariharanr@gmail.com');
  await testAsUser('registration.taras2k26@gmail.com');
  await testAsUser('president.taras2k26@gmail.com');
  await testAsUser('hawkeyehari@gmail.com');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
