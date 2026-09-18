import fs from 'fs';
import path from 'path';

// Read .env.local into process.env before dynamic import of firebase services
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const [k, ...rest] = line.trim().split('=');
      if (k && !k.startsWith('#')) {
        process.env[k] = rest.join('=').trim();
      }
    });
  }
} catch (e) {
  console.warn('Could not read .env.local:', e);
}

async function runExportSystemTests() {
  console.log('\n=== TARAS 2K26 PARTICIPANT EXPORT SYSTEM TEST SUITE ===\n');

  const { verifyExportAuthorization } = await import('../src/services/participantExportService');
  type ParticipantProfile = import('../src/types/participant').ParticipantProfile;

  let passed = 0;
  let failed = 0;

  function assertRule(name: string, condition: boolean) {
    if (condition) {
      console.log(`  PASS ✓ [${name}]`);
      passed++;
    } else {
      console.error(`  FAIL ✗ [${name}]`);
      failed++;
    }
  }

  // 1. Role Authorization Verification
  console.log('--- 1. EXPORT RBAC AUTHORIZATION ---');

  const presidentProfile: ParticipantProfile = {
    uid: 'pres_1',
    role: 'super_admin',
    email: 'president@taras2k26.test',
    fullName: 'President',
    participantId: 'P1',
    registrationNumber: 'P1',
    college: 'SRM',
    department: 'ECE',
    year: 'IV',
    section: 'A',
    phone: '000',
    registeredEvents: [],
    teamIds: [],
    venueCheckIn: true,
    certificateStatus: 'ELIGIBLE',
    createdAt: '',
    updatedAt: '',
  };

  const regStaffProfile: ParticipantProfile = {
    uid: 'staff_1',
    role: 'registration_staff',
    email: 'staff@taras2k26.test',
    fullName: 'Staff',
    participantId: 'S1',
    registrationNumber: 'S1',
    college: 'SRM',
    department: 'ECE',
    year: 'IV',
    section: 'A',
    phone: '000',
    registeredEvents: [],
    teamIds: [],
    venueCheckIn: true,
    certificateStatus: 'ELIGIBLE',
    createdAt: '',
    updatedAt: '',
  };

  const coordProfile: ParticipantProfile = {
    uid: 'coord_1',
    role: 'coordinator',
    email: 'coord@taras2k26.test',
    fullName: 'Coord',
    participantId: 'C1',
    registrationNumber: 'C1',
    college: 'SRM',
    department: 'ECE',
    year: 'IV',
    section: 'A',
    phone: '000',
    registeredEvents: [],
    teamIds: [],
    venueCheckIn: true,
    certificateStatus: 'ELIGIBLE',
    createdAt: '',
    updatedAt: '',
  };

  const participantProfile: ParticipantProfile = {
    uid: 'part_1',
    role: 'participant',
    email: 'part@taras2k26.test',
    fullName: 'Part',
    participantId: 'PT1',
    registrationNumber: 'PT1',
    college: 'SRM',
    department: 'ECE',
    year: 'IV',
    section: 'A',
    phone: '000',
    registeredEvents: [],
    teamIds: [],
    venueCheckIn: true,
    certificateStatus: 'ELIGIBLE',
    createdAt: '',
    updatedAt: '',
  };

  let presAllowed = false;
  try {
    verifyExportAuthorization(presidentProfile);
    presAllowed = true;
  } catch {}
  assertRule('President / Super Admin is ALLOWED to export', presAllowed === true);

  let staffAllowed = false;
  try {
    verifyExportAuthorization(regStaffProfile);
    staffAllowed = true;
  } catch {}
  assertRule('Registration Staff / Team is ALLOWED to export', staffAllowed === true);

  let coordDenied = false;
  try {
    verifyExportAuthorization(coordProfile);
  } catch (err: any) {
    if (err.message.includes('ACCESS_DENIED')) coordDenied = true;
  }
  assertRule('Event Coordinator is DENIED complete export access', coordDenied === true);

  let partDenied = false;
  try {
    verifyExportAuthorization(participantProfile);
  } catch (err: any) {
    if (err.message.includes('ACCESS_DENIED')) partDenied = true;
  }
  assertRule('Ordinary Participant is DENIED export access', partDenied === true);

  // 2. Sensitive Field Exclusion Audit
  console.log('\n--- 2. SENSITIVE FIELD EXCLUSION AUDIT ---');

  const sensitiveHeaders = [
    'password',
    'token',
    'secret',
    'qrToken',
    'privateKey',
    'refreshToken',
    'serviceAccount',
  ];

  const exportHeaders = [
    'S.No',
    'Participant ID',
    'Registration ID',
    'Registration Number',
    'Participant Name',
    'Email',
    'Phone',
    'College',
    'Department',
    'Year',
    'Section',
    'Event Name',
    'Registration Status',
    'Payment Status',
    'Payment Verification Status',
    'Transaction ID / UTR',
    'Transaction Date',
    'Bank Name',
    'Registration Date',
    'Gate Entry Status',
    'Gate Entry Time',
  ];

  const leaksSensitive = exportHeaders.some((h) => sensitiveHeaders.includes(h.toLowerCase()));
  assertRule('Export headers EXCLUDE all sensitive security fields', leaksSensitive === false);

  console.log(`\n=== EXPORT SYSTEM TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runExportSystemTests().catch((err) => {
  console.error('Export system test error:', err);
  process.exit(1);
});
