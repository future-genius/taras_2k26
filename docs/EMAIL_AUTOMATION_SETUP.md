# TARAS 2K26 — 100% Free Automated Email System Setup & Operating Guide

This document explains the architecture, secret configuration, execution modes, daily limits, and troubleshooting procedures for the automated email system in **TARAS 2K26**.

---

## 1. System Architecture

The email automation operates **100% free** on the **Firebase Spark Plan** using GitHub Actions and Brevo Free Transactional Email API:

```
[Firestore: participants & registrations]
                   ↓
[GitHub Actions Scheduled Cron (Daily 07:30 AM IST) or workflow_dispatch]
                   ↓
[automation/email/send-emails.ts (Node.js/TypeScript Engine)]
                   ↓
  1. Enforce Daily Limit (default 250/day) below Brevo Free 300/day tier
  2. Check Idempotency via Firestore `email_deliveries/{deliveryId}`
  3. Render Cinematic HTML Template (Registration / Countdown)
                   ↓
[Brevo Transactional Email REST API (POST https://api.brevo.com/v3/smtp/email)]
                   ↓
  Update Firestore `email_deliveries` with delivery status ('sent' | 'failed')
```

---

## 2. Required GitHub Secrets

Configure these secrets in your GitHub Repository under **Settings → Secrets and variables → Actions → Repository secrets**:

| Secret Name | Description | Example / Required Format |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | **Required**. Firebase Admin SDK JSON private key. | Complete JSON string starting with `{"type": "service_account", ...}` |
| `BREVO_API_KEY` | **Required**. Brevo v3 Transactional Email API Key. | `xkeysib-...` |
| `BREVO_SENDER_EMAIL` | Optional (Default: `taras2k26@valliammai.edu.in`). Verified Brevo sender email. | `taras2k26@valliammai.edu.in` |
| `BREVO_SENDER_NAME` | Optional (Default: `TARAS 2K26 Team`). Sender display name. | `TARAS 2K26 Team` |

---

## 3. How to Obtain Credentials

### A. Firebase Service Account JSON
1. Open [Firebase Console](https://console.firebase.google.com/).
2. Select the **TARAS 2K26** project.
3. Go to **Project Settings** (gear icon) → **Service accounts**.
4. Click **Generate new private key**.
5. Open the downloaded `.json` file, copy its full content, and paste it into GitHub Secret `FIREBASE_SERVICE_ACCOUNT`.

### B. Brevo API Key
1. Create a free account at [Brevo (formerly Sendinblue)](https://www.brevo.com/).
2. Navigate to **SMTP & API Keys** → **API Keys**.
3. Generate a new v3 API key.
4. Copy the API key and add it to GitHub Secret `BREVO_API_KEY`.
5. Under **Senders & IP**, add and verify your sender email address (e.g. `taras2k26@valliammai.edu.in`).

---

## 4. Execution Modes & Manual Triggers

You can trigger the automation manually via **GitHub Actions tab → TARAS 2K26 Email Automation → Run workflow**.

### Execution Modes:
1. `dry_run` (**Default & Recommended First Run**):
   - Reads Firestore registrations & participants.
   - Calculates countdown triggers & daily quotas.
   - Prints detailed summary of what *would* be sent.
   - **Does NOT send real emails** and **does NOT modify Firestore**.

2. `test`:
   - Runs actual Firestore query & template generation logic.
   - **Sends all generated emails exclusively to `test_email`** (e.g. your personal/admin email).
   - Allows verifying email appearance and formatting safely before production release.

3. `production`:
   - Sends real emails to registered participants via Brevo.
   - Records delivery history in `email_deliveries/{deliveryId}` to enforce strict idempotency.

---

## 5. Daily Limit & Countdown Reminders

### Brevo Daily Limit Protection
Brevo Free provides 300 free transactional emails per day.
- System default limit: `EMAIL_DAILY_LIMIT=250` (leaves safety margin).
- If total eligible emails exceed 250, the script sends 250 emails and automatically postpones remaining emails to the next scheduled run.
- No duplicate emails will ever be sent because `email_deliveries` tracks every delivered ID.

### Countdown Reminder Schedule
Calculated in Indian Standard Time (`Asia/Kolkata`) relative to **26 September 2026**:
- **7 Days To Go**: Active from Sept 19, 2026.
- **3 Days To Go**: Active from Sept 23, 2026.
- **1 Day To Go**: Active from Sept 25, 2026.
- **0 Days To Go (Event Day)**: Active on Sept 26, 2026.

---

## 6. Local Testing & Commands

You can run dry runs or local tests from your terminal:

```bash
# Navigate to automation directory
cd automation/email

# Install dependencies
npm install

# Run Dry Run
EMAIL_DRY_RUN=true npx tsx send-emails.ts

# Run Test Mode (sending test email to admin)
EMAIL_TEST_MODE=true TEST_EMAIL=admin@example.com BREVO_API_KEY=xkeysib-xxx npx tsx send-emails.ts
```

---

## 7. Troubleshooting

- **"Daily limit reached"**: The script completed its daily allocation safely. Unsent emails will be sent on the next run.
- **"FIREBASE_SERVICE_ACCOUNT not configured"**: Ensure the raw JSON string is pasted into GitHub Secrets without extra surrounding quotes.
- **"HTTP 401 / Invalid API Key"**: Verify `BREVO_API_KEY` in GitHub Secrets.
- **"Sender not authorized"**: Ensure `BREVO_SENDER_EMAIL` is verified in Brevo Dashboard under Senders.
