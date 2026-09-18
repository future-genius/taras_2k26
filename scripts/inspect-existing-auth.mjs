import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const SERVICE_ACCOUNT_PATH = 'c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json';

if (!getApps().length) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

async function inspect() {
  console.log('--- FIREBASE AUTH USERS ---');
  const authUsers = await auth.listUsers();
  for (const user of authUsers.users) {
    console.log(`UID: ${user.uid} | Email: ${user.email} | DisplayName: ${user.displayName} | CustomClaims: ${JSON.stringify(user.customClaims || {})}`);
  }

  console.log('\n--- FIRESTORE PARTICIPANTS COLLECTION ---');
  const snap = await db.collection('participants').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    console.log(`Doc ID: ${doc.id} | Email: ${data.email} | Name: ${data.fullName} | Role: ${data.role}`);
  }
}

inspect().catch((err) => {
  console.error('Inspection error:', err);
  process.exit(1);
});
