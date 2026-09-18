/**
 * TARAS 2K26 — Comprehensive Firestore Security & Data Isolation Test Suite
 *
 * Programmatically verifies cross-role data isolation, query security boundaries,
 * payment-proof privacy, coordinator event scoping, certificate security, and scanning RBAC.
 */

interface SecurityTestContext {
  role: 'participant' | 'staff' | 'registration_staff' | 'coordinator' | 'admin' | 'super_admin';
  uid: string;
  assignedEventIds: string[];
}

interface MockDoc {
  id: string;
  [key: string]: any;
}

class SecurityRuleEvaluator {
  private db = new Map<string, Map<string, MockDoc>>();

  constructor() {
    this.db.set('participants', new Map());
    this.db.set('registrations', new Map());
    this.db.set('payment_proofs', new Map());
    this.db.set('utr_registry', new Map());
    this.db.set('teams', new Map());
    this.db.set('team_codes', new Map());
    this.db.set('event_checkins', new Map());
    this.db.set('round1_results', new Map());
    this.db.set('round2_results', new Map());
    this.db.set('results', new Map());
    this.db.set('certificate_records', new Map());
    this.db.set('audit_logs', new Map());
  }

  setDoc(collectionName: string, docId: string, data: MockDoc) {
    let col = this.db.get(collectionName);
    if (!col) {
      col = new Map();
      this.db.set(collectionName, col);
    }
    col.set(docId, { id: docId, ...data });
  }

  getDoc(collectionName: string, docId: string): MockDoc | null {
    return this.db.get(collectionName)?.get(docId) || null;
  }

  // Evaluate single-document read rule (GET)
  canReadDoc(user: SecurityTestContext, collectionName: string, docId: string): boolean {
    const doc = this.getDoc(collectionName, docId);
    if (!doc) return false;

    const isOwner = user.uid === doc.uid || user.uid === doc.participantUid;
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isStaff = isAdmin || user.role === 'staff' || user.role === 'registration_staff';
    const isCoordinator = isAdmin || user.role === 'coordinator';
    const isAssignedCoord = isCoordinator && doc.eventId && user.assignedEventIds.includes(doc.eventId);

    switch (collectionName) {
      case 'participants':
        return isOwner || isStaff || isCoordinator || isAdmin;

      case 'registrations':
        return isOwner || isStaff || isAdmin || isAssignedCoord;

      case 'payment_proofs':
        // STRICT: Owner, Staff, Admin ONLY. Coordinators & other participants DENIED!
        return isOwner || isStaff || isAdmin;

      case 'utr_registry':
        // Single-document GET allowed for duplicate check
        return true;

      case 'teams':
        const isMember = doc.memberUids && doc.memberUids.includes(user.uid);
        return isMember || isStaff || isAdmin || isCoordinator;

      case 'event_checkins':
        return isOwner || isStaff || isAdmin || isAssignedCoord;

      case 'round1_results':
      case 'round2_results':
        return isOwner || isStaff || isAdmin || isAssignedCoord;

      case 'results':
        return doc.status === 'PUBLISHED' || isStaff || isAdmin || isAssignedCoord;

      case 'certificate_records':
        return true; // Public get by certId allowed for verification

      case 'audit_logs':
        return isAdmin;

      default:
        return false;
    }
  }

  // Evaluate query read rule (LIST)
  canQueryCollection(user: SecurityTestContext, collectionName: string, queryFilter: { field?: string; value?: any }): boolean {
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isStaff = isAdmin || user.role === 'staff' || user.role === 'registration_staff';
    const isCoordinator = isAdmin || user.role === 'coordinator';

    switch (collectionName) {
      case 'participants':
        // Listing participants restricted to Staff and Admin
        return isStaff || isAdmin;

      case 'registrations':
        // Participant can query only own registrations (uid == user.uid)
        if (queryFilter.field === 'uid' && queryFilter.value === user.uid) return true;
        // Coordinator can query only assigned event registrations (eventId in assignedEventIds)
        if (isCoordinator && queryFilter.field === 'eventId' && user.assignedEventIds.includes(queryFilter.value)) return true;
        // Staff/Admin can query all
        return isStaff || isAdmin;

      case 'payment_proofs':
      case 'utr_registry':
        // Participant can query only own payment proofs (uid == user.uid)
        if (queryFilter.field === 'uid' && queryFilter.value === user.uid) return true;
        return isStaff || isAdmin;

      case 'certificate_records':
        // Participant can list only own certificates (participantUid == user.uid)
        if (queryFilter.field === 'participantUid' && queryFilter.value === user.uid) return true;
        if (queryFilter.field === 'uid' && queryFilter.value === user.uid) return true;
        return isStaff || isAdmin;

      default:
        return isStaff || isAdmin;
    }
  }

  // Evaluate check-in creation rule (SCAN WRITE)
  canCreateCheckIn(user: SecurityTestContext, scanType: 'gate' | 'round1' | 'round2', eventId?: string): boolean {
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isStaff = isAdmin || user.role === 'staff' || user.role === 'registration_staff';
    const isCoordinator = isAdmin || user.role === 'coordinator';

    if (scanType === 'gate') {
      // ONLY Staff / Registration Staff / Admin can perform Gate Check-In
      return isStaff || isAdmin;
    }

    if (scanType === 'round1' || scanType === 'round2') {
      // ONLY Assigned Coordinator or Admin can perform Round 1 / Round 2 scan
      if (isAdmin) return true;
      if (!isCoordinator) return false;
      return !!eventId && user.assignedEventIds.includes(eventId);
    }

    return false;
  }

  // Evaluate registration document update rule
  canUpdateRegistration(user: SecurityTestContext, regDocId: string, updates: Record<string, any>): boolean {
    const doc = this.getDoc('registrations', regDocId);
    if (!doc) return false;

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isStaff = isAdmin || user.role === 'staff' || user.role === 'registration_staff';
    if (isStaff) return true;

    // Participant update checks
    const isOwner = doc.uid === user.uid;
    if (!isOwner) return false;

    // Must not touch forbidden administrative/financial keys
    const forbiddenKeys = [
      'paymentVerifiedBy',
      'paymentVerifiedAt',
      'paymentRejectedBy',
      'paymentRejectedAt',
      'feeAmount',
      'calculatedFee',
      'feePerPerson',
      'isFirstPayment',
      'teamMemberCount',
      'participantId',
      'uid',
      'eventId'
    ];
    for (const k of Object.keys(updates)) {
      if (forbiddenKeys.includes(k)) return false;
    }

    // Must not self-confirm or self-verify
    if (updates.status === 'CONFIRMED') return false;
    if (updates.paymentStatus === 'VERIFIED') return false;

    return true;
  }
}

// ── TEST RUNNER ─────────────────────────────────────────────────────────────

function runSecurityTests() {
  console.log('\n=== TARAS 2K26 FIRESTORE SECURITY & ISOLATION TEST SUITE ===\n');
  const engine = new SecurityRuleEvaluator();

  // Setup mock documents
  engine.setDoc('participants', 'part_A', { uid: 'user_A', fullName: 'Alice', role: 'participant' });
  engine.setDoc('participants', 'part_B', { uid: 'user_B', fullName: 'Bob', role: 'participant' });

  engine.setDoc('registrations', 'reg_A', { registrationId: 'reg_A', uid: 'user_A', eventId: 'taras-01-int' });
  engine.setDoc('registrations', 'reg_B', { registrationId: 'reg_B', uid: 'user_B', eventId: 'taras-02-int' });

  engine.setDoc('payment_proofs', 'proof_A', { registrationId: 'reg_A', uid: 'user_A', utrNumber: 'UTR111' });
  engine.setDoc('payment_proofs', 'proof_B', { registrationId: 'reg_B', uid: 'user_B', utrNumber: 'UTR222' });

  engine.setDoc('teams', 'team_A', { teamId: 'team_A', memberUids: ['user_A'] });
  engine.setDoc('utr_registry', 'utr123456789012', { normalizedUtr: 'utr123456789012', registrationId: 'reg_A', uid: 'user_A' });

  const participantA: SecurityTestContext = { role: 'participant', uid: 'user_A', assignedEventIds: [] };
  const participantB: SecurityTestContext = { role: 'participant', uid: 'user_B', assignedEventIds: [] };
  const staffUser: SecurityTestContext = { role: 'registration_staff', uid: 'user_staff', assignedEventIds: [] };
  const coordA: SecurityTestContext = { role: 'coordinator', uid: 'user_coordA', assignedEventIds: ['taras-01-int'] };
  const adminUser: SecurityTestContext = { role: 'admin', uid: 'user_admin', assignedEventIds: [] };

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

  // 1. Participant Data Isolation
  console.log('--- 1. PARTICIPANT DATA ISOLATION ---');
  assertRule(
    'Participant A can read own payment proof',
    engine.canReadDoc(participantA, 'payment_proofs', 'proof_A') === true
  );
  assertRule(
    'Participant A CANNOT read Participant B payment proof',
    engine.canReadDoc(participantA, 'payment_proofs', 'proof_B') === false
  );
  assertRule(
    'Participant A CANNOT list all participants',
    engine.canQueryCollection(participantA, 'participants', {}) === false
  );
  assertRule(
    'Participant A CANNOT query Participant B registrations',
    engine.canQueryCollection(participantA, 'registrations', { field: 'uid', value: 'user_B' }) === false
  );

  // 2. Payment Proof Privacy
  console.log('\n--- 2. PAYMENT PROOF PRIVACY ---');
  assertRule(
    'Coordinator CANNOT read Participant A payment proof',
    engine.canReadDoc(coordA, 'payment_proofs', 'proof_A') === false
  );
  assertRule(
    'Registration Staff CAN read Participant A payment proof',
    engine.canReadDoc(staffUser, 'payment_proofs', 'proof_A') === true
  );

  // 3. Coordinator Event Isolation
  console.log('\n--- 3. COORDINATOR EVENT ISOLATION ---');
  assertRule(
    'Coordinator A CAN query Event A registrations',
    engine.canQueryCollection(coordA, 'registrations', { field: 'eventId', value: 'taras-01-int' }) === true
  );
  assertRule(
    'Coordinator A CANNOT query Event B registrations',
    engine.canQueryCollection(coordA, 'registrations', { field: 'eventId', value: 'taras-02-int' }) === false
  );
  assertRule(
    'Coordinator A CANNOT read Event B registration document',
    engine.canReadDoc(coordA, 'registrations', 'reg_B') === false
  );

  // 4. Scanning Security RBAC
  console.log('\n--- 4. SCANNING RBAC SECURITY ---');
  assertRule(
    'Registration Staff CAN perform Gate Check-In',
    engine.canCreateCheckIn(staffUser, 'gate') === true
  );
  assertRule(
    'Coordinator CANNOT perform Gate Check-In',
    engine.canCreateCheckIn(coordA, 'gate') === false
  );
  assertRule(
    'Assigned Coordinator CAN perform Round 1 scan on Event A',
    engine.canCreateCheckIn(coordA, 'round1', 'taras-01-int') === true
  );
  assertRule(
    'Unassigned Coordinator CANNOT perform Round 1 scan on Event B',
    engine.canCreateCheckIn(coordA, 'round1', 'taras-02-int') === false
  );
  assertRule(
    'Participant CANNOT perform Round 1 scan',
    engine.canCreateCheckIn(participantA, 'round1', 'taras-01-int') === false
  );

  // 5. Certificate Security
  console.log('\n--- 5. CERTIFICATE SECURITY ---');
  assertRule(
    'Participant A CAN list own certificates',
    engine.canQueryCollection(participantA, 'certificate_records', { field: 'participantUid', value: 'user_A' }) === true
  );
  assertRule(
    'Participant A CANNOT list all certificates globally',
    engine.canQueryCollection(participantA, 'certificate_records', {}) === false
  );

  // 6. Payment Submission & Registration Update Security
  console.log('\n--- 6. PAYMENT SUBMISSION & UTR SECURITY ---');
  assertRule(
    'Participant A CAN submit payment proof (status: PAYMENT_VERIFICATION_PENDING, paymentStatus: PENDING)',
    engine.canUpdateRegistration(participantA, 'reg_A', {
      paymentProofId: 'PAY-123',
      utrNumber: 'UTR-123456789012',
      paymentStatus: 'PENDING',
      status: 'PAYMENT_VERIFICATION_PENDING',
    }) === true
  );
  assertRule(
    'Participant A CANNOT self-verify payment (paymentStatus: VERIFIED)',
    engine.canUpdateRegistration(participantA, 'reg_A', {
      paymentStatus: 'VERIFIED',
    }) === false
  );
  assertRule(
    'Participant A CANNOT self-confirm registration (status: CONFIRMED)',
    engine.canUpdateRegistration(participantA, 'reg_A', {
      status: 'CONFIRMED',
    }) === false
  );
  assertRule(
    'Participant A CANNOT tamper with paymentVerifiedBy',
    engine.canUpdateRegistration(participantA, 'reg_A', {
      paymentVerifiedBy: 'user_admin',
    }) === false
  );
  assertRule(
    'Participant A CAN check single UTR existence by ID',
    engine.canReadDoc(participantA, 'utr_registry', 'utr123456789012') === true
  );
  assertRule(
    'Participant A CANNOT list all UTR records globally',
    engine.canQueryCollection(participantA, 'utr_registry', {}) === false
  );

  console.log(`\n=== SECURITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests();
