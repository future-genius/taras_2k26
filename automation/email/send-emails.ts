import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { generateRegistrationConfirmationEmail } from './templates/registrationConfirmation.js';
import { generateCountdownReminderEmail, CountdownTrigger } from './templates/countdownReminder.js';

// Configuration Defaults
const EVENT_DATE_IST = '2026-09-26'; // Official TARAS 2K26 Event Date
const VENUE_NAME = 'SRM Valliammai Engineering College, Chennai';
const DEFAULT_DAILY_LIMIT = 250;
const DEFAULT_SENDER_EMAIL = 'taras2k26@valliammai.edu.in';
const DEFAULT_SENDER_NAME = 'TARAS 2K26 Team';
const TIMEZONE = 'Asia/Kolkata';

// Environment & Secrets
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME;

const IS_DRY_RUN = process.env.EMAIL_DRY_RUN?.trim() === 'true';
const IS_TEST_MODE = process.env.EMAIL_TEST_MODE?.trim() === 'true';
const TEST_EMAIL = process.env.TEST_EMAIL?.trim() || '';

// TEST MODE must never create/update production delivery records.
const SHOULD_PERSIST_PRODUCTION_DELIVERY = !IS_DRY_RUN && !IS_TEST_MODE;

const DAILY_LIMIT = parseInt(process.env.EMAIL_DAILY_LIMIT || `${DEFAULT_DAILY_LIMIT}`, 10);

interface EmailTask {
  deliveryId: string;
  participantId: string;
  uid: string;
  email: string;
  fullName: string;
  college: string;
  department: string;
  registeredEvents: string[];
  emailType: 'REGISTRATION_CONFIRMATION' | 'COUNTDOWN_REMINDER';
  trigger?: CountdownTrigger;
}

/**
 * Main Execution Function
 */
async function main() {
  console.log('====================================================');
  console.log('         TARAS 2K26 — EMAIL AUTOMATION SYSTEM      ');
  console.log('====================================================');
  console.log(`[Config] Date (IST Timezone): ${getTodayIST()}`);
  console.log(`[Config] Execution Mode: ${IS_DRY_RUN ? 'DRY-RUN (Simulated)' : IS_TEST_MODE ? `TEST MODE (Redirect -> ${TEST_EMAIL})` : 'PRODUCTION'}`);
  console.log(`[Config] Daily Limit: ${DAILY_LIMIT} emails/day`);
  if (IS_TEST_MODE) {
    console.log('[Safety] TEST MODE: production delivery records will NOT be created or modified.');
    console.log('[Safety] TEST MODE: production daily quota will NOT be consumed.');
  }

  // 1. Initialize Firebase Admin SDK
  initFirebaseAdmin();
  const db = admin.firestore();

  // 2. Calculate Daily Limit Quota Remaining
  const todayIST = getTodayIST();
  const sentTodayCount = await getSentCountForDate(db, todayIST);
  let remainingQuota = Math.max(0, DAILY_LIMIT - sentTodayCount);

  console.log(`[Quota] Emails sent today (${todayIST}): ${sentTodayCount} / ${DAILY_LIMIT}`);
  console.log(`[Quota] Remaining capacity for this execution: ${remainingQuota}`);

  if (remainingQuota <= 0) {
    console.log('[Quota] Daily limit reached! Postponing remaining emails to next scheduled run.');
    printSummary({ found: 0, sent: 0, skipped: 0, failed: 0, remaining: 0, dailyLimit: DAILY_LIMIT, sentToday: sentTodayCount });
    return;
  }

  // 3. Fetch Existing Delivery Records to ensure Idempotency
  const existingDeliveries = await getExistingDeliveries(db);
  console.log(`[Firestore] Loaded ${existingDeliveries.size} past delivery records for idempotency.`);

  // 4. Gather Tasks
  const tasks: EmailTask[] = [];

  // A. Registration Confirmations
  const confirmationTasks = await gatherRegistrationConfirmationTasks(db, existingDeliveries);
  tasks.push(...confirmationTasks);

  // B. Countdown Reminders
  const countdownTasks = await gatherCountdownReminderTasks(db, existingDeliveries, todayIST);
  tasks.push(...countdownTasks);

  console.log(`[Tasks] Total eligible email tasks identified: ${tasks.length}`);

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let deferredCount = 0;
  let testSentCount = 0;
  let testFailedCount = 0;

  // 5. Process Tasks within Daily Limit Capacity
  for (const task of tasks) {
    // Check if task was sent during this run or recorded
    if (existingDeliveries.get(task.deliveryId) === 'sent') {
      skippedCount++;
      continue;
    }

    // Check remaining daily capacity
    if (remainingQuota <= 0) {
      deferredCount++;
      continue;
    }

    console.log(`\n----------------------------------------------------`);
    console.log(`Processing Task: [${task.emailType}] ${task.deliveryId}`);
    console.log(`Recipient: ${task.fullName} (${task.email}) | ID: ${task.participantId}`);

    // Generate Email Payload
    const targetEmail = IS_TEST_MODE && TEST_EMAIL ? TEST_EMAIL : task.email;
    let payload: { subject: string; html: string; text: string };

    if (task.emailType === 'REGISTRATION_CONFIRMATION') {
      payload = generateRegistrationConfirmationEmail({
        participantName: task.fullName,
        participantId: task.participantId,
        email: targetEmail,
        college: task.college,
        department: task.department,
        registeredEvents: task.registeredEvents,
        eventDate: '26 September 2026',
        venue: VENUE_NAME
      });
    } else {
      payload = generateCountdownReminderEmail({
        participantName: task.fullName,
        participantId: task.participantId,
        email: targetEmail,
        college: task.college,
        registeredEvents: task.registeredEvents,
        trigger: task.trigger || '7d',
        eventDate: '26 September 2026',
        venue: VENUE_NAME
      });
    }

    if (IS_DRY_RUN) {
      console.log(`[DRY-RUN] WOULD SEND to: ${targetEmail}`);
      console.log(`[DRY-RUN] Subject: "${payload.subject}"`);
      sentCount++;
      remainingQuota--;
      continue;
    }

    // Dispatch via Brevo REST API
    const result = await sendBrevoEmail({
      toEmail: targetEmail,
      toName: task.fullName,
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text
    });

    if (result.success) {
      console.log(`[SUCCESS] Delivered email to ${targetEmail} (MessageId: ${result.messageId})`);

      if (IS_TEST_MODE) {
        // CRITICAL SAFETY RULE:
        // Do NOT write task.deliveryId to email_deliveries in test mode.
        // A test must never suppress the participant's later production email.
        testSentCount++;
        remainingQuota--;
        continue;
      }

      sentCount++;
      remainingQuota--;

      // Record successful production delivery only.
      await recordDelivery(db, task, todayIST, 'sent', null);
      existingDeliveries.set(task.deliveryId, 'sent');
    } else {
      console.error(`[ERROR] Failed to send email to ${targetEmail}: ${result.error}`);

      if (IS_TEST_MODE) {
        // Do not persist test failures into production state either.
        testFailedCount++;
        continue;
      }

      await recordDelivery(db, task, todayIST, 'failed', result.error || 'Unknown error');
      failedCount++;
    }
  }

  // 6. Print Execution Summary
  printSummary({
    found: tasks.length,
    sent: sentCount,
    skipped: skippedCount,
    failed: failedCount,
    remaining: deferredCount,
    dailyLimit: DAILY_LIMIT,
    sentToday: sentTodayCount + (SHOULD_PERSIST_PRODUCTION_DELIVERY ? sentCount : 0),
    testSent: IS_TEST_MODE ? testSentCount : undefined,
    testFailed: IS_TEST_MODE ? testFailedCount : undefined
  });
}

/**
 * Record a production delivery attempt.
 * Guarded so TEST/DRY-RUN can never mutate production delivery state.
 */
async function recordDelivery(
  db: admin.firestore.Firestore,
  task: EmailTask,
  todayIST: string,
  status: 'sent' | 'failed',
  lastError: string | null
) {
  if (!SHOULD_PERSIST_PRODUCTION_DELIVERY) return;

  const deliveryRef = db.collection('email_deliveries').doc(task.deliveryId);
  const baseData = {
    participantId: task.participantId,
    email: task.email,
    emailType: task.emailType,
    trigger: task.trigger || null,
    status,
    attempts: admin.firestore.FieldValue.increment(1),
    lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
    lastError,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (status === 'sent') {
    await deliveryRef.set({
      ...baseData,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentDateIST: todayIST
    }, { merge: true });
  } else {
    await deliveryRef.set(baseData, { merge: true });
  }
}

/**
 * Official TARAS 2K26 Event Catalog Map
 */
const OFFICIAL_EVENTS_CATALOG: Record<string, string> = {
  'taras-01': 'Paper-X-Verse',
  'taras-02': 'Circuitrix',
  'taras-03': 'ElectraHack (IoT & AI Sprint)',
  'taras-04': 'CineMatrix',
  'taras-05': 'Byte Hunt (Tech Treasure Hunt)',
  'taras-06': 'VLSI Architect Workshop',
  'taras-07': 'Doc Ock’s Clue Cartel',
  'taras-08': 'Knull’s Void',
  'circuit-debugging': 'Circuit Debugging',
  'hackathon': 'AI Hackathon'
};

/**
 * Resolve clean human-readable event title from ID and optional stored name
 */
function resolveEventName(eventId?: string, fallbackName?: string): string {
  const cleanFallback = (fallbackName || '').trim();
  if (cleanFallback && !cleanFallback.toLowerCase().startsWith('taras-')) {
    return cleanFallback;
  }
  const cleanId = (eventId || '').trim().toLowerCase();
  if (OFFICIAL_EVENTS_CATALOG[cleanId]) {
    return OFFICIAL_EVENTS_CATALOG[cleanId];
  }
  return cleanFallback || eventId?.trim() || 'TARAS 2K26 Event';
}

/**
 * Mask email address for safe diagnostic logging without leaking PII
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user.charAt(0)}***@${domain}`;
  return `${user.charAt(0)}***${user.charAt(user.length - 1)}@${domain}`;
}

/**
 * Initialize Firebase Admin SDK
 */
function initFirebaseAdmin() {
  if (admin.apps.length > 0) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('[Firebase] Admin SDK initialized via FIREBASE_SERVICE_ACCOUNT secret.');
      return;
    } catch (err: any) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err.message);
    }
  }

  // Local fallback if path is provided or local file exists (for local testing without hardcoded secrets)
  const localCredsPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    (fs.existsSync('c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json')
      ? 'c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json'
      : '');
  if (localCredsPath && fs.existsSync(localCredsPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(localCredsPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log(`[Firebase] Admin SDK initialized via local service account credentials.`);
      return;
    } catch (err: any) {
      console.error('[Firebase] Failed to parse local service account JSON:', err.message);
    }
  }

  // Fallback to default application credentials if available
  try {
    admin.initializeApp();
    console.log('[Firebase] Admin SDK initialized via default application credentials.');
  } catch (err: any) {
    if (IS_DRY_RUN) {
      console.warn('[Firebase] Warning: Admin SDK initialization failed, but continuing in DRY-RUN mode.');
    } else {
      throw new Error(`Firebase Admin SDK failed to initialize: ${err.message}`);
    }
  }
}

/**
 * Get current date string YYYY-MM-DD in IST timezone
 */
function getTodayIST(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // returns YYYY-MM-DD
  return formatter.format(now);
}

/**
 * Query existing delivery status map from email_deliveries collection
 */
async function getExistingDeliveries(db: admin.firestore.Firestore): Promise<Map<string, 'sent' | 'failed'>> {
  const map = new Map<string, 'sent' | 'failed'>();
  try {
    const snapshot = await db.collection('email_deliveries').get();
    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      map.set(doc.id, data.status === 'sent' ? 'sent' : 'failed');
    });
  } catch (err: any) {
    console.warn(`[Firestore] Could not load email_deliveries collection: ${err.message}`);
  }
  return map;
}

/**
 * Get count of emails successfully sent today in IST
 */
async function getSentCountForDate(db: admin.firestore.Firestore, dateIST: string): Promise<number> {
  try {
    const snapshot = await db.collection('email_deliveries')
      .where('status', '==', 'sent')
      .where('sentDateIST', '==', dateIST)
      .get();
    return snapshot.size;
  } catch (err) {
    return 0;
  }
}

/**
 * Gather Registration Confirmation Email Tasks with Detailed Diagnostic Logging
 */
async function gatherRegistrationConfirmationTasks(
  db: admin.firestore.Firestore,
  existingDeliveries: Map<string, 'sent' | 'failed'>
): Promise<EmailTask[]> {
  const tasks: EmailTask[] = [];
  try {
    const registrationsSnapshot = await db.collection('registrations').get();
    const participantDocsMap = await getParticipantsMap(db);

    console.log(`\n[Registration] Scanned ${registrationsSnapshot.size} total registration records from Firestore.`);

    let eligibleCount = 0;
    let alreadyDeliveredCount = 0;
    let ineligibleStatusCount = 0;
    let missingProfileOrEmailCount = 0;

    registrationsSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const reg = doc.data();
      const registrationId = (doc.id || reg.registrationId || '').toString().trim();
      if (!registrationId) return;

      const deliveryId = `reg_${registrationId}_confirmation`;
      const statusRaw = (reg.status || '').toString().trim();
      const statusNormalized = statusRaw.toUpperCase();
      const paymentStatusRaw = (reg.paymentStatus || '').toString().trim();
      const paymentStatusNormalized = paymentStatusRaw.toUpperCase();

      // Check if already delivered (idempotency guarantee)
      if (existingDeliveries.get(deliveryId) === 'sent') {
        alreadyDeliveredCount++;
        console.log(`[Registration] Skipped ${registrationId} — already delivered (${deliveryId}).`);
        return;
      }

      // Check for explicitly disqualified / cancelled / draft registrations
      const isDisqualified = ['CANCELLED', 'REJECTED', 'DRAFT', 'NOT_REGISTERED'].includes(statusNormalized);
      if (isDisqualified) {
        ineligibleStatusCount++;
        console.log(`[Registration] Skipped ${registrationId} — disqualified status (${statusRaw}).`);
        return;
      }

      // Eligibility conditions:
      // 1. Confirmed / verified registration status
      const isConfirmedStatus = [
        'CONFIRMED',
        'VERIFIED',
        'APPROVED',
        'CHECKED_IN',
        'ATTENDED',
        'SHORTLISTED',
        'WINNER',
        'CERTIFICATE_READY'
      ].includes(statusNormalized);

      // 2. Verified / exempt payment status
      const isVerifiedPayment = [
        'VERIFIED',
        'NOT_REQUIRED',
        'PAID',
        'COMPLETED',
        'SUCCESS',
        'FREE'
      ].includes(paymentStatusNormalized);

      // 3. Zero-fee registration (e.g. subsequent events after verified payment or free workshop)
      const isZeroFee = (reg.calculatedFee === 0 || reg.feeAmount === 0);

      const isEligible = isConfirmedStatus || isVerifiedPayment || isZeroFee;

      if (!isEligible) {
        ineligibleStatusCount++;
        console.log(`[Registration] Skipped ${registrationId} — status not eligible (status="${statusRaw || 'NONE'}", payment="${paymentStatusRaw || 'NONE'}", fee=${reg.calculatedFee ?? reg.feeAmount ?? 'N/A'}).`);
        return;
      }

      // Participant & Email resolution
      const participant =
        (reg.uid && participantDocsMap.get(reg.uid.toString().trim())) ||
        (reg.participantId && participantDocsMap.get(reg.participantId.toString().trim())) ||
        (doc.id && participantDocsMap.get(doc.id.toString().trim())) ||
        {};

      const rawEmail = (reg.email || participant.email || '').toString().trim();
      if (!rawEmail || !rawEmail.includes('@')) {
        missingProfileOrEmailCount++;
        console.log(`[Registration] Skipped ${registrationId} — participant profile or valid email not found (uid="${reg.uid || ''}", participantId="${reg.participantId || ''}").`);
        return;
      }

      const effectiveParticipantId = (reg.participantId || participant.participantId || registrationId).toString().trim();
      const effectiveUid = (reg.uid || participant.uid || '').toString().trim();
      const fullName = (participant.fullName || reg.participantName || reg.teamLeaderName || 'Participant').toString().trim();
      const college = (participant.college || reg.college || 'SRM Valliammai Engineering College').toString().trim();
      const department = (participant.department || reg.department || 'ECE').toString().trim();

      // Resolve event name cleanly
      const resolvedEventName = resolveEventName(reg.eventId, reg.eventName);

      eligibleCount++;
      console.log(`[Registration] Eligible: ${registrationId} -> Recipient: ${fullName} (${maskEmail(rawEmail)}) | Event: "${resolvedEventName}"`);

      tasks.push({
        deliveryId,
        participantId: effectiveParticipantId,
        uid: effectiveUid,
        email: rawEmail,
        fullName,
        college,
        department,
        registeredEvents: [resolvedEventName],
        emailType: 'REGISTRATION_CONFIRMATION'
      });
    });

    console.log(`[Registration] Discovery Summary: Scanned=${registrationsSnapshot.size} | Eligible=${eligibleCount} | Already Delivered=${alreadyDeliveredCount} | Ineligible Status=${ineligibleStatusCount} | Missing Profile/Email=${missingProfileOrEmailCount}\n`);

  } catch (err: any) {
    console.warn(`[Firestore] Error querying registrations: ${err.message}`);
  }
  return tasks;
}

/**
 * Gather Countdown Reminder Email Tasks based on IST Event Date
 */
async function gatherCountdownReminderTasks(
  db: admin.firestore.Firestore,
  existingDeliveries: Map<string, 'sent' | 'failed'>,
  todayIST: string
): Promise<EmailTask[]> {
  const tasks: EmailTask[] = [];

  // Define Trigger Dates relative to Event Date 2026-09-26
  const triggers: { trigger: CountdownTrigger; dateStr: string }[] = [
    { trigger: '7d', dateStr: '2026-09-19' },
    { trigger: '3d', dateStr: '2026-09-23' },
    { trigger: '1d', dateStr: '2026-09-25' },
    { trigger: '0d', dateStr: '2026-09-26' }
  ];

  // Select the latest trigger whose date has arrived.
  // This prevents the 7d trigger from remaining active after Sep 19.
  const activeTrigger = [...triggers].reverse().find(t => todayIST >= t.dateStr);
  if (!activeTrigger) {
    console.log(`[Countdown] No countdown trigger active for date ${todayIST}.`);
    return tasks;
  }

  console.log(`[Countdown] Active trigger identified: ${activeTrigger.trigger} (Target Date: ${activeTrigger.dateStr})`);

  try {
    const participantsSnapshot = await db.collection('participants').get();
    participantsSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const p = doc.data();
      const uid = (doc.id || p.uid || '').toString().trim();
      const deliveryId = `participant_${uid}_countdown_${activeTrigger.trigger}`;

      // Skip if already sent
      if (existingDeliveries.get(deliveryId) === 'sent') return;

      if (!p.email) return;

      // Cleanly resolve event names for display
      const displayEvents = (p.registeredEvents || []).map((idOrName: string) => resolveEventName(idOrName, idOrName));

      tasks.push({
        deliveryId,
        participantId: p.participantId || uid,
        uid,
        email: p.email,
        fullName: p.fullName || 'Participant',
        college: p.college || 'Engineering Institution',
        department: p.department || 'Engineering',
        registeredEvents: displayEvents,
        emailType: 'COUNTDOWN_REMINDER',
        trigger: activeTrigger.trigger
      });
    });
  } catch (err: any) {
    console.warn(`[Firestore] Error querying participants for countdown: ${err.message}`);
  }

  return tasks;
}

/**
 * Helper to fetch all participants into a Map for fast lookup
 */
async function getParticipantsMap(db: admin.firestore.Firestore): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  try {
    const snapshot = await db.collection('participants').get();
    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      const docId = doc.id.toString().trim();
      map.set(docId, data);
      if (data.uid) map.set(data.uid.toString().trim(), data);
      if (data.participantId) map.set(data.participantId.toString().trim(), data);
    });
  } catch (err: any) {
    console.warn(`[Firestore] Error loading participants map: ${err.message}`);
  }
  return map;
}

/**
 * Send Transactional Email via Brevo REST API v3
 */
async function sendBrevoEmail(params: {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!BREVO_API_KEY) {
    return { success: false, error: 'BREVO_API_KEY is not configured.' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
        to: [{ email: params.toEmail, name: params.toName }],
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent
      })
    });

    const responseText = await response.text();
    let responseData: any = {};
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      // Non-JSON response; handled by status below.
    }

    if (!response.ok) {
      return {
        success: false,
        error: `${response.status} ${response.statusText}: ${responseText.slice(0, 500)}`
      };
    }

    return { success: true, messageId: responseData.messageId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown network error' };
  }
}

function printSummary(summary: {
  found: number;
  sent: number;
  skipped: number;
  failed: number;
  remaining: number;
  dailyLimit: number;
  sentToday: number;
  testSent?: number;
  testFailed?: number;
}) {
  console.log('\n====================================================');
  console.log('                 EXECUTION SUMMARY                  ');
  console.log('====================================================');
  console.log(`Found: ${summary.found}`);
  console.log(`Sent: ${summary.sent}`);
  console.log(`Skipped: ${summary.skipped}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Deferred: ${summary.remaining}`);
  console.log(`Emails sent today: ${summary.sentToday} / ${summary.dailyLimit}`);
  if (summary.testSent !== undefined) {
    console.log(`Test emails sent: ${summary.testSent}`);
    console.log(`Test emails failed: ${summary.testFailed || 0}`);
    console.log('[Safety] TEST MODE made no changes to production email_deliveries records.');
  }
  console.log('====================================================');
}

main().catch((error) => {
  console.error('[FATAL] Email automation failed:', error);
  process.exit(1);
});
