/**
 * TARAS 2K26 — Payment Proof Storage Service
 *
 * Orchestrates:
 * 1. Unique Payment Proof ID generation (PAY-TARAS-YYYYMMDD-HHMMSS-XXXX)
 * 2. Authoritative IST timestamp generation
 * 3. Firebase Auth ID-token retrieval
 * 4. Upload to Google Drive via Apps Script Web App
 * 5. Atomic persistence of Drive metadata + payment status in Firestore
 * 6. Reusable retry via the same paymentProofId (idempotency)
 *
 * NO Supabase Storage.
 * NO Firestore Base64 image fallback.
 * NO Firebase Storage.
 *
 * If Drive upload fails: surface the error, offer retry. Do NOT fake success.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
import {
  uploadPaymentProofToDrive,
  type DriveUploadResult,
} from './googleDriveArchiveService';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface DrivePaymentProofMetadata {
  paymentProofId: string;
  /** Always 'googledrive' for new uploads */
  provider: 'googledrive' | 'firestore';
  /** Drive folder path (e.g. "Payment Proofs/Paper-X-Verse External/...") */
  drivePath: string;
  /** Drive file ID */
  driveFileId: string;
  /** Drive web view URL */
  driveFileUrl: string;
  /** Sanitized filename in Drive */
  driveFileName: string;
  /** Drive folder ID */
  driveFolderId: string;
  /** Upload status */
  driveUploadStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  fileSize: number;
  contentType: string;
  /** ISO 8601 with IST offset */
  uploadedAt: string;
  /** Formatted: "10 October 2026, 02:35:22 PM IST" */
  uploadedAtIST: string;
  /** Drive URL used by Registration Dashboard to link to proof */
  signedUrl?: string;
}

export interface DriveUploadProgressCallback {
  (percentage: number): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMESTAMP & ID UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a single authoritative IST timestamp.
 */
export function generateAuthoritativeTimestamp(dateObj = new Date()): {
  isoIST: string;
  formattedIST: string;
  year: string;
  monthName: string;
  dateStr: string;
  timeCompact: string;
} {
  const utcTime = dateObj.getTime();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utcTime + istOffsetMs);

  const year = String(istDate.getUTCFullYear());
  const monthNum = istDate.getUTCMonth();
  const monthStr = String(monthNum + 1).padStart(2, '0');
  const dateStr = String(istDate.getUTCDate()).padStart(2, '0');

  const hours = istDate.getUTCHours();
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = monthNames[monthNum];

  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  const hours12Str = String(hours12).padStart(2, '0');

  const isoIST = `${year}-${monthStr}-${dateStr}T${String(hours).padStart(2, '0')}:${minutes}:${seconds}+05:30`;
  const formattedIST = `${dateStr} ${monthName} ${year}, ${hours12Str}:${minutes}:${seconds} ${period} IST`;
  const timeCompact = `${year}${monthStr}${dateStr}-${String(hours).padStart(2, '0')}${minutes}${seconds}`;

  return { isoIST, formattedIST, year, monthName, dateStr, timeCompact };
}

/**
 * Generate a unique Payment Proof ID: PAY-TARAS-YYYYMMDD-HHMMSS-XXXX
 */
export function generatePaymentProofId(timestampCompact?: string): string {
  const nonceBytes = new Uint8Array(2);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(nonceBytes);
  } else {
    nonceBytes[0] = Math.floor(Math.random() * 256);
    nonceBytes[1] = Math.floor(Math.random() * 256);
  }
  const nonce = Array.from(nonceBytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  const timePart = timestampCompact || generateAuthoritativeTimestamp().timeCompact;
  return `PAY-TARAS-${timePart}-${nonce}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a payment proof image to Google Drive and return Drive metadata.
 *
 * Steps:
 *   1. Auth check
 *   2. Ownership check (Firestore)
 *   3. Derive paymentProofId + IST timestamp
 *   4. Get short-lived Firebase ID token
 *   5. Upload to Google Drive via Apps Script
 *   6. Return Drive metadata (does NOT write to Firestore — caller does that)
 *
 * If Drive upload fails, throws an Error so the UI can show retry.
 * Does NOT fall back to Firestore base64 storage.
 */
export async function uploadPaymentProofToGoogleDrive(
  registrationId: string,
  file: File | Blob,
  eventName?: string,
  onProgress?: DriveUploadProgressCallback
): Promise<DrivePaymentProofMetadata> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required: You must be logged in to upload payment proofs.');
  }

  if (!registrationId) {
    throw new Error('Registration ID is required for payment proof upload.');
  }

  if (!file || file.size === 0) {
    throw new Error('No valid payment screenshot file provided.');
  }

  // 1. Authoritative ownership check in Firestore
  const regDocRef = doc(firestore, 'registrations', registrationId);
  const regSnap = await getDoc(regDocRef);
  if (!regSnap.exists()) {
    throw new Error('Registration record not found. Cannot associate payment proof.');
  }
  const regData = regSnap.data();
  if (regData.uid !== currentUser.uid) {
    throw new Error(
      'Unauthorized: You do not have permission to upload payment proof for this registration.'
    );
  }
  if (regData.status === 'CONFIRMED' || regData.paymentStatus === 'VERIFIED') {
    throw new Error('Payment for this registration has already been verified.');
  }

  if (onProgress) onProgress(10);

  // 2. Derive single authoritative timestamp + Payment Proof ID
  const timeInfo = generateAuthoritativeTimestamp();
  const paymentProofId = generatePaymentProofId(timeInfo.timeCompact);
  const uploadedAt = timeInfo.isoIST;
  const uploadedAtIST = timeInfo.formattedIST;

  const rawExt =
    file instanceof File ? file.name.split('.').pop() || 'webp' : 'webp';
  const cleanExt = rawExt.toLowerCase().includes('png')
    ? 'png'
    : rawExt.toLowerCase().includes('jpg') || rawExt.toLowerCase().includes('jpeg')
    ? 'jpeg'
    : 'webp';
  const contentType =
    file.type ||
    (cleanExt === 'png' ? 'image/png' : cleanExt === 'jpeg' ? 'image/jpeg' : 'image/webp');

  if (onProgress) onProgress(20);

  // 3. Get short-lived Firebase ID token for server-side validation
  let firebaseIdToken: string;
  try {
    firebaseIdToken = await currentUser.getIdToken();
  } catch (tokenErr: any) {
    throw new Error(
      'Failed to obtain authentication token. Please sign in again and retry.'
    );
  }

  if (onProgress) onProgress(30);

  // 4. Encode file to base64 for transport
  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1] || dataUrl);
    };
    reader.onerror = () =>
      reject(new Error('Failed to encode payment proof image for upload.'));
    reader.readAsDataURL(file);
  });

  if (onProgress) onProgress(40);

  // 5. Upload to Google Drive via Apps Script Web App
  const driveResult: DriveUploadResult = await uploadPaymentProofToDrive(
    {
      requestId: paymentProofId,
      firebaseIdToken,
      registrationId,
      teamId: regData.teamId || '',
      eventName: eventName || regData.eventName || '',
      transactionId: '', // provided later by the payment form
      bankName: '',      // provided later by the payment form
      transactionDate: '', // provided later by the payment form
      originalFileName:
        file instanceof File ? file.name : `payment_proof.${cleanExt}`,
      mimeType: contentType,
      fileSize: file.size,
      fileData,
      uploadedAt,
      uploadedAtIST,
    }
  );

  if (onProgress) onProgress(90);

  if (!driveResult.success) {
    throw new Error(
      driveResult.error ||
        'Google Drive upload failed. Please check your internet connection and retry.'
    );
  }

  if (onProgress) onProgress(100);

  return {
    paymentProofId,
    provider: 'googledrive',
    drivePath: driveResult.drivePath || '',
    driveFileId: driveResult.driveFileId || '',
    driveFileUrl: driveResult.driveFileUrl || '',
    driveFileName: driveResult.driveFileName || '',
    driveFolderId: driveResult.driveFolderId || '',
    driveUploadStatus: 'SUCCESS',
    fileSize: file.size,
    contentType,
    uploadedAt,
    uploadedAtIST,
    signedUrl: driveResult.driveFileUrl || '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT PROOF URL RESOLUTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a payment proof view URL for Registration Dashboard display.
 *
 * New Drive records: returns driveFileUrl directly from Firestore.
 * Legacy records (Firestore base64 fallback): reads dataUrl from payment_proofs/<regId>.
 * Returns null if no proof is available.
 */
export async function getPaymentProofViewUrl(
  registration: Record<string, any>
): Promise<string | null> {
  // 1. New Drive-backed records: use stored driveFileUrl
  const driveUrl =
    registration?.paymentProof?.driveFileUrl ||
    registration?.driveFileUrl ||
    registration?.paymentScreenshotUrl ||
    '';

  if (driveUrl && driveUrl.startsWith('https://')) {
    return driveUrl;
  }

  // 2. Legacy Firestore base64 fallback (read-only; not written for new uploads)
  const regId = registration?.registrationId;
  if (regId) {
    try {
      const proofDoc = await getDoc(doc(firestore, 'payment_proofs', regId));
      if (proofDoc.exists() && proofDoc.data()?.dataUrl) {
        return proofDoc.data().dataUrl as string;
      }
    } catch (err) {
      console.warn('Could not read legacy payment_proofs doc:', err);
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────

export interface SavePaymentSubmissionParams {
  registrationId: string;
  utrNumber: string;
  bankName?: string;
  transactionDate?: string;
  proofMetadata: DrivePaymentProofMetadata;
}

/**
 * Atomically persist payment submission and Drive metadata in Firestore.
 *
 * UTR duplicate check is enforced via a Firestore transaction.
 * Does NOT change paymentStatus to VERIFIED — that remains the Registration Team's job.
 */
export async function savePaymentProofSubmissionToFirestore({
  registrationId,
  utrNumber,
  bankName = '',
  transactionDate = '',
  proofMetadata,
}: SavePaymentSubmissionParams): Promise<void> {
  const trimmedUtr = utrNumber.trim();
  if (!trimmedUtr) throw new Error('UTR / Transaction ID is required.');
  const trimmedBankName = bankName.trim();
  if (!trimmedBankName) throw new Error('Bank Name is required.');
  const trimmedTransactionDate = transactionDate.trim();
  if (!trimmedTransactionDate) throw new Error('Transaction Date is required.');

  if (!proofMetadata?.driveFileId && !proofMetadata?.drivePath) {
    throw new Error('Drive upload metadata is missing. Please retry the upload.');
  }

  const normalizedUtr = trimmedUtr.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normalizedUtr) {
    throw new Error('Invalid UTR format. Please provide a valid transaction reference.');
  }

  const utrRef = doc(firestore, 'utr_registry', normalizedUtr);
  const regRef = doc(firestore, 'registrations', registrationId);
  const currentUserUid = auth.currentUser?.uid;

  await runTransaction(firestore, async (transaction) => {
    // ── READS ──
    const utrSnap = await transaction.get(utrRef);
    if (utrSnap.exists()) {
      const existingData = utrSnap.data();
      if (existingData.registrationId !== registrationId) {
        throw new Error(
          `This UTR / Transaction ID (${trimmedUtr}) has already been submitted for another registration. Duplicates are not allowed.`
        );
      }
    }

    const regSnap = await transaction.get(regRef);
    if (!regSnap.exists()) {
      throw new Error('Registration record not found. Please refresh and try again.');
    }
    const regData = regSnap.data();
    const effectiveUid = currentUserUid || regData.uid;

    // ── WRITES ──
    transaction.set(
      utrRef,
      {
        utrNumber: trimmedUtr,
        bankName: trimmedBankName,
        transactionDate: trimmedTransactionDate,
        normalizedUtr,
        registrationId,
        paymentProofId: proofMetadata.paymentProofId,
        uid: effectiveUid,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.update(regRef, {
      paymentProofId: proofMetadata.paymentProofId,
      utrNumber: trimmedUtr,
      bankName: trimmedBankName,
      transactionDate: trimmedTransactionDate,
      paymentProof: {
        paymentProofId: proofMetadata.paymentProofId,
        provider: proofMetadata.provider, // 'googledrive'
        driveFileId: proofMetadata.driveFileId,
        driveFileUrl: proofMetadata.driveFileUrl,
        driveFileName: proofMetadata.driveFileName,
        driveFolderId: proofMetadata.driveFolderId,
        drivePath: proofMetadata.drivePath,
        driveUploadStatus: proofMetadata.driveUploadStatus,
        bankName: trimmedBankName,
        transactionDate: trimmedTransactionDate,
        fileSize: proofMetadata.fileSize,
        contentType: proofMetadata.contentType,
        uploadedAt: proofMetadata.uploadedAt,
        uploadedAtIST: proofMetadata.uploadedAtIST,
      },
      // Top-level convenience fields for dashboards
      paymentScreenshotUrl: proofMetadata.driveFileUrl,
      paymentScreenshotPath: proofMetadata.drivePath,
      paymentScreenshotSize: proofMetadata.fileSize,
      paymentScreenshotContentType: proofMetadata.contentType,
      googleDriveFileId: proofMetadata.driveFileId,
      googleDriveFolderId: proofMetadata.driveFolderId,
      googleDrivePath: proofMetadata.drivePath,
      googleDriveUploadStatus: proofMetadata.driveUploadStatus,
      uploadedAt: proofMetadata.uploadedAt,
      uploadedAtIST: proofMetadata.uploadedAtIST,
      paymentSubmittedAt: proofMetadata.uploadedAt,
      paymentStatus: 'PENDING',
      status: 'PAYMENT_VERIFICATION_PENDING',
      possibleDuplicate: false,
      updatedAt: serverTimestamp(),
    });
  });

  // Audit log
  try {
    const auditRef = doc(collection(firestore, 'audit_logs'));
    await setDoc(auditRef, {
      action: 'PAYMENT_SUBMITTED',
      paymentProofId: proofMetadata.paymentProofId,
      registrationId,
      utrNumber: trimmedUtr,
      bankName: trimmedBankName,
      transactionDate: trimmedTransactionDate,
      provider: proofMetadata.provider,
      driveFileId: proofMetadata.driveFileId,
      drivePath: proofMetadata.drivePath,
      driveUploadStatus: proofMetadata.driveUploadStatus,
      fileSize: proofMetadata.fileSize,
      possibleDuplicate: false,
      timestamp: serverTimestamp(),
    });
  } catch (auditErr) {
    console.warn('Audit log write error (non-fatal):', auditErr);
  }
}

/**
 * Resubmit payment proof following administrative rejection.
 * Reuses the same Firestore transaction logic.
 */
export async function resubmitPaymentProofToFirestore({
  registrationId,
  utrNumber,
  bankName,
  transactionDate,
  proofMetadata,
}: SavePaymentSubmissionParams): Promise<void> {
  await savePaymentProofSubmissionToFirestore({
    registrationId,
    utrNumber,
    bankName,
    transactionDate,
    proofMetadata,
  });
}
