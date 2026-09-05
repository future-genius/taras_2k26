/**
 * TARAS 2K26 — Secure Admin Bootstrapping & Custom Claims Utility
 */
const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp();
}

const args = process.argv.slice(2);
const uid = args[0];
const targetRole = args[1]?.toLowerCase();
const assignedEvents = args[2] ? args[2].split(',') : [];

if (!uid || !targetRole) {
  console.log(`
Usage:
  node scripts/set-role.js <USER_UID> <admin|staff|registration_staff|coordinator|participant|super_admin|PRESIDENT> [event1,event2]
`);
  process.exit(1);
}

const validRoles = [
  'super_admin',
  'admin',
  'staff',
  'registration_staff',
  'coordinator',
  'participant',
  'president',
];

if (!validRoles.includes(targetRole)) {
  console.error(`Invalid role "${targetRole}". Must be one of: ${validRoles.join(', ')}`);
  process.exit(1);
}

async function executeRoleElevation() {
  const auth = getAuth();
  const db = getFirestore();

  console.log(`[TARAS RBAC] Elevating user ${uid} to ${targetRole.toUpperCase()}...`);

  let existingClaims = {};
  try {
    const userRecord = await auth.getUser(uid);
    existingClaims = userRecord.customClaims || {};
  } catch (err) {
    console.error(`[ERROR] Firebase Auth user lookup failed for UID "${uid}":`, err.message);
    process.exit(1);
  }

  const updatedClaims = {
    ...existingClaims,
    user_role: targetRole,
  };

  await auth.setCustomUserClaims(uid, updatedClaims);
  console.log(`✅ Firebase Auth Custom Claim set: user_role = "${targetRole}"`);

  const participantRef = db.collection('participants').doc(uid);
  await participantRef.set(
    {
      role: targetRole,
      ...(assignedEvents.length > 0 && { assignedEventIds: assignedEvents }),
      ...(targetRole === 'super_admin' && { isPrimarySuperAdmin: true }),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  console.log(`✅ Firestore Document "participants/${uid}" synchronized: role = "${targetRole}"`);
  console.log(`\n[IMPORTANT] The elevated user must log in or refresh their Firebase ID token via auth.currentUser.getIdToken(true) to receive the new custom claim in Supabase Storage requests.`);
}

executeRoleElevation().catch((err) => {
  console.error('[FATAL ERROR] Role elevation failed:', err);
  process.exit(1);
});

