import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = 'c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json';

function initAdmin(): admin.firestore.Firestore {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[Firebase Admin] Initialized via Service Account JSON.');
  } else {
    admin.initializeApp();
    console.log('[Firebase Admin] Initialized via Default Application Credentials.');
  }

  return admin.firestore();
}

const REQUIRED_ACCOUNTS = [
  {
    email: 'registration.taras2k26@gmail.com',
    password: 'Registration@TARAS2K26!Team',
    fullName: 'TARAS 2K26 Registration Team',
    role: 'registration_staff',
    assignedEventIds: [],
  },
  {
    email: 'kanishksudha631@gmail.com',
    password: 'PaperX@TARAS2K26!Kani',
    fullName: 'Kanishka M',
    role: 'coordinator',
    assignedEventIds: ['taras-01-int'],
  },
  {
    email: 'arunkumarak200595@gmail.com',
    password: 'PaperX@TARAS2K26!Arun',
    fullName: 'Arun Kumar N',
    role: 'coordinator',
    assignedEventIds: ['taras-01-ext'],
  },
  {
    email: 'amk25amales2006@gmail.com',
    password: 'Mysterio@TARAS2K26!Kamales',
    fullName: 'Kamales A M',
    role: 'coordinator',
    assignedEventIds: ['taras-10'],
  },
  {
    email: 'udhayakumarmm454@gmail.com',
    password: 'Knull@TARAS2K26!Uthaya',
    fullName: 'UTHAYAKUMAR M M',
    role: 'coordinator',
    assignedEventIds: ['taras-08'],
  },
  {
    email: 'pavithrakannan308@gmail.com',
    password: 'DocOck@TARAS2K26!Pavi',
    fullName: 'Pavithra K',
    role: 'coordinator',
    assignedEventIds: ['taras-07'],
  },
  {
    email: 'gurusathyagan19@gmail.com',
    password: 'Kingpin@TARAS2K26!Guru',
    fullName: 'Guru Sathyagan M',
    role: 'coordinator',
    assignedEventIds: ['taras-09'],
  },
];

async function deleteCollection(db: admin.firestore.Firestore, collectionName: string) {
  console.log(`\n🧹 Purging collection "/${collectionName}"...`);
  try {
    const colRef = db.collection(collectionName);
    const snap = await colRef.get();

    if (snap.empty) {
      console.log(`  ✓ Collection "/${collectionName}" is already empty (0 documents).`);
      return;
    }

    let deletedCount = 0;
    const batchSize = 500;
    let batch = db.batch();
    let inBatch = 0;

    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      deletedCount++;
      inBatch++;

      if (inBatch >= batchSize) {
        await batch.commit();
        batch = db.batch();
        inBatch = 0;
      }
    }

    if (inBatch > 0) {
      await batch.commit();
    }

    console.log(`  ✓ Successfully deleted ${deletedCount} document(s) from "/${collectionName}".`);
  } catch (err: any) {
    console.error(`  ❌ Error purging collection "/${collectionName}":`, err.message);
  }
}

async function backupCollections(db: admin.firestore.Firestore) {
  console.log('\n📦 Creating verified backup before deletion...');
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupData: Record<string, any[]> = {};
  const collectionsToBackup = ['participants', 'registrations', 'teams', 'payment_proofs', 'utr_registry'];

  for (const col of collectionsToBackup) {
    const snap = await db.collection(col).get();
    backupData[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log(`  - Backed up ${snap.docs.length} record(s) from "${col}".`);
  }

  const backupPath = path.join(backupDir, `backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✓ Backup saved to: ${backupPath}`);
}

async function main() {
  console.log('================================================================');
  console.log('  TARAS 2K26 — PRODUCTION DATA RESET & STAFF ACCOUNTS PROVISION');
  console.log('================================================================');

  const db = initAdmin();

  // 1. Create Verified Backup
  await backupCollections(db);

  // 2. Provision Auth Users & Firestore Profiles
  console.log('\n⚡ Provisioning Registration Team & Event Head Accounts...');
  const preservedEmails = new Set<string>();
  const preservedUids = new Set<string>();

  // First, find President user in Auth & Firestore
  const authUsersList = await admin.auth().listUsers();
  for (const u of authUsersList.users) {
    const email = (u.email || '').toLowerCase();
    const claims = u.customClaims || {};
    if (claims.role === 'super_admin' || claims.role === 'president' || email.includes('president') || email.includes('admin@taras')) {
      preservedEmails.add(email);
      preservedUids.add(u.uid);
      console.log(`  + Identified President Auth user: ${u.uid} (${email})`);
    }
  }

  // Also check Firestore participants doc for President
  const partSnap = await db.collection('participants').get();
  for (const doc of partSnap.docs) {
    const data = doc.data();
    const role = (data.role || '').toLowerCase();
    if (role === 'super_admin' || role === 'president') {
      preservedUids.add(doc.id);
      if (data.email) preservedEmails.add(data.email.toLowerCase());
      console.log(`  + Identified President Firestore profile: ${doc.id} (${data.email})`);
    }
  }

  for (const acc of REQUIRED_ACCOUNTS) {
    const email = acc.email.toLowerCase();
    preservedEmails.add(email);

    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(userRecord.uid, {
        password: acc.password,
        displayName: acc.fullName,
      });
      console.log(`  ✓ Updated Auth user: ${email} (${userRecord.uid})`);
    } catch (err: any) {
      userRecord = await admin.auth().createUser({
        email: acc.email,
        password: acc.password,
        displayName: acc.fullName,
      });
      console.log(`  ✓ Created Auth user: ${email} (${userRecord.uid})`);
    }

    preservedUids.add(userRecord.uid);

    // Set Custom User Claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: acc.role });

    // Write Firestore Participant Profile
    const now = new Date().toISOString();
    await db.collection('participants').doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        participantId: `TARAS26-${acc.role.toUpperCase()}-${userRecord.uid.substring(0, 6).toUpperCase()}`,
        fullName: acc.fullName,
        email: acc.email,
        phone: '+91 99999 00000',
        college: 'Saveetha Engineering College',
        department: 'Electronics and Communication Engineering',
        year: 'IV',
        section: 'Staff',
        role: acc.role,
        assignedEventIds: acc.assignedEventIds,
        mustChangePassword: false,
        qrToken: `QR-STAFF-${userRecord.uid}`,
        venueCheckIn: true,
        venueCheckInStatus: 'CHECKED_IN',
        venueCheckInTimestamp: now,
        registeredEvents: [],
        teamIds: [],
        attendanceStatus: {},
        shortlistStatus: {},
        certificateStatus: 'READY',
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    console.log(`  ✓ Firestore profile updated for ${acc.fullName} [${acc.role}]`);
  }

  // 3. Auth Cleanup: Delete all non-preserved Auth users
  console.log('\n🧹 Performing Firebase Authentication Cleanup...');
  const allUsers = await admin.auth().listUsers();
  let deletedAuthCount = 0;
  for (const user of allUsers.users) {
    const userEmail = (user.email || '').toLowerCase();
    if (!preservedEmails.has(userEmail) && !preservedUids.has(user.uid)) {
      await admin.auth().deleteUser(user.uid);
      deletedAuthCount++;
      console.log(`  - Deleted Auth User: ${user.uid} (${user.email || 'No Email'})`);
    } else {
      console.log(`  + Preserved Auth User: ${user.uid} (${user.email})`);
    }
  }
  console.log(`✓ Auth Cleanup Complete: ${deletedAuthCount} old participant user(s) removed.`);

  // 4. Firestore Purge of Participant-Specific Collections
  const collectionsToClear = [
    'registrations',
    'teams',
    'team_codes',
    'team_join_requests',
    'payment_proofs',
    'used_transaction_ids',
    'utr_registry',
    'certificates',
    'certificate_records',
    'certificate_jobs',
    'email_deliveries',
    'email_jobs',
    'email_logs',
    'event_checkins',
    'scorecards',
  ];

  for (const col of collectionsToClear) {
    await deleteCollection(db, col);
  }

  // 5. Clean /participants collection (Delete non-preserved docs)
  console.log('\n🧹 Cleaning "/participants" collection...');
  const allParticipantsSnap = await db.collection('participants').get();
  let deletedPartCount = 0;
  for (const pDoc of allParticipantsSnap.docs) {
    if (!preservedUids.has(pDoc.id)) {
      await pDoc.ref.delete();
      deletedPartCount++;
      console.log(`  - Deleted old participant doc: ${pDoc.id} (${pDoc.data()?.fullName || 'N/A'})`);
    } else {
      console.log(`  + Preserved staff/president doc: ${pDoc.id} (${pDoc.data()?.fullName || pDoc.data()?.email})`);
    }
  }
  console.log(`✓ Participants Firestore Cleanup Complete: ${deletedPartCount} deleted.`);

  console.log('\n================================================================');
  console.log(' 🎉 PRODUCTION RESET & ACCOUNT PROVISIONING COMPLETED CLEANLY');
  console.log('================================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('[FATAL ERROR] Production reset script failed:', err);
  process.exit(1);
});
