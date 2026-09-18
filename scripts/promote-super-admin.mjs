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

async function promote() {
  console.log('--- PROMOTING ADMIN & STAFF ACCOUNTS ---');

  // 1. to.hariharanr@gmail.com (Super Admin)
  const haranUid = '7EN5d9RsIvaLhFk8s6y3Chv7I9y2';
  await auth.setCustomUserClaims(haranUid, {
    role: 'super_admin',
    user_role: 'super_admin',
    admin: true,
    super_admin: true,
  });
  await db.collection('participants').doc(haranUid).set(
    {
      role: 'super_admin',
      isPrimarySuperAdmin: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`✅ ${haranUid} (to.hariharanr@gmail.com) elevated to super_admin (claims + doc)`);

  // 2. president.taras2k26@gmail.com (Super Admin)
  const presUid = 'lrzt2A5VnQUARktBQZht7z5tVih2';
  await auth.setCustomUserClaims(presUid, {
    role: 'super_admin',
    user_role: 'super_admin',
    admin: true,
    super_admin: true,
  });
  await db.collection('participants').doc(presUid).set(
    {
      role: 'super_admin',
      isPrimarySuperAdmin: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`✅ ${presUid} (president.taras2k26@gmail.com) claims + doc synchronized to super_admin`);

  // 3. registration.taras2k26@gmail.com (Registration Staff)
  const regUid = 'o1uV9ZijLUWUrBgnVrPkEXndIAF3';
  await auth.setCustomUserClaims(regUid, {
    role: 'registration_staff',
    user_role: 'registration_staff',
    staff: true,
  });
  await db.collection('participants').doc(regUid).set(
    {
      role: 'registration_staff',
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`✅ ${regUid} (registration.taras2k26@gmail.com) claims + doc synchronized to registration_staff`);

  console.log('\n--- VERIFYING UPDATED CLAIMS ---');
  const hUser = await auth.getUser(haranUid);
  console.log(`Haran claims: ${JSON.stringify(hUser.customClaims)}`);
  const pUser = await auth.getUser(presUid);
  console.log(`President claims: ${JSON.stringify(pUser.customClaims)}`);
  const rUser = await auth.getUser(regUid);
  console.log(`Reg Staff claims: ${JSON.stringify(rUser.customClaims)}`);
}

promote().catch((err) => {
  console.error('Promotion failed:', err);
  process.exit(1);
});
