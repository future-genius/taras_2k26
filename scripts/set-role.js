/**
 * TARAS 2K26 — Secure Admin Bootstrapping Utility
 *
 * Usage:
 *   npx ts-node scripts/set-role.ts <USER_UID> <ROLE: admin | staff | coordinator | participant> [EVENT_ID_1,EVENT_ID_2]
 *
 * This script runs in a trusted Node environment (with Firebase Admin credentials)
 * to elevate initial admins or assign event coordinators without exposing
 * client-side privilege escalation vectors.
 */
const args = process.argv.slice(2);
const uid = args[0];
const targetRole = args[1]?.toLowerCase();
const assignedEvents = args[2] ? args[2].split(',') : [];
if (!uid || !targetRole) {
    console.log(`
Usage:
  npx ts-node scripts/set-role.ts <USER_UID> <admin|staff|coordinator|participant> [event1,event2]

Example:
  npx ts-node scripts/set-role.ts 633606057179adminUid admin
  npx ts-node scripts/set-role.ts coordinatorUid coordinator paperionix,circuitrix
  `);
    process.exit(1);
}
const validRoles = ['super_admin', 'admin', 'staff', 'coordinator', 'participant'];
if (!validRoles.includes(targetRole)) {
    console.error(`Invalid role "${targetRole}". Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
}
if (targetRole === 'super_admin') {
    console.log(`\n👑 [TARAS 2K26 PRESIDENT AUTHORITY ELEVATION]`);
    console.log(`Target UID: ${uid}`);
    console.log(`Role: super_admin (TARAS 2K26 President)`);
    console.log(`Setting isPrimarySuperAdmin: true`);
}
console.log(`[TARAS RBAC] Promoting user ${uid} to ${targetRole.toUpperCase()}...`);
console.log(`To run directly in Firebase console, execute document update on "participants/${uid}": { role: "${targetRole}", assignedEventIds: ${JSON.stringify(assignedEvents)} }`);
export {};
