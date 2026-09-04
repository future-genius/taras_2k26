/**
 * TARAS 2K26 — Client-Side E-Certificate Engine & Metadata Service
 *
 * Architecture:
 * - PDF generation is performed strictly client-side via html2canvas + jsPDF on demand.
 * - Zero cloud storage uploads / Zero PDF backend servers.
 * - Firestore `certificate_records` stores official certificate metadata.
 * - Unique Cryptographic Certificate IDs generated using browser Web Crypto API.
 * - Duplicate certificate prevention via participantId + eventId + certificateType uniqueness checks.
 */

import { db, logAuditEvent } from '../config/firebase';
import type { CertificateRecord, CertificateType } from '../types/certificate';

export interface IssueCertificateParams {
  participantId: string;
  uid?: string;
  eventId: string;
  eventName: string;
  participantName: string;
  college?: string;
  certificateType: CertificateType | string;
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

// ─────────────────────────────────────────────────────────────────────────────
// 1. Cryptographic Unique Certificate ID Generator (Web Crypto API)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateUniqueCertificateId(): Promise<string> {
  let certId = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    let hexCode = '';

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(5);
      crypto.getRandomValues(bytes);
      hexCode = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    } else {
      hexCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    certId = `TARAS26-CERT-${hexCode}`;

    // Collision Check in Firestore
    try {
      const existingDoc = await db.getDoc('certificate_records', certId);
      if (!existingDoc.exists) {
        isUnique = true;
      }
    } catch {
      // If network error during collision check, accept the crypto random ID
      isUnique = true;
    }
  }

  return certId;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Duplicate Certificate Prevention Check
// ─────────────────────────────────────────────────────────────────────────────

export async function checkCertificateExists(
  participantId: string,
  eventId: string,
  certificateType: string
): Promise<CertificateRecord | null> {
  try {
    const records = await db.queryWhere('certificate_records', 'participantId', participantId);
    const existing = records.find(
      (r: any) => r.eventId === eventId && r.certificateType === certificateType && r.status !== 'revoked'
    );
    return existing ? (existing as unknown as CertificateRecord) : null;
  } catch (err) {
    console.warn('Error checking duplicate certificate:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Issue Single Certificate (Client-Side Metadata Record Only)
// ─────────────────────────────────────────────────────────────────────────────

export async function issueCertificate(
  params: IssueCertificateParams
): Promise<{ success: boolean; certificateId: string; record?: CertificateRecord; message: string }> {
  const {
    participantId,
    uid,
    eventId,
    eventName,
    participantName,
    college = 'Saveetha Engineering College',
    certificateType,
    achievement = null,
    position = null,
    issuedByUid,
    certificateEligible = true,
  } = params;

  // 1. Prevent Duplicate Certificate Creation
  const duplicate = await checkCertificateExists(participantId, eventId, String(certificateType));
  if (duplicate) {
    const certId = duplicate.certificateId || duplicate.certId || '';
    return {
      success: true,
      certificateId: certId,
      record: duplicate,
      message: `Certificate already issued (${certId}). Duplicate creation prevented.`,
    };
  }

  // 2. Generate Cryptographically Unique ID
  const certificateId = await generateUniqueCertificateId();
  const now = new Date().toISOString();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://taras-2k26.web.app';
  const verificationUrl = `${origin}/verify-certificate?id=${certificateId}`;

  // 3. Build Record conforming strictly to Firestore schema
  const record: CertificateRecord = {
    certificateId,
    certId: certificateId,
    participantId,
    uid,
    eventId,
    eventName,
    participantName,
    fullName: participantName,
    college,
    certificateType,
    achievement: achievement || `${certificateType} - ${eventName}`,
    position: position || null,
    issuedAt: now,
    issueDate: now,
    certificateEligible,
    status: 'issued',
    issuedByUid,
    verificationCode: certificateId.replace('TARAS26-CERT-', ''),
    verificationUrl,
  };

  // 4. Save Record in Firestore certificate_records
  await db.setDoc('certificate_records', certificateId, record as unknown as Record<string, unknown>);

  // 5. Update Participant Profile status if uid is known
  if (uid) {
    try {
      await db.updateDoc('participants', uid, {
        certificateStatus: 'READY',
        updatedAt: now,
      });
    } catch (e) {
      console.warn('Could not update participant profile certificateStatus:', e);
    }
  }

  // 6. Log Audit Trail
  await logAuditEvent('CERTIFICATE_ISSUED', issuedByUid, 'admin', uid, eventId, {
    certificateId,
    participantId,
    certificateType,
  });

  return {
    success: true,
    certificateId,
    record,
    message: 'Certificate successfully created and registered.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Batch Certificate Issuance (Admin Mass Action)
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
      const existing = await checkCertificateExists(item.participantId, item.eventId, String(item.certificateType));
      if (existing) {
        skipped++;
        logs.push({
          participantName: item.participantName,
          status: 'SKIPPED',
          message: 'Already issued.',
        });
      } else {
        const res = await issueCertificate(item);
        if (res.success) {
          issued++;
          logs.push({
            participantName: item.participantName,
            status: 'ISSUED',
            message: `Issued ID: ${res.certificateId}`,
          });
        } else {
          failed++;
          logs.push({
            participantName: item.participantName,
            status: 'FAILED',
            message: res.message,
          });
        }
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
  adminUid: string
): Promise<{ success: boolean; message: string }> {
  try {
    const docRes = await db.getDoc('certificate_records', certificateId);
    if (!docRes.exists) {
      return { success: false, message: 'Certificate record not found.' };
    }

    const now = new Date().toISOString();
    await db.updateDoc('certificate_records', certificateId, {
      status: 'revoked',
      revokedAt: now,
      revokedByUid: adminUid,
      updatedAt: now,
    });

    await logAuditEvent('CERTIFICATE_REVOKED', adminUid, 'admin', undefined, undefined, {
      certificateId,
    });

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
      (a, b) => new Date(b.issuedAt || b.issueDate || 0).getTime() - new Date(a.issuedAt || a.issueDate || 0).getTime()
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
  try {
    // 1. Direct Doc ID lookup
    const docRes = await db.getDoc('certificate_records', queryId);
    if (docRes.exists && docRes.data) {
      return docRes.data as unknown as CertificateRecord;
    }

    // 2. certId field lookup
    const byCertId = await db.queryWhere('certificate_records', 'certId', queryId);
    if (byCertId.length > 0) return byCertId[0] as unknown as CertificateRecord;

    const byCertificateId = await db.queryWhere('certificate_records', 'certificateId', queryId);
    if (byCertificateId.length > 0) return byCertificateId[0] as unknown as CertificateRecord;

    // 3. verificationCode lookup
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
      (a, b) => new Date(b.issuedAt || b.issueDate || 0).getTime() - new Date(a.issuedAt || a.issueDate || 0).getTime()
    );
  } catch (err) {
    console.warn('Error fetching all certificates:', err);
    return [];
  }
}
