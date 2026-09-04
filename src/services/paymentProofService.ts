/**
 * TARAS 2K26 — Payment Proof Storage & Submission Service
 *
 * Handles:
 * - Asynchronous upload of optimized images to Firebase Storage
 * - Real-time progress monitoring via uploadBytesResumable
 * - Firestore metadata persistence with atomic status transitions
 * - Network failure handling & retry resilience
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type UploadTask,
} from 'firebase/storage';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore, storage } from '../config/firebase';

export interface PaymentProofUploadResult {
  downloadUrl: string;
  storagePath: string;
  size: number;
  contentType: string;
}

export type UploadProgressCallback = (percent: number) => void;

/**
 * Upload optimized payment screenshot to Firebase Storage with live progress updates
 *
 * Path: /payment-proofs/{registrationId}/payment-proof_{timestamp}.{ext}
 */
export async function uploadOptimizedPaymentProof(
  registrationId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<PaymentProofUploadResult> {
  if (!registrationId) {
    throw new Error('Registration ID is required for storage path resolution.');
  }
  if (!file) {
    throw new Error('No optimized screenshot file provided for upload.');
  }

  const rawExt = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const cleanExt = rawExt.replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  // Standardized path in Firebase Storage
  const storagePath = `payment-proofs/${registrationId}/payment-proof_${timestamp}.${cleanExt}`;

  try {
    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType: file.type || 'image/webp',
      customMetadata: {
        registrationId,
        uploadedAt: new Date().toISOString(),
        fileSize: String(file.size),
        originalFileName: file.name,
      },
    };

    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, metadata);

    return await new Promise<PaymentProofUploadResult>((resolve, reject) => {
      let isCompleted = false;

      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          try {
            uploadTask.cancel();
          } catch (_) {
            // ignore
          }
          reject(
            new Error(
              'Upload timed out. If Firebase Storage was just enabled, please retry in a moment.'
            )
          );
        }
      }, 25000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            if (onProgress) {
              onProgress(Math.min(99, progress)); // Keep at 99% until download URL resolves
            }
          }
        },
        (error) => {
          if (isCompleted) return;
          isCompleted = true;
          clearTimeout(timeoutId);
          console.error('Firebase Storage uploadBytesResumable failed:', error);
          if (error.code === 'storage/unauthorized') {
            reject(
              new Error(
                'Permission denied accessing Firebase Storage. Please ensure you are logged in to TARAS 2K26.'
              )
            );
          } else if (
            error.code === 'storage/unknown' ||
            error.message?.includes('bucket')
          ) {
            reject(
              new Error(
                'Firebase Storage bucket setup in progress. Please ensure Firebase Storage is initialized in the Firebase Console.'
              )
            );
          } else if (error.code === 'storage/canceled') {
            reject(
              new Error(
                'Upload timed out or was cancelled. Please check your network and retry.'
              )
            );
          } else {
            reject(
              new Error(
                'Upload failed due to a network interruption. Your registration is still saved. Please retry the upload.'
              )
            );
          }
        },
        async () => {
          if (isCompleted) return;
          isCompleted = true;
          clearTimeout(timeoutId);
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) {
              onProgress(100);
            }
            resolve({
              downloadUrl,
              storagePath,
              size: file.size,
              contentType: file.type || 'image/webp',
            });
          } catch (urlErr: any) {
            reject(
              new Error(
                urlErr.message ||
                  'Failed to generate secure download reference for payment proof.'
              )
            );
          }
        }
      );
    });
  } catch (err: any) {
    throw new Error(
      err.message ||
        'Upload failed. Your registration is still saved. Please retry the payment proof upload.'
    );
  }
}

export interface SubmitPaymentProofParams {
  registrationId: string;
  utrNumber: string;
  uploadResult: PaymentProofUploadResult;
}

/**
 * Save payment proof reference and metadata to Firestore registration document
 *
 * Sequence:
 * 1. Validate inputs
 * 2. Check for duplicate UTRs
 * 3. Update Firestore registration document
 * 4. Write immutable audit log
 */
export async function savePaymentProofSubmission({
  registrationId,
  utrNumber,
  uploadResult,
}: SubmitPaymentProofParams): Promise<void> {
  const trimmedUtr = utrNumber.trim();
  if (!trimmedUtr) throw new Error('UTR / Transaction ID is required.');
  if (!uploadResult?.downloadUrl) {
    throw new Error('Payment screenshot storage reference is missing.');
  }

  // Check for duplicate UTR across registrations
  const regsRef = collection(firestore, 'registrations');
  const duplicateQuery = query(regsRef, where('utrNumber', '==', trimmedUtr));
  const duplicateSnap = await getDocs(duplicateQuery);

  let possibleDuplicate = false;
  for (const documentSnap of duplicateSnap.docs) {
    if (documentSnap.id !== registrationId) {
      possibleDuplicate = true;
      break;
    }
  }

  const regRef = doc(firestore, 'registrations', registrationId);
  const now = new Date().toISOString();

  // Atomically persist storage references and set status to PAYMENT_VERIFICATION_PENDING
  await updateDoc(regRef, {
    utrNumber: trimmedUtr,
    paymentScreenshotUrl: uploadResult.downloadUrl,
    paymentScreenshotPath: uploadResult.storagePath,
    paymentScreenshotSize: uploadResult.size,
    paymentScreenshotContentType: uploadResult.contentType,
    paymentSubmittedAt: now,
    status: 'PAYMENT_VERIFICATION_PENDING',
    possibleDuplicate,
    updatedAt: serverTimestamp(),
  });

  // Audit log entry
  try {
    const auditRef = doc(collection(firestore, 'audit_logs'));
    await setDoc(auditRef, {
      action: 'PAYMENT_SUBMITTED',
      registrationId,
      utrNumber: trimmedUtr,
      storagePath: uploadResult.storagePath,
      fileSize: uploadResult.size,
      possibleDuplicate,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}

/**
 * Resubmit payment proof after an administrative rejection
 */
export async function resubmitPaymentProofSubmission({
  registrationId,
  utrNumber,
  uploadResult,
}: SubmitPaymentProofParams): Promise<void> {
  const trimmedUtr = utrNumber.trim();
  if (!trimmedUtr) throw new Error('UTR / Transaction ID is required.');
  if (!uploadResult?.downloadUrl) {
    throw new Error('Payment screenshot storage reference is missing.');
  }

  const regsRef = collection(firestore, 'registrations');
  const duplicateQuery = query(regsRef, where('utrNumber', '==', trimmedUtr));
  const duplicateSnap = await getDocs(duplicateQuery);

  let possibleDuplicate = false;
  for (const documentSnap of duplicateSnap.docs) {
    if (documentSnap.id !== registrationId) {
      possibleDuplicate = true;
      break;
    }
  }

  const regRef = doc(firestore, 'registrations', registrationId);
  const now = new Date().toISOString();

  await updateDoc(regRef, {
    utrNumber: trimmedUtr,
    paymentScreenshotUrl: uploadResult.downloadUrl,
    paymentScreenshotPath: uploadResult.storagePath,
    paymentScreenshotSize: uploadResult.size,
    paymentScreenshotContentType: uploadResult.contentType,
    paymentSubmittedAt: now,
    status: 'PAYMENT_VERIFICATION_PENDING',
    possibleDuplicate,
    updatedAt: serverTimestamp(),
  });

  try {
    const auditRef = doc(collection(firestore, 'audit_logs'));
    await setDoc(auditRef, {
      action: 'PAYMENT_RESUBMITTED',
      registrationId,
      utrNumber: trimmedUtr,
      storagePath: uploadResult.storagePath,
      fileSize: uploadResult.size,
      possibleDuplicate,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}
