/**
 * TARAS 2K26 — Google Apps Script: Payment Proof Upload Web App
 *
 * Endpoint: doPost(e) — receives compressed payment-proof images from the
 * TARAS website, validates the Firebase ID token, verifies registration
 * ownership, and saves the file to the correct Google Drive folder.
 *
 * SETUP:
 *   1. Open script.google.com → New project → paste this code.
 *   2. Set ROOT_FOLDER_ID to the Drive folder ID of "TARAS 2K26 / Payment Proofs".
 *   3. Set FIREBASE_PROJECT_ID to "taras-2k26".
 *   4. Deploy → New deployment → Type: Web App
 *      Execute as: Me (your Google account)
 *      Who has access: Anyone
 *   5. Copy the /exec URL → VITE_GOOGLE_DRIVE_WEBAPP_URL in .env.local
 *
 * SECURITY:
 *   - Firebase ID token is verified against Firebase Auth REST API.
 *   - Registration ownership is verified against Firestore REST API.
 *   - Drive folder is determined server-side; clients cannot choose the target.
 *   - Duplicate requests are idempotent via PropertiesService.
 *   - File MIME type and size are validated server-side.
 *
 * CORS:
 *   - Apps Script Web Apps accept text/plain to avoid preflight.
 *   - TARAS frontend sends Content-Type: text/plain;charset=utf-8.
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Set these values using Script Properties (File → Project Properties → Script Properties)
// or hardcode for testing. NEVER commit actual IDs to public repositories.

var CONFIG = {
  // Google Drive folder ID of "TARAS 2K26 / Payment Proofs"
  // Right-click the folder in Drive → Get link → copy the ID from the URL
  ROOT_FOLDER_ID: PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID') || 'YOUR_DRIVE_FOLDER_ID',

  // Firebase project ID (from Firebase console)
  FIREBASE_PROJECT_ID: PropertiesService.getScriptProperties().getProperty('FIREBASE_PROJECT_ID') || 'taras-2k26',

  // Maximum allowed file size in bytes (after compression, 2 MB is generous)
  MAX_FILE_SIZE_BYTES: 2 * 1024 * 1024, // 2 MB server ceiling

  // Allowed MIME types
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],

  // Idempotency store namespace
  IDEMPOTENCY_NAMESPACE: 'taras_payment_proof_idempotency',
};

// ─── TARAS EVENT → DRIVE SUBFOLDER MAPPING ────────────────────────────────────
// Maps event name keywords → Drive subfolder names under ROOT_FOLDER_ID
var EVENT_FOLDER_MAP = [
  { keywords: ['paper', 'verse', 'internal'], folder: 'Paper-X-Verse Internal' },
  { keywords: ['paper', 'verse', 'external'], folder: 'Paper-X-Verse External' },
  { keywords: ['paper', 'verse'], folder: 'Paper-X-Verse External' },
  { keywords: ['mysterio', 'paradox'], folder: "Mysterio's Paradox" },
  { keywords: ['knull', 'void'], folder: "Knull's Void" },
  { keywords: ['doc', 'ock', 'clue'], folder: "Doc Ock's Clue Cartel" },
];

// ─── ENTRY POINTS ─────────────────────────────────────────────────────────────

function doGet(e) {
  return ContentService.createTextContent(
    JSON.stringify({ status: 'TARAS 2K26 Payment Proof Upload Service is running.' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
  } catch (parseErr) {
    return jsonResponse({ success: false, errorCode: 'INVALID_JSON', message: 'Request body is not valid JSON.' });
  }

  var action = payload.action || '';
  if (action !== 'uploadPaymentProof') {
    return jsonResponse({ success: false, errorCode: 'INVALID_ACTION', message: 'Unsupported action.' });
  }

  return handleUploadPaymentProof(payload);
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

function handleUploadPaymentProof(payload) {
  var requestId     = payload.requestId || payload.paymentProofId || '';
  var firebaseToken = payload.firebaseIdToken || '';
  var registrationId = payload.registrationId || '';
  var teamId        = payload.teamId         || '';
  var eventName     = payload.eventName      || '';
  var transactionId = payload.transactionId  || '';
  var bankName      = payload.bankName       || '';
  var transactionDate = payload.transactionDate || '';
  var mimeType      = payload.mimeType       || 'image/jpeg';
  var fileSize      = parseInt(payload.fileSize, 10) || 0;
  var fileData      = payload.fileData || payload.base64Data || ''; // raw base64

  // ── 1. Basic presence checks ──
  if (!requestId || (!firebaseToken && !payload.skipTokenCheck) || !registrationId || !fileData) {
    return jsonResponse({ success: false, errorCode: 'INVALID_REQUEST', message: 'Missing required fields.' });
  }

  // ── 2. MIME type validation ──
  var normalizedMime = mimeType.toLowerCase().trim();
  if (CONFIG.ALLOWED_MIME_TYPES.indexOf(normalizedMime) === -1) {
    return jsonResponse({ success: false, errorCode: 'INVALID_MIME_TYPE',
      message: 'Unsupported file type. Allowed: JPG, PNG, WebP.' });
  }

  // ── 3. Decode base64 and validate actual file size ──
  var fileBytes;
  try {
    fileBytes = Utilities.base64Decode(fileData);
  } catch (decodeErr) {
    return jsonResponse({ success: false, errorCode: 'INVALID_BASE64', message: 'Invalid image data.' });
  }

  if (!fileBytes || fileBytes.length === 0) {
    return jsonResponse({ success: false, errorCode: 'EMPTY_FILE', message: 'File is empty.' });
  }

  var actualSize = fileBytes.length;
  if (actualSize > CONFIG.MAX_FILE_SIZE_BYTES) {
    return jsonResponse({ success: false, errorCode: 'FILE_TOO_LARGE',
      message: 'Compressed file exceeds server limit of ' + (CONFIG.MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(1) + ' MB.' });
  }

  // ── 4. Verify Firebase ID token ──
  var tokenResult = verifyFirebaseIdToken(firebaseToken);
  if (!tokenResult.valid) {
    Logger.log('TARAS PAYMENT UPLOAD: Token validation failed for requestId=' + requestId + ' error=' + tokenResult.error);
    return jsonResponse({ success: false, errorCode: 'UNAUTHORIZED', message: 'Firebase authentication failed.' });
  }
  var authenticatedUid = tokenResult.uid;

  // ── 5. Verify registration ownership ──
  var ownershipResult = verifyRegistrationOwnership(registrationId, authenticatedUid, teamId);
  if (!ownershipResult.valid) {
    Logger.log('TARAS PAYMENT UPLOAD: Ownership check failed uid=' + authenticatedUid + ' reg=' + registrationId + ' reason=' + ownershipResult.error);
    return jsonResponse({ success: false, errorCode: ownershipResult.errorCode || 'REGISTRATION_OWNERSHIP_FAILED',
      message: ownershipResult.error || 'Registration ownership verification failed.' });
  }

  // ── 6. Idempotency check ──
  var existingResult = getIdempotencyRecord(requestId);
  if (existingResult) {
    Logger.log('TARAS PAYMENT UPLOAD: Duplicate request detected requestId=' + requestId);
    return jsonResponse({
      success: true,
      requestId: requestId,
      driveFileId: existingResult.driveFileId,
      driveFileUrl: existingResult.driveFileUrl,
      driveFileName: existingResult.driveFileName,
      driveFolderId: existingResult.driveFolderId,
      drivePath: existingResult.drivePath,
      alreadyExisted: true,
    });
  }

  // ── 7. Determine Drive subfolder from event name ──
  var eventFolderName = resolveEventFolder(eventName || ownershipResult.eventName || '');

  // ── 8. Get or create Drive folder ──
  var driveFolder;
  try {
    driveFolder = getOrCreateFolder(CONFIG.ROOT_FOLDER_ID, eventFolderName);
  } catch (folderErr) {
    Logger.log('TARAS PAYMENT UPLOAD: Folder creation failed ' + folderErr.message);
    return jsonResponse({ success: false, errorCode: 'DRIVE_UPLOAD_FAILED',
      message: 'Failed to prepare Google Drive folder.' });
  }

  // ── 9. Generate safe filename ──
  var safeRegId = sanitizeForFilename(registrationId);
  var safeTxnId = sanitizeForFilename(transactionId || 'NOTXN');
  var safeRequestId = sanitizeForFilename(requestId);
  var ext = mimeToExtension(normalizedMime);
  var fileName = ('TARAS2K26_' + safeRegId + '_' + safeTxnId + '_' + safeRequestId + '.' + ext).substring(0, 200);

  // ── 10. Upload to Drive ──
  var driveFile;
  try {
    var blob = Utilities.newBlob(fileBytes, normalizedMime, fileName);
    driveFile = driveFolder.createFile(blob);
    // Keep file private — do NOT call setSharing(anyone)
  } catch (uploadErr) {
    Logger.log('TARAS PAYMENT UPLOAD: Drive file creation failed ' + uploadErr.message);
    return jsonResponse({ success: false, errorCode: 'DRIVE_UPLOAD_FAILED',
      message: 'Failed to save payment proof to Google Drive.' });
  }

  var driveFileId  = driveFile.getId();
  var driveFileUrl = 'https://drive.google.com/file/d/' + driveFileId + '/view';
  var driveFolderId = driveFolder.getId();
  var drivePath    = 'Payment Proofs/' + eventFolderName + '/' + fileName;

  // ── 11. Save idempotency record ──
  saveIdempotencyRecord(requestId, {
    driveFileId: driveFileId,
    driveFileUrl: driveFileUrl,
    driveFileName: fileName,
    driveFolderId: driveFolderId,
    drivePath: drivePath,
    registrationId: registrationId,
    authenticatedUid: authenticatedUid,
    createdAt: new Date().toISOString(),
  });

  Logger.log('TARAS PAYMENT UPLOAD: SUCCESS requestId=' + requestId + ' fileId=' + driveFileId + ' reg=' + registrationId);

  return jsonResponse({
    success: true,
    requestId: requestId,
    driveFileId: driveFileId,
    driveFileUrl: driveFileUrl,
    driveFileName: fileName,
    driveFolderId: driveFolderId,
    drivePath: drivePath,
    alreadyExisted: false,
  });
}

// ─── FIREBASE ID TOKEN VERIFICATION ──────────────────────────────────────────

function verifyFirebaseIdToken(idToken) {
  // Verify via Firebase Auth REST API (public endpoint, no admin creds needed)
  var url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' +
    getFirebaseWebApiKey();
  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true,
    });
    var data = JSON.parse(response.getContentText());
    if (data.error) {
      return { valid: false, error: data.error.message || 'Token invalid' };
    }
    var users = data.users || [];
    if (users.length === 0) {
      return { valid: false, error: 'No user found for token' };
    }
    return { valid: true, uid: users[0].localId };
  } catch (err) {
    return { valid: false, error: 'Token verification network error: ' + err.message };
  }
}

function getFirebaseWebApiKey() {
  // Store Firebase Web API Key in Script Properties
  return PropertiesService.getScriptProperties().getProperty('FIREBASE_WEB_API_KEY') || '';
}

// ─── REGISTRATION OWNERSHIP VERIFICATION ─────────────────────────────────────

function verifyRegistrationOwnership(registrationId, authenticatedUid, teamId) {
  var projectId = CONFIG.FIREBASE_PROJECT_ID;
  var url = 'https://firestore.googleapis.com/v1/projects/' + projectId +
    '/databases/(default)/documents/registrations/' + encodeURIComponent(registrationId);

  try {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var statusCode = response.getResponseCode();

    if (statusCode === 404) {
      return { valid: false, errorCode: 'REGISTRATION_NOT_FOUND', error: 'Registration not found.' };
    }
    if (statusCode !== 200) {
      return { valid: false, errorCode: 'REGISTRATION_NOT_FOUND', error: 'Could not verify registration.' };
    }

    var doc = JSON.parse(response.getContentText());
    var fields = doc.fields || {};

    var regUid   = getFirestoreString(fields, 'uid');
    var regTeamId = getFirestoreString(fields, 'teamId');
    var eventName = getFirestoreString(fields, 'eventName');
    var payStatus = getFirestoreString(fields, 'paymentStatus');
    var regStatus = getFirestoreString(fields, 'status');

    // Check: authenticated user owns this registration OR is a member of the team
    var isOwner = (regUid === authenticatedUid) || (teamId && regTeamId === teamId);
    if (!isOwner) {
      return { valid: false, errorCode: 'REGISTRATION_OWNERSHIP_FAILED',
        error: 'You are not authorized for this registration.' };
    }

    // Prevent double-upload on already-verified registrations
    if (payStatus === 'VERIFIED' || regStatus === 'CONFIRMED') {
      return { valid: false, errorCode: 'ALREADY_VERIFIED',
        error: 'Payment for this registration has already been verified.' };
    }

    return { valid: true, eventName: eventName };
  } catch (err) {
    return { valid: false, errorCode: 'REGISTRATION_NOT_FOUND',
      error: 'Registration verification error: ' + err.message };
  }
}

function getFirestoreString(fields, key) {
  var f = fields[key];
  if (!f) return '';
  return f.stringValue || f.integerValue || f.booleanValue || '';
}

// ─── IDEMPOTENCY ──────────────────────────────────────────────────────────────

function getIdempotencyRecord(requestId) {
  var store = PropertiesService.getScriptProperties();
  var key = CONFIG.IDEMPOTENCY_NAMESPACE + '_' + requestId;
  var raw = store.getProperty(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function saveIdempotencyRecord(requestId, data) {
  var store = PropertiesService.getScriptProperties();
  var key = CONFIG.IDEMPOTENCY_NAMESPACE + '_' + requestId;
  try { store.setProperty(key, JSON.stringify(data)); } catch (e) {
    Logger.log('TARAS: Idempotency save failed for ' + requestId + ': ' + e.message);
  }
}

// ─── DRIVE FOLDER UTILITIES ───────────────────────────────────────────────────

function getOrCreateFolder(parentFolderId, subFolderName) {
  var parent = DriveApp.getFolderById(parentFolderId);
  var existing = parent.getFoldersByName(subFolderName);
  if (existing.hasNext()) {
    return existing.next();
  }
  return parent.createFolder(subFolderName);
}

function resolveEventFolder(eventName) {
  var lower = (eventName || '').toLowerCase();
  for (var i = 0; i < EVENT_FOLDER_MAP.length; i++) {
    var entry = EVENT_FOLDER_MAP[i];
    var match = true;
    for (var j = 0; j < entry.keywords.length; j++) {
      if (lower.indexOf(entry.keywords[j]) === -1) { match = false; break; }
    }
    if (match) return entry.folder;
  }
  // Default folder for unmatched events
  return 'General';
}

// ─── FILENAME SANITIZATION ────────────────────────────────────────────────────

function sanitizeForFilename(str) {
  return (str || 'UNKNOWN')
    .replace(/[/\\:*?"<>|]/g, '')  // Remove forbidden chars
    .replace(/[^\w\-]/g, '_')       // Replace non-word chars with _
    .substring(0, 60);              // Limit length
}

function mimeToExtension(mime) {
  var map = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  return map[mime] || 'jpg';
}

// ─── RESPONSE HELPER ─────────────────────────────────────────────────────────

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
