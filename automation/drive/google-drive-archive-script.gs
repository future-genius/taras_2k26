/**
 * TARAS 2K26 — Google Drive Payment Proof Archival Engine (Google Apps Script)
 *
 * Deploy as Web App:
 * - Execute as: Me (your Google account)
 * - Who has access: Anyone (or Anyone with link)
 *
 * Folder Hierarchy:
 * TARAS 2K26
 * └── Payment Proofs
 *     └── YYYY (e.g. 2026)
 *         └── Month (e.g. October)
 *             └── DD (e.g. 10)
 *                 └── TEAM-014_TechTitans (or INDIVIDUAL_TARAS26-EVT-12345)
 *                     └── PAY-TARAS-20261010-143522-X7K9.png
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, error: 'Missing POST payload' });
    }

    var payload = JSON.parse(e.postData.contents);
    var paymentProofId = payload.paymentProofId;
    var fileName = payload.fileName || (paymentProofId + '.png');
    var base64Data = payload.base64Data;
    var mimeType = payload.mimeType || 'image/png';
    var teamName = payload.teamName || payload.teamId || 'UNNAMED_TEAM';
    var year = payload.year || '2026';
    var month = payload.month || 'October';
    var date = payload.date || '10';

    if (!paymentProofId) {
      return responseJSON({ success: false, error: 'Payment Proof ID is required.' });
    }

    // 1. Get Root Folder "TARAS 2K26" (or create if absent)
    var rootFolder = getOrCreateSubfolder(DriveApp.getRootFolder(), 'TARAS 2K26');
    var proofsFolder = getOrCreateSubfolder(rootFolder, 'Payment Proofs');
    var yearFolder = getOrCreateSubfolder(proofsFolder, String(year));
    var monthFolder = getOrCreateSubfolder(yearFolder, String(month));
    var dateFolder = getOrCreateSubfolder(monthFolder, String(date));

    // Sanitize Team folder name
    var cleanTeamFolder = String(teamName).replace(/[^a-zA-Z0-9_-]/g, '_');
    var teamFolder = getOrCreateSubfolder(dateFolder, cleanTeamFolder);

    // 2. Check for duplicate file by paymentProofId (Idempotency check)
    var existingFiles = teamFolder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      var existingFile = existingFiles.next();
      return responseJSON({
        success: true,
        alreadyExisted: true,
        fileId: existingFile.getId(),
        folderId: teamFolder.getId(),
        driveUrl: existingFile.getUrl(),
        path: 'TARAS 2K26/Payment Proofs/' + year + '/' + month + '/' + date + '/' + cleanTeamFolder + '/' + fileName
      });
    }

    // 3. Decode Base64 or download URL
    var blob;
    if (base64Data) {
      var bytes = Utilities.base64Decode(base64Data.replace(/^data:image\/\w+;base64,/, ''));
      blob = Utilities.newBlob(bytes, mimeType, fileName);
    } else if (payload.downloadUrl) {
      var fetchRes = UrlFetchApp.fetch(payload.downloadUrl);
      blob = fetchRes.getBlob().setName(fileName);
    } else {
      return responseJSON({ success: false, error: 'Neither base64Data nor downloadUrl provided.' });
    }

    // 4. Create File in Team Folder
    var file = teamFolder.createFile(blob);
    file.setDescription('TARAS 2K26 Payment Proof | ID: ' + paymentProofId + ' | Uploaded: ' + (payload.uploadedAtIST || new Date().toISOString()));

    return responseJSON({
      success: true,
      alreadyExisted: false,
      fileId: file.getId(),
      folderId: teamFolder.getId(),
      driveUrl: file.getUrl(),
      path: 'TARAS 2K26/Payment Proofs/' + year + '/' + month + '/' + date + '/' + cleanTeamFolder + '/' + fileName
    });

  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  return ContentService.createTextOutput('TARAS 2K26 Google Drive Archive Service Operational.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getOrCreateSubfolder(parent, folderName) {
  var folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(folderName);
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
