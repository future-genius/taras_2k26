import * as admin from 'firebase-admin';
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

    const deliveryRef = db.collection('email_deliveries').doc(task.deliveryId);

    if (result.success) {
      console.log(`[SUCCESS] Delivered email to ${targetEmail} (MessageId: ${result.messageId})`);
      sentCount++;
      remainingQuota--;

      // Record successful delivery
      await deliveryRef.set({
        participantId: task.participantId,
        email: task.email,
        emailType: task.emailType,
        trigger: task.trigger || null,
        status: 'sent',
        attempts: admin.firestore.FieldValue.increment(1),
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentDateIST: todayIST,
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        lastError: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      existingDeliveries.set(task.deliveryId, 'sent');
    } else {
      console.error(`[ERROR] Failed to send email to ${targetEmail}: ${result.error}`);
      failedCount++;

      // Record failed delivery attempt
      await deliveryRef.set({
        participantId: task.participantId,
        email: task.email,
        emailType: task.emailType,
        trigger: task.trigger || null,
        status: 'failed',
        attempts: admin.firestore.FieldValue.increment(1),
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        lastError: result.error,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
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
    sentToday: sentTodayCount + (IS_DRY_RUN ? 0 : sentCount)
  });
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
 * Gather Registration Confirmation Email Tasks
 */
async function gatherRegistrationConfirmationTasks(
  db: admin.firestore.Firestore,
  existingDeliveries: Map<string, 'sent' | 'failed'>
): Promise<EmailTask[]> {
  const tasks: EmailTask[] = [];
  try {
    const registrationsSnapshot = await db.collection('registrations').get();
    const participantDocsMap = await getParticipantsMap(db);

    registrationsSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const reg = doc.data();
      const registrationId = doc.id || reg.registrationId;
      const deliveryId = `reg_${registrationId}_confirmation`;

      // Skip if already sent
      if (existingDeliveries.get(deliveryId) === 'sent') return;

      // Check eligibility: confirmed status or verified payment
      const isConfirmed = reg.status === 'CONFIRMED' ||
                          reg.paymentStatus === 'VERIFIED' ||
                          reg.paymentStatus === 'NOT_REQUIRED';

      if (!isConfirmed) return;

      const participant = participantDocsMap.get(reg.uid) || participantDocsMap.get(reg.participantId) || {};
      const email = participant.email || reg.email;
      const fullName = participant.fullName || reg.participantName || 'Participant';

      if (!email) return;

      tasks.push({
        deliveryId,
        participantId: reg.participantId || participant.participantId || registrationId,
        uid: reg.uid || participant.uid || '',
        email,
        fullName,
        college: participant.college || 'Engineering Institution',
        department: participant.department || 'Engineering',
        registeredEvents: participant.registeredEvents || (reg.eventName ? [reg.eventName] : []),
        emailType: 'REGISTRATION_CONFIRMATION'
      });
    });
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
      const uid = doc.id || p.uid;
      const deliveryId = `participant_${uid}_countdown_${activeTrigger.trigger}`;

      // Skip if already sent
      if (existingDeliveries.get(deliveryId) === 'sent') return;

      if (!p.email) return;

      tasks.push({
        deliveryId,
        participantId: p.participantId || uid,
        uid,
        email: p.email,
        fullName: p.fullName || 'Participant',
        college: p.college || 'Engineering Institution',
        department: p.department || 'Engineering',
        registeredEvents: p.registeredEvents || [],
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
      map.set(doc.id, data);
      if (data.uid) map.set(data.uid, data);
      if (data.participantId) map.set(data.participantId, data);
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
    return { success: false, error: 'BREVO_API_KEY environment variable is not configured.' };
  }

  const payload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL
    },
    to: [
      {
        email: params.toEmail,
        name: params.toName
      }
    ],
    subject: params.subject,
    htmlContent: params.htmlContent,
    textContent: params.textContent
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resData: any = await response.json().catch(() => ({}));

    if (response.ok) {
      return { success: true, messageId: resData.messageId || resData.id };
    } else {
      const errorMsg = resData.message || resData.code || `HTTP ${response.status} ${response.statusText}`;
      return { success: false, error: errorMsg };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error sending Brevo email' };
  }
}

/**
 * Print Execution Summary Table
 */
function printSummary(stats: {
  found: number;
  sent: number;
  skipped: number;
  failed: number;
  remaining: number;
  dailyLimit: number;
  sentToday: number;
}) {
  console.log('\n====================================================');
  console.log('              AUTOMATION EXECUTION SUMMARY         ');
  console.log('====================================================');
  console.log(`  Found Total     : ${stats.found}`);
  console.log(`  Sent            : ${stats.sent}`);
  console.log(`  Skipped (Sent)  : ${stats.skipped}`);
  console.log(`  Failed          : ${stats.failed}`);
  console.log(`  Remaining Queued: ${stats.remaining}`);
  console.log(`  Daily Limit     : ${stats.dailyLimit}`);
  console.log(`  Sent Today      : ${stats.sentToday} / ${stats.dailyLimit}`);
  console.log('====================================================\n');
}

// Execute
main().catch(err => {
  console.error('[Fatal Error] Email automation failed:', err);
  process.exit(1);
});