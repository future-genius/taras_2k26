/**
 * TARAS 2K26 — Centralized Role Helpers
 *
 * Single source of truth for all role checks.
 * Used by AuthContext, ProtectedRoute, and UI components.
 *
 * Role hierarchy (highest → lowest):
 *   super_admin  (TARAS 2K26 President)
 *   admin
 *   coordinator  (Event Head)
 *   staff
 *   participant
 */

import type { UserRole } from '../types/participant';

/** Normalizes legacy / mixed-case role aliases */
export function normalizeRole(role: string | undefined | null): string {
  if (!role) return 'participant';
  const r = role.toLowerCase().trim();
  // Map legacy aliases to canonical values
  if (r === 'president') return 'super_admin';
  if (r === 'registration_team') return 'staff';
  if (r === 'registration_staff') return 'registration_staff';
  if (r === 'event_head') return 'coordinator';
  if (r === 'participant') return 'participant';
  return r;
}

/** Returns true only for the highest-authority President role */
export function isSuperAdmin(role: UserRole | string | undefined | null): boolean {
  const r = normalizeRole(role as string);
  return r === 'super_admin';
}

/** Returns true for admin AND super_admin (super_admin inherits all admin access) */
export function isAdminOrAbove(role: UserRole | string | undefined | null): boolean {
  const r = normalizeRole(role as string);
  return r === 'super_admin' || r === 'admin';
}

/** Returns true for coordinator/event_head and above */
export function isCoordinatorOrAbove(role: UserRole | string | undefined | null): boolean {
  const r = normalizeRole(role as string);
  return r === 'super_admin' || r === 'admin' || r === 'coordinator';
}

/** Returns true for staff and above */
export function isStaffOrAbove(role: UserRole | string | undefined | null): boolean {
  const r = normalizeRole(role as string);
  return (
    r === 'super_admin' ||
    r === 'admin' ||
    r === 'coordinator' ||
    r === 'staff' ||
    r === 'registration_staff'
  );
}

/** Human-readable display label for each role */
export function getRoleDisplayName(role: UserRole | string | undefined | null): string {
  const r = normalizeRole(role as string);
  switch (r) {
    case 'super_admin':        return 'PRESIDENT';
    case 'admin':              return 'ADMIN';
    case 'coordinator':        return 'EVENT HEAD';
    case 'staff':              return 'STAFF';
    case 'registration_staff': return 'REGISTRATION STAFF';
    default:                   return 'PARTICIPANT';
  }
}

/**
 * Returns the canonical UserRole for routing & context.
 * super_admin is preserved; legacy aliases are mapped.
 */
export function getCanonicalRole(role: UserRole | string | undefined | null): UserRole {
  const r = normalizeRole(role as string);
  if (r === 'super_admin') return 'super_admin';
  if (r === 'admin') return 'admin';
  if (r === 'coordinator') return 'coordinator';
  if (r === 'staff') return 'staff';
  if (r === 'registration_staff') return 'registration_staff';
  return 'participant';
}

/**
 * Security guard: a role may NOT self-promote to super_admin.
 * Only used for UI-level blocking; Firestore rules are the real authority.
 */
export function canAssignRole(
  actorRole: UserRole | string | undefined | null,
  targetRole: UserRole | string
): boolean {
  const actor = normalizeRole(actorRole as string);
  const target = normalizeRole(targetRole as string);

  if (target === 'super_admin') {
    // Only super_admin can grant super_admin
    return actor === 'super_admin';
  }
  if (target === 'admin') {
    // Only super_admin can create/modify admins
    return actor === 'super_admin';
  }
  if (target === 'coordinator' || target === 'staff') {
    // super_admin or admin can create coordinators/staff
    return actor === 'super_admin' || actor === 'admin';
  }
  return false;
}
