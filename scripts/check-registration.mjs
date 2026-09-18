import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const SERVICE_ACCOUNT_PATH = 'c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json';

if (!getApps().length) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function check() {
  const regSnap = await db.collection('registrations').doc('TARAS26-TARA-35984').get();
  console.log('--- REGISTRATION ---');
  console.log(regSnap.exists ? JSON.stringify(regSnap.data(), null, 2) : 'NOT FOUND');

  if (regSnap.exists && regSnap.data().teamId) {
    const teamSnap = await db.collection('teams').doc(regSnap.data().teamId).get();
    console.log('--- TEAM ---');
    console.log(teamSnap.exists ? JSON.stringify(teamSnap.data(), null, 2) : 'NOT FOUND');

    if (teamSnap.exists && teamSnap.data().teamCode) {
      const codeSnap = await db.collection('team_codes').doc(teamSnap.data().teamCode).get();
      console.log('--- TEAM CODE ---');
      console.log(codeSnap.exists ? JSON.stringify(codeSnap.data(), null, 2) : 'NOT FOUND (EXISTS = FALSE)');
    }
  }
}

check().catch(console.error);
