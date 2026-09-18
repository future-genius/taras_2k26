# TARAS 2K26 — Google Drive Payment Proof Setup Guide

## Overview

Payment-proof screenshots are stored in **Google Drive** via a **Google Apps Script Web App**.

```
Participant → TARAS Website → Apps Script → Google Drive
                    ↓
               Firestore (metadata only)
```

No Supabase. No Firebase Storage. No Cloud Functions. No service-account credentials in the browser.

---

## Step 1 — Create the Google Drive Folder Structure

1. Open [Google Drive](https://drive.google.com) with the **Google account that will own the TARAS Drive**.
2. Create a folder called **`TARAS 2K26`**.
3. Inside it, create a folder called **`Payment Proofs`**.
4. Inside `Payment Proofs`, create these subfolders:
   - `Paper-X-Verse Internal`
   - `Paper-X-Verse External`
   - `Mysterio's Paradox`
   - `Knull's Void`
   - `Doc Ock's Clue Cartel`
   - `General` (fallback for unmatched events)
5. **Copy the Folder ID** of the `Payment Proofs` folder.
   - Open the folder → look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - Copy `FOLDER_ID_HERE`.

---

## Step 2 — Create the Apps Script Project

1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Delete the default `myFunction()` code.
3. Paste the entire content of [`Code.gs`](./Code.gs).
4. Rename the project: **TARAS 2K26 Payment Proof Upload**.

---

## Step 3 — Configure Script Properties

In the Apps Script editor:

1. Click **Project Settings** (gear icon on the left sidebar).
2. Scroll to **Script Properties** → click **Add script property**.
3. Add the following properties:

| Property | Value |
|---|---|
| `ROOT_FOLDER_ID` | The `Payment Proofs` folder ID from Step 1 |
| `FIREBASE_PROJECT_ID` | `taras-2k26` |
| `FIREBASE_WEB_API_KEY` | Your Firebase Web API Key (from Firebase Console → Project Settings → General → Web API Key) |

> **Important**: These values are stored server-side in Apps Script — they are **never** exposed to the browser.

---

## Step 4 — Deploy as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Configure:
   - **Description**: `TARAS 2K26 Payment Proof Upload v1`
   - **Execute as**: `Me` (the Google account that owns the Drive folder)
   - **Who has access**: `Anyone`
4. Click **Deploy**.
5. **Copy the Web App URL** (the `/exec` URL — NOT `/dev`).

> Example: `https://script.google.com/macros/s/AKfycb.../exec`

---

## Step 5 — Configure the TARAS Website

Update your `.env.local`:

```env
VITE_GOOGLE_DRIVE_WEBAPP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Rebuild and redeploy:

```bash
npm run build
firebase deploy --only hosting
```

---

## Step 6 — Grant Drive Access to the Review Team

The uploaded files are **private** by default (not public).

To allow the Registration Team / Admin to view payment proofs:

1. Open the `TARAS 2K26 / Payment Proofs` folder in Google Drive.
2. Click **Share**.
3. Add the Google accounts of:
   - TARAS Registration Team members
   - President / Admin
4. Set permission to **Viewer** (they can view but not modify).

> **Do NOT set "Anyone with the link can view"** unless explicitly required.

---

## Google Drive Folder Structure

```
TARAS 2K26/
└── Payment Proofs/
    ├── Paper-X-Verse Internal/
    │   └── TARAS2K26_TARAS26-XXX_UTRXXXXXX_PAY-TARAS-....jpg
    ├── Paper-X-Verse External/
    ├── Mysterio's Paradox/
    ├── Knull's Void/
    ├── Doc Ock's Clue Cartel/
    └── General/
```

Each file is named:
```
TARAS2K26_<registrationId>_<transactionId>_<paymentProofId>.<ext>
```

---

## File Size Policy

| Stage | Limit |
|---|---|
| Frontend input validation | 3 MB |
| Compression target | ~800 KB |
| Apps Script server validation | 2 MB (after compression) |

---

## Idempotency

Each upload uses `paymentProofId` (= `requestId`) as an idempotency key stored in `PropertiesService`. If the same `requestId` is received again:

- No new Drive file is created.
- The existing Drive metadata is returned immediately.

This protects against:
- Double-click
- Browser retry
- Network retry
- Page refresh

---

## Security Summary

| Concern | Protection |
|---|---|
| Unauthenticated uploads | Firebase ID token required and verified |
| Uploading to wrong registration | Firestore ownership check (uid / teamId match) |
| Arbitrary folder choice | Server-side folder routing only |
| File type forgery | MIME validation + extension mapping |
| Oversized files | Server-side byte count check |
| Duplicate uploads | `requestId` idempotency via PropertiesService |
| Credential exposure | All secrets in Script Properties (not in browser) |

---

## Troubleshooting

### Drive upload fails with `DRIVE_NOT_CONFIGURED`
- Check `VITE_GOOGLE_DRIVE_WEBAPP_URL` in `.env.local`.
- Ensure the URL ends with `/exec` not `/dev`.

### Drive upload fails with `UNAUTHORIZED`
- Firebase ID token is invalid or expired.
- User may need to sign out and sign back in.
- Check `FIREBASE_WEB_API_KEY` in Script Properties.

### Drive upload fails with `REGISTRATION_NOT_FOUND`
- `registrationId` does not exist in Firestore.
- The Firestore REST API must be accessible (no auth required for reading with proper rules).

### Drive upload fails with `REGISTRATION_OWNERSHIP_FAILED`
- The authenticated Firebase user does not own the registration.
- This is a security check — do not bypass it.

### Drive upload fails with `FILE_TOO_LARGE`
- The compressed image is still larger than the 2 MB server ceiling.
- Reduce compression quality or image dimensions in `imageCompression.ts`.

### Apps Script timeout
- The 30-second client timeout fired before Apps Script responded.
- Check Apps Script execution logs for slow operations.
- PropertiesService read/write is fast; Drive file creation on large files may be slow.

### Idempotency not working
- PropertiesService has a storage limit of ~500 KB total.
- If `requestId` keys accumulate, old ones may be evicted.
- For production, consider a Firestore-backed idempotency store.

### Payment proof not visible in Registration Dashboard
- The `driveFileUrl` must be set in Firestore (`paymentProof.driveFileUrl` or `paymentScreenshotUrl`).
- The viewing staff Google account must have been granted Drive access (Step 6 above).
- The Drive URL link opens in a new tab — staff must be signed in to Google with the authorized account.

---

## Updating the Apps Script

When you need to update the Apps Script code:

1. Make changes in the editor.
2. Click **Deploy → Manage deployments**.
3. Select the existing deployment → click the pencil (edit) icon.
4. Set **Version** to `New version`.
5. Click **Deploy**.

> Always redeploy for code changes to take effect. The `/exec` URL remains the same.
