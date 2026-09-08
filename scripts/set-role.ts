/**
 * TARAS 2K26 — Secure Admin Bootstrapping & Custom Claims Utility
 *
 * Usage:
 *   npx ts-node scripts/set-role.ts <USER_UID> <ROLE: admin | staff | registration_staff | coordinator | participant | super_admin | PRESIDENT> [EVENT_ID_1,EVENT_ID_2]
 *
 * This script runs in a trusted Node.js environment (with Firebase Admin credentials)
 * to elevate user roles, update Firestore participant records, and provision the
 * Firebase Auth custom claim `user_role` required for Supabase Storage RLS authorization.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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
  npx ts-node scripts/set-role.ts <USER_UID> <admin|staff|registration_staff|coordinator|participant|super_admin|PRESIDENT> [event1,event2]

Example:
  npx ts-node scripts/set-role.ts 633606057179adminUid admin
  npx ts-node scripts/set-role.ts staffUid123 staff
  npx ts-node scripts/set-role.ts coordinatorUid coordinator paper-x-verse,kingpins-nexus
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

  // 1. Fetch existing user from Firebase Auth to preserve existing custom claims
  let existingClaims: Record<string, any> = {};
  try {
    const userRecord = await auth.getUser(uid);
    existingClaims = userRecord.customClaims || {};
  } catch (err: any) {
    console.error(`[ERROR] Firebase Auth user lookup failed for UID "${uid}":`, err.message);
    process.exit(1);
  }

  // 2. Provision `user_role` Custom Claim on Firebase Auth ID Token
  // Note: JWT `role` claim remains 'authenticated' for Supabase Postgres compatibility
  const updatedClaims = {
    ...existingClaims,
    user_role: targetRole,
  };

  await auth.setCustomUserClaims(uid, updatedClaims);
  console.log(`✅ Firebase Auth Custom Claim set: user_role = "${targetRole}"`);

  // 3. Synchronize Firestore `/participants/{uid}` document
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
