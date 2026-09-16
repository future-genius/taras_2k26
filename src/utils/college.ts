/**
 * TARAS 2K26 — College Helper Functions
 *
 * Internal students (Valliammai Engineering College / SRM VEC) are allowed to register ONLY for:
 * - Paper Presentation event (`taras-01`)
 * - Registration is FREE (₹0 fee, payment fields omitted)
 */

/**
 * Normalizes a registration number by trimming leading and trailing whitespace.
 */
export function normalizeRegNo(regNo?: string): string {
  if (!regNo) return '';
  return regNo.trim();
}

/**
 * SRM VEC INTERNAL PARTICIPANT DETECTION
 * A participant is considered an INTERNAL participant when their registration number starts with "14222".
 */
export function isInternalRegNo(regNo?: string): boolean {
  const norm = normalizeRegNo(regNo);
  return norm.startsWith('14222');
}

/**
 * Derives participantType ('internal' | 'external') from registration number.
 */
export function getParticipantType(regNo?: string): 'internal' | 'external' {
  return isInternalRegNo(regNo) ? 'internal' : 'external';
}

/**
 * Check whether a participant is an internal SRM VEC student.
 * Prioritizes registration number (must start with "14222").
 * Fallback to college name check if registration number is not provided.
 */
export function isInternalStudent(collegeOrRegNo?: string, regNo?: string): boolean {
  if (regNo && isInternalRegNo(regNo)) return true;
  if (collegeOrRegNo && isInternalRegNo(collegeOrRegNo)) return true;

  if (collegeOrRegNo) {
    const normalized = collegeOrRegNo.toLowerCase().trim();
    if (normalized.startsWith('14222')) return true;
    return (
      normalized.includes('valliammai') ||
      normalized.includes('vec') ||
      normalized.includes('srm vec') ||
      normalized.includes('srmvalliammai') ||
      normalized.includes('srm valliammai')
    );
  }
  return false;
}

