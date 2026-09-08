import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, firestore, storage } from '../config/firebase';
import type { EventRegistration, PaymentStatus } from '../types/registration';
import type { RegistrationPaymentConfig } from '../types/registrationConfig';

export const MAX_PAYMENT_PROOF_SIZE_BYTES = 1048576; // 1 MB per registration
export const MAX_PAYMENT_PROOF_SIZE_LABEL = '1 MB';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/pjpeg',
];

/**
 * Validate screenshot file type and size (1 MB max) before uploading
 */
export function validatePaymentScreenshotFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected. Please choose a screenshot.' };
  }

  // 1. Enforce strict 1 MB limit
  if (file.size > MAX_PAYMENT_PROOF_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Screenshot size (${sizeInMb} MB) exceeds the maximum 1 MB limit. Please select an image under 1 MB.`,
    };
  }

  // 2. Validate MIME type and file extension
  const isImageMime = file.type.startsWith('image/') || ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase());
  const hasImageExt = /\.(jpe?g|png|webp|heic)$/i.test(file.name);

  if (!isImageMime && !hasImageExt) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a valid image file (PNG, JPG, JPEG, WEBP, HEIC).',
    };
  }

  return { valid: true };
}

/**
 * Securely upload payment screenshot to Firebase Storage
 * Path: /payment_proofs/{registrationId}/{timestamp}_{cleanFileName}
 */
export async function uploadPaymentScreenshot(
  registrationId: string,
  file: File
): Promise<string> {
  const validation = validatePaymentScreenshotFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanExt = rawExt.replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const storagePath = `payment_proofs/${registrationId}/proof_${timestamp}.${cleanExt}`;

  try {
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        registrationId,
        uploadedAt: new Date().toISOString(),
        originalFileName: file.name,
      },
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (storageError: any) {
    console.error('Firebase Storage upload error:', storageError);
    if (storageError.code === 'storage/unauthorized') {
      throw new Error('Permission denied uploading payment screenshot to Firebase Storage. Please ensure you are logged in.');
    }
    if (storageError.code === 'storage/unknown' || storageError.message?.includes('bucket')) {
      throw new Error(
        'Firebase Storage bucket setup in progress. Please ensure Firebase Storage is initialized in Firebase Console.'
      );
    }
    throw new Error(storageError.message || 'Failed to securely upload payment proof to Firebase Storage.');
  }
}

export function normalizeTransactionId(rawTxn: string): string {
  return rawTxn.trim().toUpperCase().replace(/\s+/g, '');
}

const DEFAULT_PAYMENT_CONFIG: RegistrationPaymentConfig = {
  upiId: '',
  payeeName: 'VALLIAMMAI ENGINEERING COLLEGE',
  accountName: 'VALLIAMMAI ENGINEERING COLLEGE',
  bankName: 'City Union Bank Ltd',
  accountNumber: '117109000031450',
  ifsc: 'CIUB0000117',
  branch: 'TAMBARAM BRANCH (EXTN COUNTER)',
  micr: '600054011',
  paymentInstructions: [
    'Transfer the exact ₹200 event registration fee via NEFT / RTGS / IMPS / Net Banking to the bank account listed above.',
    'Copy the official 12-digit UTR / Reference / Transaction ID from your banking app.',
    'Upload a clear screenshot of the completed transfer receipt (under 1 MB).',
    'Submit your registration for verification by the TARAS registration team.',
  ],
};

/**
 * Fetch official TARAS payment configuration
 */
export async function getPaymentConfig(): Promise<RegistrationPaymentConfig> {
  try {
    const configRef = doc(firestore, 'system_config', 'registration_payment_config');
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      return { ...DEFAULT_PAYMENT_CONFIG, ...snap.data() } as RegistrationPaymentConfig;
    }
  } catch (err) {
    console.warn('Error reading payment config from Firestore, using default:', err);
  }
  return DEFAULT_PAYMENT_CONFIG;
}

/**
 * Update TARAS payment configuration (Admin only)
 */
export async function updatePaymentConfig(config: Partial<RegistrationPaymentConfig>): Promise<void> {
  const configRef = doc(firestore, 'system_config', 'registration_payment_config');
  await setDoc(configRef, { ...config, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Submit manual payment proof (Participant)
 */
export async function submitPaymentProof(
  registrationId: string,
  utrNumber: string,
  paymentScreenshotUrl: string
): Promise<void> {
  const trimmedUtr = utrNumber.trim();
  if (!trimmedUtr) throw new Error('UTR / Transaction ID is required.');
  if (!paymentScreenshotUrl) throw new Error('Payment screenshot proof is required.');

  const normalizedTxnId = normalizeTransactionId(trimmedUtr);
  const usedTxnRef = doc(firestore, 'used_transaction_ids', normalizedTxnId);
  const regRef = doc(firestore, 'registrations', registrationId);
  const now = new Date().toISOString();

  await runTransaction(firestore, async (transaction) => {
    // 1. Check atomic lock collection
    const usedTxnSnap = await transaction.get(usedTxnRef);
    if (usedTxnSnap.exists()) {
      const existingData = usedTxnSnap.data();
      if (existingData.registrationId !== registrationId) {
        throw new Error(
          'This Transaction ID / UTR has already been submitted for another registration. Transaction IDs must be unique.'
        );
      }
    }

    const regSnap = await transaction.get(regRef);
    if (!regSnap.exists()) throw new Error('Registration document not found.');

    // 2. Writes
    transaction.set(usedTxnRef, {
      transactionId: normalizedTxnId,
      rawUtr: trimmedUtr,
      registrationId,
      submittedByUid: auth.currentUser?.uid || '',
      submittedAt: serverTimestamp(),
    });

    transaction.update(regRef, {
      utrNumber: trimmedUtr,
      paymentScreenshotUrl,
      paymentSubmittedAt: now,
      status: 'PAYMENT_VERIFICATION_PENDING',
      possibleDuplicate: false,
      updatedAt: serverTimestamp(),
    });
  });

  // Write immutable audit log
  try {
    const auditRef = doc(collection(firestore, 'audit_logs'));
    await setDoc(auditRef, {
      action: 'PAYMENT_SUBMITTED',
      registrationId,
      utrNumber: trimmedUtr,
      normalizedTxnId,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}

/**
 * Verify payment (Authorized Registration Staff / Admin)
 */
export async function verifyPayment(
  registrationId: string,
  staffUid: string
): Promise<void> {
  const regRef = doc(firestore, 'registrations', registrationId);
  const now = new Date().toISOString();

  await runTransaction(firestore, async (transaction) => {
    const regSnap = await transaction.get(regRef);
    if (!regSnap.exists()) throw new Error('Registration record not found.');

    const regData = regSnap.data() as EventRegistration;
    const partRef = doc(firestore, 'participants', regData.uid);

    // Execute ALL reads before any writes
    const partSnap = await transaction.get(partRef);

    // Write 1: Update registration status
    transaction.update(regRef, {
      paymentStatus: 'VERIFIED',
      status: 'CONFIRMED',
      paymentVerifiedAt: now,
      paymentVerifiedBy: staffUid,
      updatedAt: serverTimestamp(),
    });

    // Write 2: Update participant registeredEvents if needed
    if (partSnap.exists()) {
      const pData = partSnap.data();
      const currentEvents = (pData.registeredEvents as string[]) || [];
      if (!currentEvents.includes(regData.eventId)) {
        transaction.update(partRef, {
          registeredEvents: [...currentEvents, regData.eventId],
          updatedAt: serverTimestamp(),
        });
      }
    }
  });

  // Audit Log
  try {
    const auditRef = doc(collection(firestore, 'audit_logs'));
    await setDoc(auditRef, {
      action: 'PAYMENT_VERIFIED',
      registrationId,
      actorUid: staffUid,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}

/**
 * Reject payment (Authorized Registration Staff / Admin)
 */
export async function rejectPayment(
  registrationId: string,
  staffUid: string,
  reason: string
): Promise<void> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new Error('Rejection reason is required.');

  const regRef = doc(firestore, 'registrations', registrationId);
  const now = new Date().toISOString();

  await updateDoc(regRef, {
    paymentStatus: 'REJECTED',
    status: 'REJECTED',
    rejectionReason: trimmedReason,
    paymentRejectedAt: now,
    paymentRejectedBy: staffUid,
    updatedAt: serverTimestamp(),
  });

  // Audit Log
  try {
    const auditRef = doc(collection(firestore, 'audit_logs'));
    await setDoc(auditRef, {
      action: 'PAYMENT_REJECTED',
      registrationId,
      actorUid: staffUid,
      rejectionReason: trimmedReason,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}

/**
 * Resubmit payment proof (Participant after rejection)
 */
export async function resubmitPaymentProof(
  registrationId: string,
  utrNumber: string,
  paymentScreenshotUrl: string
): Promise<void> {
  const trimmedUtr = utrNumber.trim();
  if (!trimmedUtr) throw new Error('UTR / Transaction ID is required.');
  if (!paymentScreenshotUrl) throw new Error('Payment screenshot proof is required.');

  const normalizedTxnId = normalizeTransactionId(trimmedUtr);
  const usedTxnRef = doc(firestore, 'used_transaction_ids', normalizedTxnId);
  const regRef = doc(firestore, 'registrations', registrationId);
  const now = new Date().toISOString();

  await runTransaction(firestore, async (transaction) => {
    const usedTxnSnap = await transaction.get(usedTxnRef);
    if (usedTxnSnap.exists()) {
      const existingData = usedTxnSnap.data();
      if (existingData.registrationId !== registrationId) {
        throw new Error(
          'This Transaction ID / UTR has already been submitted for another registration. Transaction IDs must be unique.'
        );
      }
    }

    const regSnap = await transaction.get(regRef);
    if (!regSnap.exists()) throw new Error('Registration document not found.');

    transaction.set(usedTxnRef, {
      transactionId: normalizedTxnId,
      rawUtr: trimmedUtr,
      registrationId,
      submittedByUid: auth.currentUser?.uid || '',
      submittedAt: serverTimestamp(),
    });

    transaction.update(regRef, {
      utrNumber: trimmedUtr,
      paymentScreenshotUrl,
      paymentSubmittedAt: now,
      status: 'PAYMENT_VERIFICATION_PENDING',
      possibleDuplicate: false,
      updatedAt: serverTimestamp(),
    });
  });

  // Audit Log
  try {
    const auditRef = doc(collection(firestore, 'audit_logs'));
    await setDoc(auditRef, {
      action: 'PAYMENT_RESUBMITTED',
      registrationId,
      utrNumber: trimmedUtr,
      normalizedTxnId,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}

/**
 * Query registrations with status filters for Registration Desk
 */
export async function getRegistrationsForVerification(filterStatus?: 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'): Promise<EventRegistration[]> {
  const regsRef = collection(firestore, 'registrations');
  let q;
  if (filterStatus && filterStatus !== 'ALL') {
    q = query(regsRef, where('paymentStatus', '==', filterStatus));
  } else {
    q = query(regsRef);
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as EventRegistration);
}
