import * as admin from 'firebase-admin';
import * as fs from 'fs';

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

async function cleanParticipants(db: admin.firestore.Firestore) {
  console.log(`\n🧹 Auditing & Resetting "/participants" collection...`);
  try {
    const snap = await db.collection('participants').get();
    let deletedCount = 0;
    let preservedCount = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const role = (data.role || '').toString().toLowerCase();
      const docId = docSnap.id;

      // Delete demo participant test stubs and non-staff/admin participants
      const isExplicitDemo = docId === 'taras_demo_participant_001' || docId === 'taras_demo_participant_002' || data.isDemo === true;
      const isTestOrUser = !PRESERVED_ROLES.includes(role);

      if (isExplicitDemo || isTestOrUser) {
        await docSnap.ref.delete();
        deletedCount++;
        console.log(`  - Deleted participant doc: ${docId} | Name: ${data.fullName || 'Test User'} | Email: ${data.email || 'N/A'}`);
      } else {
        // Preserved staff/admin/coordinator user: reset operational activity state
        await docSnap.ref.update({
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
          updatedAt: new Date().toISOString(),
        });
        preservedCount++;
        console.log(`  + Preserved & reset account [Role: ${role.toUpperCase()}]: ${docId} (${data.fullName || data.email || 'Officer'})`);
      }
    }

    console.log(`✓ Participants audit complete: ${deletedCount} deleted, ${preservedCount} preserved.`);
  } catch (err: any) {
    console.error(`❌ Error cleaning "/participants":`, err.message);
  }
}

async function main() {
  console.log('====================================================');
  console.log('    TARAS 2K26 — FULL PRODUCTION DATA RESET (ADMIN) ');
  console.log('====================================================');

  const db = initAdmin();

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

  await cleanParticipants(db);

  console.log('\n====================================================');
  console.log(' 🎉 PRODUCTION RESET COMPLETE — ALL TEST DATA WIPED ');
  console.log('====================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('[FATAL ERROR] Admin reset script failed:', err);
  process.exit(1);
});
