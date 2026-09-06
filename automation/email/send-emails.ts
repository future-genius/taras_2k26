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

  // TEST MODE has a dedicated end-to-end probe that does not depend on
  // production registrations, countdown dates, or delivery records.
  if (IS_TEST_MODE) {
    await runDedicatedTestEmail();
    return;
  }

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
    if (existingDeliveries.get(task.deliveryId) === 'sent') {
      skippedCount++;
      continue;
    }

    if (remainingQuota <= 0) {
      deferredCount++;
      continue;
    }

    console.log(`\n----------------------------------------------------`);
    console.log(`Processing Task: [${task.emailType}] ${task.deliveryId}`);
    console.log(`Recipient: ${task.fullName} (${task.email}) | ID: ${task.participantId}`);

    const targetEmail = task.email;
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

    const result = await sendBrevoEmail({
      toEmail: targetEmail,
      toName: task.fullName,
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text
    });

    if (result.success) {
      console.log(`[SUCCESS] Delivered email to ${targetEmail} (MessageId: ${result.messageId})`);
      sentCount++;
      remainingQuota--;
      await recordDelivery(db, task, todayIST, 'sent', null);
      existingDeliveries.set(task.deliveryId, 'sent');
    } else {
      console.error(`[ERROR] Failed to send email to ${targetEmail}: ${result.error}`);
      await recordDelivery(db, task, todayIST, 'failed', result.error || 'Unknown error');
      failedCount++;
    }
  }

  printSummary({
    found: tasks.length,
    sent: sentCount,
    skipped: skippedCount,
    failed: failedCount,
    remaining: deferredCount,
    dailyLimit: DAILY_LIMIT,
    sentToday: sentTodayCount + sentCount
  });
}

/**
 * Dedicated end-to-end TEST MODE probe.
 * Sends exactly one test email through Brevo without reading or writing
 * production email_deliveries state and without consuming production quota.
 */
async function runDedicatedTestEmail() {
  if (!TEST_EMAIL) {
    throw new Error('TEST_EMAIL is required when EMAIL_TEST_MODE=true.');
  }

  const testParticipantName = 'TARAS 2K26 Test Participant';
  const payload = generateRegistrationConfirmationEmail({
    participantName: testParticipantName,
    participantId: 'TEST-TARAS-2K26',
    email: TEST_EMAIL,
    college: 'Test Engineering College',
    department: 'Electronics and Communication Engineering',
    registeredEvents: ['TEST EVENT — EMAIL PIPELINE'],
    eventDate: '26 September 2026',
    venue: VENUE_NAME
  });

  console.log('[Test] Running dedicated end-to-end Brevo test.');
  console.log(`[Test] Recipient: ${TEST_EMAIL}`);
  console.log(`[Test] Subject: "${payload.subject}"`);
  console.log('[Test] No production Firestore delivery records will be read or modified.');

  const result = await sendBrevoEmail({
    toEmail: TEST_EMAIL,
    toName: testParticipantName,
    subject: `[TEST] ${payload.subject}`,
    htmlContent: payload.html,
    textContent: payload.text
  });

  if (!result.success) {
    console.error(`[Test] FAILED: ${result.error}`);
    console.log('[Test] No production email_deliveries changes were made.');
    throw new Error(result.error || 'Brevo test email failed.');
  }

  console.log(`[Test] SUCCESS: Brevo accepted the test email (MessageId: ${result.messageId}).`);
  console.log('[Test] Production email_deliveries: UNCHANGED.');
  console.log('[Test] Production daily quota: UNCHANGED.');
  console.log('====================================================');
  console.log('                 TEST SUMMARY                      ');
  console.log('====================================================');
  console.log('Test emails sent: 1');
  console.log('Test emails failed: 0');
  console.log('Production records changed: 0');
  console.log('Production quota consumed: 0');
  console.log('====================================================');
}

/**
 * Record a production delivery attempt.
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

function initFirebaseAdmin() {
  if (admin.apps.length > 0) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('[Firebase] Admin SDK initialized via FIREBASE_SERVICE_ACCOUNT secret.');
      return;
    } catch (err: any) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err.message);
    }
  }

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

function getTodayIST(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  return formatter.format(now);
}

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

      if (existingDeliveries.get(deliveryId) === 'sent') return;

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

async function gatherCountdownReminderTasks(
  db: admin.firestore.Firestore,
  existingDeliveries: Map<string, 'sent' | 'failed'>,
  todayIST: string
): Promise<EmailTask[]> {
  const tasks: EmailTask[] = [];

  const triggers: { trigger: CountdownTrigger; dateStr: string }[] = [
    { trigger: '7d', dateStr: '2026-09-19' },
    { trigger: '3d', dateStr: '2026-09-23' },
    { trigger: '1d', dateStr: '2026-09-25' },
    { trigger: '0d', dateStr: '2026-09-26' }
  ];

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

async function getParticipantsMap(db: admin.firestore.Firestore): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const snapshot = await db.collection('participants').get();
  snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
    const data = doc.data();
    map.set(doc.id, data);
    if (data.uid) map.set(data.uid, data);
    if (data.participantId) map.set(data.participantId, data);
  });
  return map;
}

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
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
        to: [{ email: params.toEmail, name: params.toName }],
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Brevo API ${response.status}: ${errorText}` };
    }

    const data = await response.json() as { messageId?: string };
    return { success: true, messageId: data.messageId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown Brevo API error' };
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
  console.log('====================================================');
  console.log('                 EXECUTION SUMMARY                  ');
  console.log('====================================================');
  console.log(`Found: ${summary.found}`);
  console.log(`Sent: ${summary.sent}`);
  console.log(`Skipped: ${summary.skipped}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Deferred: ${summary.remaining}`);
  console.log(`Emails sent today: ${summary.sentToday} / ${summary.dailyLimit}`);
  if (summary.testSent !== undefined) console.log(`Test emails sent: ${summary.testSent}`);
  if (summary.testFailed !== undefined) console.log(`Test emails failed: ${summary.testFailed}`);
  if (IS_TEST_MODE) console.log('[Safety] TEST MODE made no changes to production email_deliveries records.');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('[FATAL]', err?.message || err);
  process.exit(1);
});
