/**
 * TARAS 2K26 — Demo Day Provisioning & Setup Script
 *
 * Provisions:
 * 1. Demo Registration Staff Account:
 *    Email:    registration.demo@taras2k26.test
 *    Password: TARAS@Demo2026
 *    Role:     registration_staff
 *
 * 2. Deterministic Demo Participant Record:
 *    Name:             TARAS Demo Participant
 *    Registration ID:  TARAS-DEMO-001
 *    QR Token:         QR-TARAS-DEMO-001-TOKEN
 *    Event:            Demo Event
 *    Department:       Electronics and Communication Engineering
 *    Year/Sec:         IV Year (Demo)
 *    isDemo:           true
 *
 * Usage:
 *   node scripts/setup-demo-account.mjs
 */

export const DEMO_CONFIG = {
  staff: {
    email: 'registration.demo@taras2k26.test',
    password: 'TARAS@Demo2026',
    role: 'registration_staff' as const,
  },
  participant: {
    participantId: 'TARAS-DEMO-001',
    fullName: 'TARAS Demo Participant',
    email: 'demo.participant@taras2k26.test',
    qrToken: 'QR-TARAS-DEMO-001-TOKEN',
    event: 'Demo Event',
    eventId: 'TR-DEMO',
    department: 'Electronics and Communication Engineering',
    year: 'IV' as const,
    section: 'Demo',
    isDemo: true,
  },
};
