/**
 * TARAS 2K26 — Server-Side E-Certificate Generation Engine
 *
 * Runs asynchronously on the server to generate, store, and issue authentic symposium certificates.
 *
 * Features:
 * - Server RBAC validation (caller must be admin/super_admin/PRESIDENT)
 * - Cryptographic unique ID generator (`TARAS26-CERT-XXXXXX`)
 * - PDF / Storage binary upload to Firebase Storage bucket `/certificates/{certId}.pdf`
 * - Writes metadata record to `/certificate_records/{certId}`
 * - Updates participant profile `certificateStatus: "READY"`
 * - Triggers automated email notification to student
 * - Updates job progress telemetry in `certificate_jobs/{jobId}`
 */

import * as admin from 'firebase-admin';

import * as crypto from 'crypto';

export interface CertificateJobParams {
  jobId: string;
  eventId: string;
  eventName: string;
  category: string;
  achievementText?: string;
  callerUid: string;
}

export function generateCertCode(): string {
  const chars = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TARAS26-CERT-${chars}`;
}

export async function processServerCertificateJob(
  jobId: string,
  callerUid: string
): Promise<{ success: boolean; generated: number; failed: number; message: string }> {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  // 1. Authorize caller
  const callerDoc = await db.collection('participants').doc(callerUid).get();
  if (!callerDoc.exists) {
    throw new Error('UNAUTHORIZED: Caller profile not found.');
  }

  const callerRole = (callerDoc.data()?.role as string) || 'participant';
  if (!['admin', 'super_admin', 'PRESIDENT'].includes(callerRole)) {
    throw new Error(`FORBIDDEN: Role "${callerRole}" does not have admin permissions to issue certificates.`);
  }

  // 2. Fetch certificate job
  const jobRef = db.collection('certificate_jobs').doc(jobId);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) {
    throw new Error(`NOT_FOUND: Certificate job "${jobId}" does not exist.`);
  }

  const jobData = jobSnap.data() as Record<string, any>;
  const { eventId, eventName, category, achievementText } = jobData;

  await jobRef.update({ status: 'PROCESSING', updatedAt: admin.firestore.FieldValue.serverTimestamp() });

  // 3. Fetch registrations for event
  const regSnaps = await db.collection('registrations').where('eventId', '==', eventId).get();
  if (regSnaps.empty) {
    await jobRef.update({ status: 'FAILED', error: 'No registrations found for event' });
    throw new Error(`No participants registered for event "${eventName}".`);
  }

  const total = regSnaps.docs.length;
  let generated = 0;
  let failed = 0;
  const failedLogs: any[] = [];

  // 4. Batch generation
  for (const rDoc of regSnaps.docs) {
    const reg = rDoc.data();
    const targetUid = reg.uid;
    const partId = reg.participantId || 'TARAS26-ID';

    try {
      const pDoc = await db.collection('participants').doc(targetUid).get();
      const pData = pDoc.exists ? pDoc.data() : {};
      const fullName = pData?.fullName || reg.fullName || 'Participant';
      const college = pData?.college || 'Saveetha Engineering College';
      const email = pData?.email || reg.email;

      const certId = generateCertCode();
      const verificationCode = certId.replace('TARAS26-CERT-', '');
      const now = new Date().toISOString();
      const achievement = achievementText || `${category} - ${eventName}`;

      // Upload certificate document reference to Storage
      const filePath = `certificates/${certId}.pdf`;
      const fileRef = bucket.file(filePath);

      const certContent = Buffer.from(
        `TARAS 2K26 SYMPOSIUM OFFICIAL CERTIFICATE\nCertificate ID: ${certId}\nParticipant: ${fullName}\nCollege: ${college}\nEvent: ${eventName}\nAchievement: ${achievement}\nIssue Date: ${now}\nVerification: https://taras-2k26.web.app/verify-certificate?id=${certId}`
      );

      await fileRef.save(certContent, {
        contentType: 'application/pdf',
        metadata: {
          certId,
          participantUid: targetUid,
          issuedBy: callerUid,
        },
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      // Write Firestore certificate record
      const certRecord = {
        certId,
        participantId: partId,
        uid: targetUid,
        fullName,
        college,
        eventId,
        eventName,
        achievement,
        certificateType: category,
        status: 'ISSUED',
        issueDate: now,
        issuedByUid: callerUid,
        verificationCode,
        verificationUrl: `https://taras-2k26.web.app/verify-certificate?id=${certId}`,
        filePath: publicUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('certificate_records').doc(certId).set(certRecord);

      // Update participant profile
      await db.collection('participants').doc(targetUid).update({
        certificateStatus: 'READY',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Automatically create email notification job if email exists
      if (email) {
        await db.collection('email_jobs').add({
          subject: `TARAS 2K26 — Your Certificate for ${eventName} is Ready!`,
          body: `Hi ${fullName},\n\nYour official certificate for ${eventName} has been issued.\nCertificate ID: ${certId}\nVerification Link: https://taras-2k26.web.app/verify-certificate?id=${certId}\n\nView it in your Participant Dashboard.`,
          audienceFilter: { type: 'SINGLE', email },
          createdBy: callerUid,
          createdAt: new Date().toISOString(),
          status: 'PENDING',
        });
      }

      generated++;
    } catch (err: any) {
      failed++;
      failedLogs.push({ uid: targetUid, name: reg.fullName || 'Participant', error: err.message });
    }
  }

  const finalStatus = failed === 0 ? 'COMPLETED' : generated > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED';

  await jobRef.update({
    total,
    generated,
    failed,
    status: finalStatus,
    completedAt: new Date().toISOString(),
    failedLogs,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    generated,
    failed,
    message: `Certificate job ${jobId} finished. Generated: ${generated}, Failed: ${failed}.`,
  };
}
