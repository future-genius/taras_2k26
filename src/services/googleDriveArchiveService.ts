/**
 * TARAS 2K26 — Google Drive Payment Proof Upload Service
 *
 * PRIMARY storage provider for payment-proof screenshots.
 *
 * Architecture:
 *   Compressed image (base64)
 *     → Firebase ID token (short-lived)
 *     → Google Apps Script Web App (VITE_GOOGLE_DRIVE_WEBAPP_URL)
 *     → Google Drive (TARAS 2K26 / Payment Proofs / <event> / <file>)
 *
 * Security:
 *   - No Supabase. No service-account keys in the frontend.
 *   - The Apps Script validates the Firebase ID token server-side.
 *   - The Apps Script derives the correct Drive folder from the validated event.
 *   - The browser never controls the Drive folder ID or path.
 *
 * Idempotency:
 *   - requestId = paymentProofId is enforced by the Apps Script (PropertiesService).
 *   - Duplicate requests return the existing Drive file metadata.
 */

export interface DriveUploadParams {
  /** Idempotency key — always equals paymentProofId */
  requestId: string;
  /** Short-lived Firebase ID token for server-side auth validation */
  firebaseIdToken: string;
  /** Firestore registration document ID */
  registrationId: string;
  /** Optional team ID */
  teamId?: string;
  /** Display name of the TARAS event (used for Drive folder routing) */
  eventName?: string;
  /** UTR / Transaction ID entered by the participant */
  transactionId?: string;
  /** Bank name entered by the participant */
  bankName?: string;
  /** Transaction date (ISO string or display string) */
  transactionDate?: string;
  /** Original filename (sanitized server-side; do not trust as final name) */
  originalFileName?: string;
  /** MIME type of the compressed image (client hint; server validates) */
  mimeType: string;
  /** Size in bytes of the compressed image (client hint; server validates) */
  fileSize: number;
  /** Base64-encoded compressed image data (NO data: prefix) */
  fileData: string;
  /** IST timestamp string */
  uploadedAtIST: string;
  /** ISO timestamp string */
  uploadedAt: string;
}

export interface DriveUploadResult {
  success: boolean;
  /** Idempotency key echoed back */
  requestId?: string;
  /** Drive file ID */
  driveFileId?: string;
  /** Drive web view URL */
  driveFileUrl?: string;
  /** Final sanitized filename in Drive */
  driveFileName?: string;
  /** Drive folder ID */
  driveFolderId?: string;
  /** Human-readable Drive folder path */
  drivePath?: string;
  /** Whether this was a duplicate request (file already existed) */
  alreadyExisted?: boolean;
  /** Error code for failed requests */
  errorCode?: string;
  /** Human-readable error message */
  error?: string;
}

/**
 * Convert Blob/File to raw Base64 string (no data: URI prefix)
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:<mime>;base64," prefix — Apps Script expects raw base64
      const base64 = dataUrl.split(',')[1] || dataUrl;
      resolve(base64);
    };
    reader.onerror = () =>
      reject(new Error('Failed to encode payment proof image for upload.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload a payment-proof image to Google Drive via the Apps Script Web App.
 *
 * This is the PRIMARY (and only) upload path. There is no Supabase fallback.
 * If the upload fails, the caller should surface the error and offer a retry.
 */
export async function uploadPaymentProofToDrive(
  params: DriveUploadParams,
  file?: File | Blob
): Promise<DriveUploadResult> {
  const webAppUrl = import.meta.env.VITE_GOOGLE_DRIVE_WEBAPP_URL || '';

  if (!webAppUrl || webAppUrl.includes('your-google-script-url')) {
    console.error(
      'TARAS 2K26: VITE_GOOGLE_DRIVE_WEBAPP_URL is not configured. Payment-proof upload aborted.'
    );
    return {
      success: false,
      errorCode: 'DRIVE_NOT_CONFIGURED',
      error:
        'Google Drive upload endpoint is not configured. Please contact the TARAS administrator.',
      requestId: params.requestId,
    };
  }

  // Encode image to base64 if a file/blob is provided
  let fileData = params.fileData;
  if (!fileData && file) {
    try {
      fileData = await blobToBase64(file);
    } catch (encodeErr: any) {
      return {
        success: false,
        errorCode: 'ENCODE_FAILED',
        error: encodeErr.message || 'Failed to encode payment proof image.',
        requestId: params.requestId,
      };
    }
  }

  if (!fileData) {
    return {
      success: false,
      errorCode: 'EMPTY_FILE',
      error: 'No image data to upload.',
      requestId: params.requestId,
    };
  }

  // Derive date components for folder organization if needed
  const dateObj = new Date(params.uploadedAt || Date.now());
  const year = String(dateObj.getFullYear());
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = monthNames[dateObj.getMonth()];
  const date = String(dateObj.getDate()).padStart(2, '0');

  const payload = {
    action: 'uploadPaymentProof',
    // Support both naming schemes (requestId for Code.gs and paymentProofId for google-drive-archive-script.gs)
    requestId: params.requestId,
    paymentProofId: params.requestId,
    firebaseIdToken: params.firebaseIdToken,
    registrationId: params.registrationId,
    teamId: params.teamId || '',
    teamName: params.teamId || params.eventName || 'GENERAL',
    eventName: params.eventName || '',
    transactionId: params.transactionId || '',
    bankName: params.bankName || '',
    transactionDate: params.transactionDate || '',
    fileName: params.originalFileName || `${params.requestId}.png`,
    originalFileName: params.originalFileName || 'payment_proof',
    mimeType: params.mimeType,
    fileSize: params.fileSize,
    // Support both image data field names
    fileData,
    base64Data: fileData,
    uploadedAt: params.uploadedAt,
    uploadedAtIST: params.uploadedAtIST,
    year,
    month,
    date,
  };

  const controller = new AbortController();
  // 30-second timeout — base64 of ~800 KB on a slow mobile connection
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      // Apps Script requires Content-Type: text/plain to avoid CORS preflight
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        errorCode: 'HTTP_ERROR',
        error: `Upload service returned HTTP ${response.status}. Please retry.`,
        requestId: params.requestId,
      };
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        errorCode: result.errorCode || 'DRIVE_UPLOAD_FAILED',
        error: result.message || result.error || 'Google Drive upload failed.',
        requestId: params.requestId,
      };
    }

    return {
      success: true,
      requestId: result.requestId || result.paymentProofId || params.requestId,
      driveFileId: result.driveFileId || result.fileId || '',
      driveFileUrl: result.driveFileUrl || result.driveUrl || '',
      driveFileName: result.driveFileName || result.fileName || '',
      driveFolderId: result.driveFolderId || result.folderId || '',
      drivePath: result.drivePath || result.path || '',
      alreadyExisted: !!result.alreadyExisted,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      errorCode: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      error: isTimeout
        ? 'Upload timed out. Please check your internet connection and retry.'
        : err.message || 'Network error during upload. Please retry.',
      requestId: params.requestId,
    };
  }
}
