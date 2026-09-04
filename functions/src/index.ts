/**
 * TARAS 2K26 — Cloud Functions Main Module
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v2';
import { processServerEmailJob } from './email';
import { processServerCertificateJob } from './certificates';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function Trigger: Process Bulk Email Job
 * Triggered on creation of document in `email_jobs` collection or callable request.
 */
export const onEmailJobCreated = functions.firestore.onDocumentCreated(
  'email_jobs/{jobId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    if (data.status !== 'PENDING') return;

    const jobId = event.params.jobId;
    const createdBy = data.createdBy || 'ADMIN';

    try {
      await processServerEmailJob(jobId, createdBy);
    } catch (err) {
      console.error(`Email job ${jobId} failed:`, err);
    }
  }
);

/**
 * Cloud Function Trigger: Process Bulk Certificate Job
 * Triggered on creation of document in `certificate_jobs` collection or callable request.
 */
export const onCertificateJobCreated = functions.firestore.onDocumentCreated(
  'certificate_jobs/{jobId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    if (data.status !== 'PENDING') return;

    const jobId = event.params.jobId;
    const createdBy = data.createdBy || 'ADMIN';

    try {
      await processServerCertificateJob(jobId, createdBy);
    } catch (err) {
      console.error(`Certificate job ${jobId} failed:`, err);
    }
  }
);
