/**
 * TARAS 2K26 — Delete All Announcements Script
 *
 * Usage:
 *   node scripts/clean-announcements.mjs
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const admin = require(path.resolve(process.cwd(), 'functions/node_modules/firebase-admin'));

const SERVICE_ACCOUNT_PATH = 'c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function deleteAnnouncements() {
  console.log('==================================================');
  console.log('TARAS 2K26 — ANNOUNCEMENT CLEANUP SCRIPT');
  console.log('==================================================\n');

  console.log('🧹 Querying collection "/announcements"...');
  try {
    const snap = await db.collection('announcements').get();
    let count = 0;
    for (const d of snap.docs) {
      await db.collection('announcements').doc(d.id).delete();
      count++;
      console.log(`  - Deleted announcement doc: ${d.id} ("${d.data().title || 'Untitled'}")`);
    }
    console.log(`\n✓ Successfully deleted ${count} announcement document(s) from production Firestore.`);
  } catch (err) {
    console.error('❌ Error deleting announcements:', err.message);
    process.exit(1);
  }

  console.log('\n==================================================');
  console.log('🎉 ANNOUNCEMENT CLEANUP COMPLETED SUCCESSFULLY');
  console.log('==================================================\n');
  process.exit(0);
}

deleteAnnouncements().catch((err) => {
  console.error('\n❌ Cleanup script failed:', err);
  process.exit(1);
});
