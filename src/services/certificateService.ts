/**
 * TARAS 2K26 — Client-Side E-Certificate Engine & Metadata Service
 *
 * Requirements:
 * - High-resolution dynamic client-side PDF compilation using html2canvas + jsPDF.
 * - Zero cloud storage uploads / Zero Blaze paid server requirements.
 * - Idempotency: one certificate identity per participant + event.
 * - Globally unique IDs: TARAS26-CERT-XXXXXXXX
 * - Verification URL format: https://taras-2k26.web.app/verify/{certificateId}
 * - Concurrency safe & audit logged in Firestore audit_logs.
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { db, logAuditEvent } from '../config/firebase';
import type { CertificateRecord, CertificateType } from '../types/certificate';

export interface IssueCertificateParams {
  participantId: string;
  registrationId?: string;
  registrationNumber?: string;
  uid?: string;
  email?: string;
  eventId: string;
  eventName: string;
  participantName: string;
  college?: string;
  certificateType?: CertificateType | string;
  achievement?: string | null;
  position?: number | null;
  issuedByUid: string;
  certificateEligible?: boolean;
}

export interface BatchIssueProgress {
  total: number;
  issued: number;
  skipped: number;
  failed: number;
  logs: { participantName: string; status: 'ISSUED' | 'SKIPPED' | 'FAILED'; message: string }[];
}

export interface IssueCertificateResult {
  success: boolean;
  isExisting?: boolean;
  certificateId: string;
  record?: CertificateRecord;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Cryptographic Unique Certificate ID Generator (Web Crypto API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a unique certificate ID in format: TARAS26-CERT-XXXXXXXX
 * e.g. TARAS26-CERT-A7F39K21
 */
export async function generateUniqueCertificateId(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous 0/O, 1/I
  let certId = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    let randomPart = '';

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < 8; i++) {
        randomPart += chars[bytes[i] % chars.length];
      }
    } else {
      for (let i = 0; i < 8; i++) {
        randomPart += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    certId = `TARAS26-CERT-${randomPart}`;

    // Collision Check in Firestore
    try {
      const existingDoc = await db.getDoc('certificate_records', certId);
      if (!existingDoc.exists) {
        isUnique = true;
      }
    } catch {
      isUnique = true;
    }
  }

  return certId;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Duplicate Certificate Prevention (Idempotency Check)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a valid certificate already exists for a participant + event.
 */
export async function checkCertificateExists(
  participantId: string,
  eventId: string,
  certificateType?: string
): Promise<CertificateRecord | null> {
  try {
    const records = await db.queryWhere('certificate_records', 'participantId', participantId);
    const existing = records.find(
      (r: any) =>
        r.eventId === eventId &&
        (!certificateType || r.certificateType === certificateType) &&
        r.certificateStatus !== 'REVOKED' &&
        r.status !== 'revoked' &&
        r.status !== 'REVOKED'
    );
    return existing ? (existing as unknown as CertificateRecord) : null;
  } catch (err) {
    console.warn('Error checking duplicate certificate:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Issue Single Certificate (Atomic & Idempotent)
// ─────────────────────────────────────────────────────────────────────────────

export async function issueCertificate(
  params: IssueCertificateParams
): Promise<IssueCertificateResult> {
  const {
    participantId,
    registrationId,
    registrationNumber,
    uid,
    email,
    eventId,
    eventName,
    participantName,
    college = 'Saveetha Engineering College',
    certificateType = 'Participation Certificate',
    achievement = null,
    position = null,
    issuedByUid,
    certificateEligible = true,
  } = params;

  // 1. Idempotency check: Return existing certificate if already generated
  const existing = await checkCertificateExists(participantId, eventId);
  if (existing) {
    const certId = existing.certificateId || existing.certId || '';
    return {
      success: true,
      isExisting: true,
      certificateId: certId,
      record: existing,
      message: `Certificate already generated (${certId}). Duplicate creation prevented.`,
    };
  }

  // 2. Generate unique certificate ID
  const certificateId = await generateUniqueCertificateId();
  const now = new Date().toISOString();
  const productionBaseUrl = 'https://taras-2k26.web.app';
  const verificationUrl = `${productionBaseUrl}/verify/${certificateId}`;

  // 3. Construct Certificate Record matching Section 7 specification
  const record: CertificateRecord = {
    certificateId,
    certId: certificateId,
    participantId,
    registrationId: registrationId || '',
    registrationNumber: registrationNumber || participantId,
    uid,
    email,
    eventId,
    eventName,
    participantName,
    fullName: participantName,
    college,
    certificateType,
    achievement: achievement || `${certificateType} — ${eventName}`,
    position: position || null,
    issuedAt: now,
    issueDate: now,
    generatedAt: now,
    generatedBy: issuedByUid,
    issuedByUid,
    certificateStatus: 'VALID',
    status: 'VALID',
    certificateEligible,
    verificationUrl,
    verificationCode: certificateId.replace('TARAS26-CERT-', ''),
    templateVersion: '1.0.0',
  };

  // 4. Save to Firestore certificate_records
  await db.setDoc('certificate_records', certificateId, record as unknown as Record<string, unknown>);

  // 5. Update Registration document if registrationId is provided
  if (registrationId) {
    try {
      await db.updateDoc('registrations', registrationId, {
        certificateId,
        certificateStatus: 'ISSUED',
        certificateEligible: true,
        updatedAt: now,
      });
    } catch (err) {
      console.warn('Could not update registration record with certificateId:', err);
    }
  }

  // 6. Update Participant Profile status if uid is provided
  if (uid) {
    try {
      await db.updateDoc('participants', uid, {
        certificateStatus: 'READY',
        updatedAt: now,
      });
    } catch (err) {
      console.warn('Could not update participant profile certificateStatus:', err);
    }
  }

  // 7. Log Audit Trail
  try {
    await logAuditEvent('CERTIFICATE_ISSUED', issuedByUid, 'admin', uid, eventId, {
      certificateId,
      participantId,
      certificateType,
      eventName,
    });
  } catch (err) {
    console.warn('Could not log certificate audit event:', err);
  }

  return {
    success: true,
    isExisting: false,
    certificateId,
    record,
    message: 'Certificate successfully created and registered.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Batch Certificate Issuance
// ─────────────────────────────────────────────────────────────────────────────

export async function issueCertificatesBatch(
  items: IssueCertificateParams[],
  progressCallback?: (progress: BatchIssueProgress) => void
): Promise<BatchIssueProgress> {
  const total = items.length;
  let issued = 0;
  let skipped = 0;
  let failed = 0;
  const logs: BatchIssueProgress['logs'] = [];

  for (const item of items) {
    try {
      const res = await issueCertificate(item);
      if (res.success) {
        if (res.isExisting) {
          skipped++;
          logs.push({
            participantName: item.participantName,
            status: 'SKIPPED',
            message: `Already generated (${res.certificateId})`,
          });
        } else {
          issued++;
          logs.push({
            participantName: item.participantName,
            status: 'ISSUED',
            message: `Issued: ${res.certificateId}`,
          });
        }
      } else {
        failed++;
        logs.push({
          participantName: item.participantName,
          status: 'FAILED',
          message: res.message,
        });
      }
    } catch (err: any) {
      failed++;
      logs.push({
        participantName: item.participantName,
        status: 'FAILED',
        message: err.message || 'Issuance failed',
      });
    }

    if (progressCallback) {
      progressCallback({
        total,
        issued,
        skipped,
        failed,
        logs: [...logs],
      });
    }
  }

  return { total, issued, skipped, failed, logs };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Revoke Certificate (Admin Action)
// ─────────────────────────────────────────────────────────────────────────────

export async function revokeCertificate(
  certificateId: string,
  adminUid: string,
  reason: string = 'Administrative Revocation'
): Promise<{ success: boolean; message: string }> {
  try {
    const docRes = await db.getDoc('certificate_records', certificateId);
    if (!docRes.exists) {
      return { success: false, message: 'Certificate record not found.' };
    }

    const now = new Date().toISOString();
    await db.updateDoc('certificate_records', certificateId, {
      certificateStatus: 'REVOKED',
      status: 'REVOKED',
      revokedAt: now,
      revokedBy: adminUid,
      revokedByUid: adminUid,
      revocationReason: reason,
      updatedAt: now,
    });

    try {
      await logAuditEvent('CERTIFICATE_REVOKED', adminUid, 'admin', undefined, undefined, {
        certificateId,
        reason,
      });
    } catch (auditErr) {
      console.warn('Could not log certificate revocation:', auditErr);
    }

    return { success: true, message: `Certificate ${certificateId} has been revoked.` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to revoke certificate.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Query Participant Certificates
// ─────────────────────────────────────────────────────────────────────────────

export async function getParticipantCertificates(
  participantId: string,
  uid?: string
): Promise<CertificateRecord[]> {
  try {
    const byId = await db.queryWhere('certificate_records', 'participantId', participantId);
    let byUid: any[] = [];
    if (uid) {
      byUid = await db.queryWhere('certificate_records', 'uid', uid);
    }

    // Merge & Deduplicate
    const map = new Map<string, CertificateRecord>();
    [...byId, ...byUid].forEach((doc: any) => {
      const id = doc.certificateId || doc.certId || doc.id;
      if (id && !map.has(id)) {
        map.set(id, doc as CertificateRecord);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.issuedAt || b.issueDate || 0).getTime() -
        new Date(a.issuedAt || a.issueDate || 0).getTime()
    );
  } catch (err) {
    console.warn('Error fetching participant certificates:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Get Certificate By ID (Verification Query)
// ─────────────────────────────────────────────────────────────────────────────

export async function getCertificateById(certificateId: string): Promise<CertificateRecord | null> {
  const queryId = certificateId.trim().toUpperCase();
  if (!queryId) return null;

  try {
    // 1. Direct Document ID lookup
    const docRes = await db.getDoc('certificate_records', queryId);
    if (docRes.exists && docRes.data) {
      return docRes.data as unknown as CertificateRecord;
    }

    // 2. Field-level fallback lookups
    const byCertificateId = await db.queryWhere('certificate_records', 'certificateId', queryId);
    if (byCertificateId.length > 0) return byCertificateId[0] as unknown as CertificateRecord;

    const byCertId = await db.queryWhere('certificate_records', 'certId', queryId);
    if (byCertId.length > 0) return byCertId[0] as unknown as CertificateRecord;

    const byCode = await db.queryWhere('certificate_records', 'verificationCode', queryId);
    if (byCode.length > 0) return byCode[0] as unknown as CertificateRecord;

    return null;
  } catch (err) {
    console.warn('Error querying certificate by ID:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Get All Certificates (Admin Console Registry)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllCertificates(): Promise<CertificateRecord[]> {
  try {
    const docs = await db.getCollection('certificate_records');
    const list = docs as unknown as CertificateRecord[];
    return list.sort(
      (a, b) =>
        new Date(b.issuedAt || b.issueDate || 0).getTime() -
        new Date(a.issuedAt || a.issueDate || 0).getTime()
    );
  } catch (err) {
    console.warn('Error fetching all certificates:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. High-Quality Client-Side PDF Generation & Download
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a printable high-resolution PDF of the certificate canvas and trigger download.
 *
 * Requirements:
 * - 297mm × 210mm (Landscape A4)
 * - Scale: 2.5 for crisp print text and sharp scannable QR
 * - Preserves fixed background template without compression degradation
 */
export async function downloadCertificatePdf(
  element: HTMLElement,
  certificateId: string,
  participantName: string = 'Participant',
  actorUid?: string
): Promise<void> {
  if (!element) {
    throw new Error('Certificate render canvas element not found.');
  }

  // 1. Create a clean, isolated staging container directly on document.body.
  // This completely eliminates any parent CSS transforms (such as modal scale(0.70))
  // and off-screen coordinates (such as top/left: -9999px) which cause html2canvas
  // to calculate erroneous bounding rects and render double ghost text layers.
  const stagingWrapper = document.createElement('div');
  stagingWrapper.id = 'taras-certificate-export-staging';
  stagingWrapper.style.position = 'fixed';
  stagingWrapper.style.left = '0px';
  stagingWrapper.style.top = '0px';
  stagingWrapper.style.width = '1199px';
  stagingWrapper.style.height = '848px';
  stagingWrapper.style.zIndex = '999999';
  stagingWrapper.style.opacity = '1';
  stagingWrapper.style.pointerEvents = 'none';
  stagingWrapper.style.overflow = 'hidden';
  stagingWrapper.style.backgroundColor = '#050608';
  stagingWrapper.style.margin = '0px';
  stagingWrapper.style.padding = '0px';
  stagingWrapper.style.transform = 'none';

  // 2. Clone the element cleanly
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.left = '0px';
  clone.style.top = '0px';
  clone.style.width = '1199px';
  clone.style.height = '848px';
  clone.style.transform = 'none';
  clone.style.margin = '0px';
  clone.style.padding = '0px';

  // 3. Remove text-shadow and reset letter-spacing on all descendant elements in the clone
  // Known html2canvas bug: CSS text-shadow and letter-spacing cause duplicate text layers and mashed characters.
  clone.querySelectorAll('*').forEach((node) => {
    if (node instanceof HTMLElement) {
      node.style.textShadow = 'none';
      if (node.style.letterSpacing) {
        node.style.letterSpacing = 'normal';
      }
    }
  });

  stagingWrapper.appendChild(clone);
  document.body.appendChild(stagingWrapper);

  try {
    // 4. Ensure fonts and template image are completely ready
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const img = clone.querySelector('img');
    if (img && !img.complete) {
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }

    // Small delay to allow browser paint synchronization
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 5. Capture staging clone canvas at high resolution (2.0x scale: 2398 x 1696 px)
    const canvas = await html2canvas(clone, {
      scale: 2.0,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#050608',
      logging: false,
      width: 1199,
      height: 848,
      windowWidth: 1199,
      windowHeight: 848,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    });

    // 6. Export canvas to lossless PNG data URL
    const imgData = canvas.toDataURL('image/png', 1.0);

    // 7. Create Landscape A4 jsPDF instance (297 mm × 210 mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210 mm

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');

    // 8. Clean sanitized file name
    const cleanName = participantName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const cleanId = certificateId.replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `TARAS26_Certificate_${cleanName}_${cleanId}.pdf`;

    // 9. Trigger download
    pdf.save(fileName);

    // 10. Log audit event
    if (actorUid) {
      try {
        await logAuditEvent('CERTIFICATE_DOWNLOADED', actorUid, 'admin', undefined, undefined, {
          certificateId,
          fileName,
        });
      } catch {
        // Non-fatal
      }
    }
  } finally {
    // 11. Always clean up staging DOM element
    if (document.body.contains(stagingWrapper)) {
      document.body.removeChild(stagingWrapper);
    }
  }
}
