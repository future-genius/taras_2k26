/**
 * TARAS 2K26 — College Helper Functions
 *
 * Internal students (Valliammai Engineering College / SRM VEC) are allowed to register ONLY for:
 * - Paper Presentation event (`taras-01`)
 * - Registration is FREE (₹0 fee, payment fields omitted)
 */

export function isInternalStudent(college?: string): boolean {
  if (!college) return false;
  const normalized = college.toLowerCase().trim();
  return (
    normalized.includes('valliammai') ||
    normalized.includes('vec') ||
    normalized.includes('srm vec') ||
    normalized.includes('srmvalliammai') ||
    normalized.includes('srm valliammai')
  );
}
