/**
 * TARAS 2K26 — Google Drive Archive Service
 *
 * Automates human-accessible Google Drive archiving of payment proof screenshots.
 *
 * Required Google Drive Folder Hierarchy:
 * TARAS 2K26
 * └── Payment Proofs
 *     └── 2026
 *         └── October
 *             └── 10
 *                 └── TEAM-014_TechTitans
 *                     └── PAY-TARAS-20261010-143522-X7K9.png
 *
 * Safe Architecture:
 * - Uses configured server-side endpoint / Google Apps Script WebApp (`VITE_GOOGLE_DRIVE_WEBAPP_URL`).
 * - Never exposes private keys or credentials in client bundles.
 * - Idempotent lookup & upload (prevents duplicate folders or files).
 * - Partial failure resilient: returns failure state if Drive is unconfigured or times out,
 *   preserving application-side Supabase storage and enabling secure retry.
 */

export interface GoogleDriveArchiveParams {
  paymentProofId: string;
  file?: File | Blob;
  downloadUrl?: string;
  teamId?: string;
  teamName?: string;
  uploadedAt: string;
  uploadedAtIST: string;
}

export interface GoogleDriveArchiveResult {
  success: boolean;
  alreadyExisted?: boolean;
  fileId?: string;
  folderId?: string;
  driveUrl?: string;
  path?: string;
  error?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format date segments from timestamp for Google Drive folder hierarchy
 */
export function getDriveFolderPathSegments(timestampIsoOrOffset: string): {
  year: string;
  month: string;
  date: string;
} {
  const d = new Date(timestampIsoOrOffset);
  // Fallback to current date if invalid
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const year = String(validDate.getFullYear());
  const month = MONTH_NAMES[validDate.getMonth()] || 'October';
  const date = String(validDate.getDate()).padStart(2, '0');

  return { year, month, date };
}

/**
 * Convert Blob/File to Base64 string safely
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || dataUrl;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read payment proof image for Drive archive.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Archive payment proof screenshot to Google Drive
 */
export async function archivePaymentProofToGoogleDrive({
  paymentProofId,
  file,
  downloadUrl,
  teamId,
  teamName,
  uploadedAt,
  uploadedAtIST,
}: GoogleDriveArchiveParams): Promise<GoogleDriveArchiveResult> {
  const webAppUrl = import.meta.env.VITE_GOOGLE_DRIVE_WEBAPP_URL || '';

  const { year, month, date } = getDriveFolderPathSegments(uploadedAt);
  const cleanTeamName = (teamName || teamId || 'INDIVIDUAL_PARTICIPANT')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  const fileExt = file instanceof File
    ? file.name.split('.').pop()?.toLowerCase() || 'png'
    : 'png';

  const fileName = `${paymentProofId}.${fileExt}`;
  const targetDrivePath = `TARAS 2K26/Payment Proofs/${year}/${month}/${date}/${cleanTeamName}/${fileName}`;

  // If no Web App URL is configured, log warning and return graceful PENDING/UNCONFIGURED status
  if (!webAppUrl || webAppUrl.includes('your-google-script-url')) {
    console.warn(
      'Google Drive WebApp URL (VITE_GOOGLE_DRIVE_WEBAPP_URL) is not set. Google Drive archive status set to PENDING.'
    );
    return {
      success: false,
      error: 'Google Drive Archival Endpoint not configured. Supabase storage remains intact.',
      path: targetDrivePath,
    };
  }

  try {
    let base64Data = '';
    if (file) {
      base64Data = await blobToBase64(file);
    }

    const payload = {
      paymentProofId,
      fileName,
      mimeType: file?.type || 'image/png',
      base64Data,
      downloadUrl,
      teamId: teamId || '',
      teamName: cleanTeamName,
      year,
      month,
      date,
      uploadedAt,
      uploadedAtIST,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script requires simple text/plain to prevent CORS preflight issues
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google Drive WebApp returned HTTP status ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Google Drive archive service reported an error.');
    }

    return {
      success: true,
      alreadyExisted: !!result.alreadyExisted,
      fileId: result.fileId || '',
      folderId: result.folderId || '',
      driveUrl: result.driveUrl || '',
      path: result.path || targetDrivePath,
    };
  } catch (err: any) {
    console.warn('Google Drive Archival Exception:', err.message || err);
    return {
      success: false,
      error: err.name === 'AbortError'
        ? 'Google Drive Archival timed out. Supabase storage remains intact.'
        : (err.message || 'Google Drive Archival failed.'),
      path: targetDrivePath,
    };
  }
}
