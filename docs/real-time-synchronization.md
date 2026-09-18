# TARAS 2K26 — Real-Time Data Synchronization Architecture

## 1. Core Synchronization Principle

TARAS 2K26 operates on a single authoritative data pipeline:

```text
Firestore & Firebase Auth (Canonical Source of Truth)
                      ↓
Shared Service Real-Time Listeners (onSnapshot / subscribeCollection)
                      ↓
React Context & Custom Hooks
                      ↓
Real-Time Reactive UI (Participant, Registration, Coordinator, President & Admin)
```

No local state, `localStorage`, or in-memory arrays serve as authoritative persistent business data.

---

## 2. Data Model & Firestore Collections

| Collection | Canonical Document Key | Responsible Service | Real-Time Listeners |
| :--- | :--- | :--- | :--- |
| `participants` | `{uid}` | `AuthContext`, `runAtomicVenueCheckIn` | `AuthContext`, `RegistrationDashboard`, `PresidentControlPage` |
| `registrations` | `REG-{eventId}-{participantId}` | `eventRegistrationService`, `runAtomicEventCheckIn` | `ParticipantDashboard`, `RegistrationDashboard`, `EventControlConsole`, `PresidentControlPage` |
| `teams` | `TEAM-{teamCode}` | `teamService` | `TeamHub`, `EventControlConsole`, `PresidentControlPage` |
| `team_join_requests` | `REQ-{teamId}-{participantId}` | `teamService` | `ParticipantDashboard`, `TeamHub` |
| `event_checkins` | `EVCHK-{eventId}-{round}-{uid}` | `runAtomicEventCheckIn` | `EventControlConsole`, `PresidentControlPage` |
| `round1_results` | `R1-{eventId}-{teamId}` | `saveTeamRound1Result` | `EventControlConsole`, `ResultsPage`, `PresidentControlPage` |
| `round2_results` | `R2-{eventId}-{teamId}` | `saveTeamRound2Result` | `EventControlConsole`, `ResultsPage`, `PresidentControlPage` |
| `announcements` | `{announcementId}` | `AnnouncementManagementPage` | `AnnouncementsPage`, `LiveAnnouncementWidget` |
| `audit_logs` | `{autoId}` | System Audit Logger | `AuditLogPage`, `PresidentControlPage` |

---

## 3. Stage Progression State Machine

```text
1. REGISTRATION (Participant creates PENDING / PENDING_PAYMENT registration)
      ↓
2. PAYMENT VERIFICATION (Registration Desk approves -> CONFIRMED / VERIFIED)
      ↓
3. GATE ENTRY (Registration Desk scans QR pass -> venueCheckIn = true)
      ↓
4. ROUND 1 SCAN (Assigned Event Coordinator scans pass -> round1Scanned = true)
      ↓
5. ROUND 1 OUTCOME (Assigned Event Coordinator marks SELECTED / NOT_SELECTED)
      ↓
6. ROUND 2 SCAN (Assigned Event Coordinator scans SELECTED pass -> round2Scanned = true)
      ↓
7. FINAL RESULT (Assigned Event Coordinator marks WINNER / RUNNER_UP / NOT_SELECTED)
```

---

## 4. Role-Based Scoping & Security Boundaries

1. **Participant**:
   - Access: Own profile (`/participants/{uid}`), own registrations (`/registrations`), public events, announcements, and results.
2. **Registration Desk Staff**:
   - Access: Ground floor Gate Entry scanner, Payment Verification console, all participant registrations.
3. **Event Coordinator**:
   - Access: Assigned event track console ONLY. Round 1 / Round 2 scanners and outcome evaluation engine.
4. **President & Super Admin**:
   - Access: System-wide operational dashboard, analytics, real-time counters, auditor log, and master override capabilities.
