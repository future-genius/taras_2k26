/**
 * TARAS 2K26 — Dual-Storage Payment Proof & Metadata Service
 *
 * Dedicated service for:
 * 1. Single Payment Proof ID Generation: PAY-TARAS-YYYYMMDD-HHMMSS-XXXX
 * 2. Single Authoritative Server/IST Timestamp generation (2026-10-10T14:35:22+05:30)
 * 3. Controlled Supabase Storage Upload: payment-proofs/2026/10/10/PAY-TARAS-20261010-143522-X7K9.png
 * 4. Automatic Google Drive Archival: TARAS 2K26/Payment Proofs/2026/October/10/TEAM-014_TechTitans/PAY-TARAS-*.png
 * 5. Atomic persistence of dual-storage references & metadata in Cloud Firestore
 * 6. Secure temporary signed URL retrieval for Registration Staff & Admin review
 * 7. Graceful failure recovery & Google Drive archive retries
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
import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase';
import { archivePaymentProofToGoogleDrive } from './googleDriveArchiveService';

export const SUPABASE_PAYMENT_PROOF_BUCKET = 'payment-proofs';

export interface DualStoragePaymentProofMetadata {
  paymentProofId: string;
  provider: 'supabase' | 'firestore';
  bucket: string;
  path: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;        // Authoritative ISO 8601 string with IST offset
  uploadedAtIST: string;     // Formatted string: "10 October 2026, 02:35:22 PM IST"
  signedUrl?: string;
  supabasePath: string;
  supabaseUploadStatus: 'SUCCESS' | 'FAILED';
  googleDriveFileId?: string;
  googleDriveFolderId?: string;
  googleDrivePath?: string;
  googleDriveUploadStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export interface SupabaseUploadProgressCallback {
  (percentage: number): void;
}

/**
 * Generate a single authoritative timestamp (ISO 8601 with +05:30 IST offset and formatted IST display)
 */
export function generateAuthoritativeTimestamp(dateObj = new Date()): {
  isoIST: string;
  formattedIST: string;
  year: string;
  monthName: string;
  dateStr: string;
  timeCompact: string;
} {
  // IST is UTC + 5 hours 30 minutes
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
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[monthNum];

  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  const hours12Str = String(hours12).padStart(2, '0');

  // ISO 8601 with +05:30 offset
  const isoIST = `${year}-${monthStr}-${dateStr}T${String(hours).padStart(2, '0')}:${minutes}:${seconds}+05:30`;

  // Display: "10 October 2026, 02:35:22 PM IST"
  const formattedIST = `${dateStr} ${monthName} ${year}, ${hours12Str}:${minutes}:${seconds} ${period} IST`;

  // Compact string for ID: "20261010-143522"
  const timeCompact = `${year}${monthStr}${dateStr}-${String(hours).padStart(2, '0')}${minutes}${seconds}`;

  return { isoIST, formattedIST, year, monthName, dateStr, timeCompact };
}

/**
 * Generate ONE unique Payment Proof ID: PAY-TARAS-YYYYMMDD-HHMMSS-XXXX
 */
export function generatePaymentProofId(timestampCompact?: string): string {
  const nonceBytes = new Uint8Array(2);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(nonceBytes);
  } else {
    nonceBytes[0] = Math.floor(Math.random() * 256);
    nonceBytes[1] = Math.floor(Math.random() * 256);
  }
  const nonce = Array.from(nonceBytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  const timePart = timestampCompact || generateAuthoritativeTimestamp().timeCompact;
  return `PAY-TARAS-${timePart}-${nonce}`;
}

/**
 * Generate controlled storage path for Supabase Storage
 * Format: payment-proofs/2026/10/10/PAY-TARAS-20261010-143522-X7K9.png
 */
export function getPaymentProofStoragePath(
  paymentProofId: string,
  year: string,
  monthStr: string,
  dateStr: string,
  fileExtension = 'png'
): string {
  const cleanExt = fileExtension.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${year}/${monthStr}/${dateStr}/${paymentProofId}.${cleanExt || 'png'}`;
}

/**
 * Upload payment screenshot to Supabase Storage and automatically archive to Google Drive.
 * Generates ONE Payment Proof ID and ONE Authoritative Timestamp.
 */
export async function uploadPaymentProofToSupabase(
  registrationId: string,
  file: File | Blob,
  onProgress?: SupabaseUploadProgressCallback
): Promise<DualStoragePaymentProofMetadata> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required: You must be logged in to upload payment proofs.');
  }

  if (!registrationId) {
    throw new Error('Registration ID is required for storage path resolution.');
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
    throw new Error('Unauthorized: You do not have permission to upload payment proof for this registration.');
  }
  if (regData.status === 'CONFIRMED' || regData.paymentStatus === 'VERIFIED') {
    throw new Error('Payment for this registration has already been verified.');
  }

  // 2. Derive single authoritative timestamp and Payment Proof ID
  const timeInfo = generateAuthoritativeTimestamp();
  const paymentProofId = generatePaymentProofId(timeInfo.timeCompact);
  const uploadedAt = timeInfo.isoIST;
  const uploadedAtIST = timeInfo.formattedIST;

  const rawExt = file instanceof File ? file.name.split('.').pop() || 'png' : 'png';
  const cleanExt = rawExt.toLowerCase().includes('png')
    ? 'png'
    : rawExt.toLowerCase().includes('jpg') || rawExt.toLowerCase().includes('jpeg')
      ? 'jpeg'
      : rawExt.toLowerCase().includes('pdf')
        ? 'pdf'
        : 'webp';

  const contentType = file.type || (cleanExt === 'pdf' ? 'application/pdf' : cleanExt === 'png' ? 'image/png' : 'image/jpeg');

  const monthNum = String(new Date().getMonth() + 1).padStart(2, '0');
  const storagePath = getPaymentProofStoragePath(paymentProofId, timeInfo.year, monthNum, timeInfo.dateStr, cleanExt);

  if (onProgress) onProgress(15);

  let simulatedProgress = 20;
  const progressTimer = setInterval(() => {
    if (onProgress && simulatedProgress < 75) {
      simulatedProgress += 10;
      onProgress(simulatedProgress);
    }
  }, 200);

  // 3. Fallback: Save screenshot as base64 in Firestore if Supabase Storage is unconfigured
  const uploadToFirestoreFallback = async (): Promise<DualStoragePaymentProofMetadata> => {
    clearInterval(progressTimer);
    if (onProgress) onProgress(80);

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to encode image data.'));
      reader.readAsDataURL(file);
    });

    const proofDocRef = doc(firestore, 'payment_proofs', registrationId);
    await setDoc(
      proofDocRef,
      {
        registrationId,
        paymentProofId,
        uid: currentUser.uid,
        dataUrl,
        fileSize: file.size,
        contentType,
        uploadedAt,
        uploadedAtIST,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Attempt Google Drive Archive
    if (onProgress) onProgress(90);
    const driveResult = await archivePaymentProofToGoogleDrive({
      paymentProofId,
      file,
      downloadUrl: dataUrl,
      teamId: regData.teamId,
      teamName: regData.teamName,
      uploadedAt,
      uploadedAtIST,
    });

    if (onProgress) onProgress(100);

    return {
      paymentProofId,
      provider: 'firestore',
      bucket: 'firestore',
      path: `payment_proofs/${registrationId}`,
      fileSize: file.size,
      contentType,
      uploadedAt,
      uploadedAtIST,
      signedUrl: dataUrl,
      supabasePath: `payment_proofs/${registrationId}`,
      supabaseUploadStatus: 'SUCCESS',
      googleDriveFileId: driveResult.fileId || '',
      googleDriveFolderId: driveResult.folderId || '',
      googleDrivePath: driveResult.path || '',
      googleDriveUploadStatus: driveResult.success ? 'SUCCESS' : 'FAILED',
    };
  };

  if (!isSupabaseConfigured) {
    return await uploadToFirestoreFallback();
  }

  try {
    // 4. Primary: Upload to Supabase Storage
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
      .from(SUPABASE_PAYMENT_PROOF_BUCKET)
      .upload(storagePath, file, {
        contentType,
        upsert: false,
        cacheControl: '3600',
      });

    clearInterval(progressTimer);

    if (error) {
      console.warn('Supabase Storage returned error, executing fallback:', error.message);
      return await uploadToFirestoreFallback();
    }

    if (onProgress) onProgress(80);

    const finalPath = data?.path || storagePath;

    // Generate signed URL for immediate view
    let signedUrl = '';
    try {
      const { data: signedData } = await supabase.storage
        .from(SUPABASE_PAYMENT_PROOF_BUCKET)
        .createSignedUrl(finalPath, 300);
      if (signedData?.signedUrl) {
        signedUrl = signedData.signedUrl;
      }
    } catch (_) {
      // ignore
    }

    // 5. Secondary: Archive same proof to Google Drive
    if (onProgress) onProgress(90);
    const driveResult = await archivePaymentProofToGoogleDrive({
      paymentProofId,
      file,
      downloadUrl: signedUrl,
      teamId: regData.teamId,
      teamName: regData.teamName,
      uploadedAt,
      uploadedAtIST,
    });

    if (onProgress) onProgress(100);

    return {
      paymentProofId,
      provider: 'supabase',
      bucket: SUPABASE_PAYMENT_PROOF_BUCKET,
      path: finalPath,
      fileSize: file.size,
      contentType,
      uploadedAt,
      uploadedAtIST,
      signedUrl,
      supabasePath: finalPath,
      supabaseUploadStatus: 'SUCCESS',
      googleDriveFileId: driveResult.fileId || '',
      googleDriveFolderId: driveResult.folderId || '',
      googleDrivePath: driveResult.path || '',
      googleDriveUploadStatus: driveResult.success ? 'SUCCESS' : 'FAILED',
    };
  } catch (err: any) {
    clearInterval(progressTimer);
    console.warn('Supabase Storage exception, using fallback:', err.message);
    try {
      return await uploadToFirestoreFallback();
    } catch (fallbackErr: any) {
      throw new Error(
        fallbackErr.message ||
          'Payment proof upload failed due to a network interruption. Please retry.'
      );
    }
  }
}

/**
 * Generate a short-lived temporary signed URL to view a private payment proof.
 */
export async function getPaymentProofSignedViewUrl(
  storagePath: string,
  expiresInSeconds = 300
): Promise<string> {
  if (storagePath && storagePath.startsWith('payment_proofs/')) {
    const parts = storagePath.split('/');
    const regId = parts[1];
    if (regId) {
      try {
        const proofDoc = await getDoc(doc(firestore, 'payment_proofs', regId));
        if (proofDoc.exists() && proofDoc.data()?.dataUrl) {
          return proofDoc.data().dataUrl;
        }
      } catch (err) {
        console.warn('Could not read payment_proofs doc:', err);
      }
    }
  }

  if (!isSupabaseConfigured) {
    if (storagePath && storagePath.includes('/')) {
      const segments = storagePath.split('/');
      const possibleRegId = segments.find((s) => s.startsWith('TARAS26-'));
      if (possibleRegId) {
        const proofDoc = await getDoc(doc(firestore, 'payment_proofs', possibleRegId));
        if (proofDoc.exists() && proofDoc.data()?.dataUrl) {
          return proofDoc.data().dataUrl;
        }
      }
    }
    throw new Error('Supabase Storage is not configured.');
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
      .from(SUPABASE_PAYMENT_PROOF_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      const segments = storagePath.split('/');
      const possibleRegId = segments.find((s) => s.startsWith('TARAS26-'));
      if (possibleRegId) {
        const proofDoc = await getDoc(doc(firestore, 'payment_proofs', possibleRegId));
        if (proofDoc.exists() && proofDoc.data()?.dataUrl) {
          return proofDoc.data().dataUrl;
        }
      }
      throw new Error(error?.message || 'Unable to load payment proof URL.');
    }

    return data.signedUrl;
  } catch (supabaseErr: any) {
    const segments = storagePath.split('/');
    const possibleRegId = segments.find((s) => s.startsWith('TARAS26-'));
    if (possibleRegId) {
      const proofDoc = await getDoc(doc(firestore, 'payment_proofs', possibleRegId));
      if (proofDoc.exists() && proofDoc.data()?.dataUrl) {
        return proofDoc.data().dataUrl;
      }
    }
    throw supabaseErr;
  }
}

export interface SavePaymentSubmissionParams {
  registrationId: string;
  utrNumber: string;
  proofMetadata: DualStoragePaymentProofMetadata;
}

/**
 * Atomically persist payment submission and dual-storage metadata in Firestore.
 */
export async function savePaymentProofSubmissionToFirestore({
  registrationId,
  utrNumber,
  proofMetadata,
}: SavePaymentSubmissionParams): Promise<void> {
  const trimmedUtr = utrNumber.trim();
  if (!trimmedUtr) throw new Error('UTR / Transaction ID is required.');
  if (!proofMetadata?.path) {
    throw new Error('Payment screenshot storage path is missing.');
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
      paymentProof: {
        paymentProofId: proofMetadata.paymentProofId,
        provider: proofMetadata.provider,
        bucket: proofMetadata.bucket,
        path: proofMetadata.path,
        fileSize: proofMetadata.fileSize,
        contentType: proofMetadata.contentType,
        uploadedAt: proofMetadata.uploadedAt,
        uploadedAtIST: proofMetadata.uploadedAtIST,
        supabasePath: proofMetadata.supabasePath,
        supabaseUploadStatus: proofMetadata.supabaseUploadStatus,
        googleDriveFileId: proofMetadata.googleDriveFileId || '',
        googleDriveFolderId: proofMetadata.googleDriveFolderId || '',
        googleDrivePath: proofMetadata.googleDrivePath || '',
        googleDriveUploadStatus: proofMetadata.googleDriveUploadStatus,
      },
      paymentScreenshotUrl: proofMetadata.signedUrl || '',
      paymentScreenshotPath: proofMetadata.path,
      paymentScreenshotSize: proofMetadata.fileSize,
      paymentScreenshotContentType: proofMetadata.contentType,
      uploadedAt: proofMetadata.uploadedAt,
      uploadedAtIST: proofMetadata.uploadedAtIST,
      supabasePath: proofMetadata.supabasePath,
      supabaseUploadStatus: proofMetadata.supabaseUploadStatus,
      googleDriveFileId: proofMetadata.googleDriveFileId || '',
      googleDriveFolderId: proofMetadata.googleDriveFolderId || '',
      googleDrivePath: proofMetadata.googleDrivePath || '',
      googleDriveUploadStatus: proofMetadata.googleDriveUploadStatus,
      paymentSubmittedAt: proofMetadata.uploadedAt,
      paymentStatus: 'PENDING',
      status: 'PAYMENT_VERIFICATION_PENDING',
      possibleDuplicate: false,
      updatedAt: serverTimestamp(),
    });
  });

  // Audit log entry
  try {
    const auditRef = doc(collection(firestore, 'audit_logs'));
    await setDoc(auditRef, {
      action: 'PAYMENT_SUBMITTED',
      paymentProofId: proofMetadata.paymentProofId,
      registrationId,
      utrNumber: trimmedUtr,
      provider: proofMetadata.provider,
      supabasePath: proofMetadata.supabasePath,
      googleDriveFileId: proofMetadata.googleDriveFileId || '',
      googleDriveUploadStatus: proofMetadata.googleDriveUploadStatus,
      fileSize: proofMetadata.fileSize,
      possibleDuplicate: false,
      timestamp: serverTimestamp(),
    });
  } catch (auditErr) {
    console.warn('Audit log write error:', auditErr);
  }
}

/**
 * Resubmit payment proof following administrative rejection.
 */
export async function resubmitPaymentProofToFirestore({
  registrationId,
  utrNumber,
  proofMetadata,
}: SavePaymentSubmissionParams): Promise<void> {
  await savePaymentProofSubmissionToFirestore({
    registrationId,
    utrNumber,
    proofMetadata,
  });
}

/**
 * Retry Google Drive archival if initial drive upload failed or was pending
 */
export async function retryGoogleDriveArchiveForRegistration(
  registrationId: string,
  file?: File | Blob
): Promise<boolean> {
  const regRef = doc(firestore, 'registrations', registrationId);
  const regSnap = await getDoc(regRef);

  if (!regSnap.exists()) {
    throw new Error('Registration record not found.');
  }

  const regData = regSnap.data();
  const paymentProofId = regData.paymentProofId || regData.paymentProof?.paymentProofId;

  if (!paymentProofId) {
    throw new Error('Payment Proof ID is missing for this registration.');
  }

  let viewUrl = regData.paymentScreenshotUrl || '';
  if (!viewUrl && regData.paymentScreenshotPath) {
    try {
      viewUrl = await getPaymentProofSignedViewUrl(regData.paymentScreenshotPath);
    } catch (_) {}
  }

  const result = await archivePaymentProofToGoogleDrive({
    paymentProofId,
    file,
    downloadUrl: viewUrl,
    teamId: regData.teamId,
    teamName: regData.teamName,
    uploadedAt: regData.uploadedAt || new Date().toISOString(),
    uploadedAtIST: regData.uploadedAtIST || generateAuthoritativeTimestamp().formattedIST,
  });

  if (result.success) {
    await setDoc(
      regRef,
      {
        googleDriveFileId: result.fileId || '',
        googleDriveFolderId: result.folderId || '',
        googleDrivePath: result.path || '',
        googleDriveUploadStatus: 'SUCCESS',
        paymentProof: {
          ...regData.paymentProof,
          googleDriveFileId: result.fileId || '',
          googleDriveFolderId: result.folderId || '',
          googleDrivePath: result.path || '',
          googleDriveUploadStatus: 'SUCCESS',
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    try {
      const auditRef = doc(collection(firestore, 'audit_logs'));
      await setDoc(auditRef, {
        action: 'GOOGLE_DRIVE_ARCHIVE_RETRIED_SUCCESS',
        paymentProofId,
        registrationId,
        googleDriveFileId: result.fileId || '',
        googleDrivePath: result.path || '',
        timestamp: serverTimestamp(),
      });
    } catch (_) {}

    return true;
  }

  return false;
}
