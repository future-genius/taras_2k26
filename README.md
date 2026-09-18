# 🚀 TARAS 2K26 — National Technical Symposium Platform

Welcome to the **TARAS 2K26** codebase! This repository powers the web platform for the TARAS 2K26 National Level Technical Symposium hosted by the Department of Electronics & Communication Engineering (ECE).

The system handles end-to-end symposium operations: user authentication, digital pass generation, squad (team) formation, event registrations, payment verification, real-time coordinator consoles, and presidential control dashboards.

---

## 🛠️ Technology Stack

- **Frontend Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), Custom Glassmorphism UI, [Framer Motion](https://www.framer.com/motion/)
- **Icons & Assets**: [Lucide React](https://lucide.dev/), QR Code Generator (`qrcode.react`), QR Scanner (`jsqr`)
- **Backend & Database**: [Firebase Web SDK v12](https://firebase.google.com/)
  - **Firebase Authentication**: Email/password authentication, custom session state.
  - **Cloud Firestore**: Real-time NoSQL database with atomic transactions and live snapshots.
  - **Firebase Hosting**: High-performance static web hosting.
- **Document Utilities**: `jspdf`, `html2canvas` (Digital pass download & certificate generation), `xlsx` (Excel roster exports).

---

## 🔐 Role-Based Access Control (RBAC)

The application enforces 5 distinct operational roles defined in Cloud Firestore (`participants/{uid}.role`):

1. **`super_admin` / `PRESIDENT`**: Full presidential system authority across all events, teams, audit logs, and settings.
2. **`admin`**: Administrative control over event management, announcements, results publishing, and staff assignments.
3. **`registration_staff` / `staff`**: Operational access to verify/reject UTR payment proofs, process manual registrations, and perform gate check-ins.
4. **`coordinator` / `EVENT_HEAD`**: Event-isolated control console access ONLY for assigned event tracks to evaluate Round 1 and Round 2 results.
5. **`participant`**: Standard user profile eligible to create/join squads, register for symposium tracks, and view digital passes.

---

## 🧩 Core Architecture & Key Modules

```
                        ┌──────────────────────────────┐
                        │   Participant Sign-Up/In     │
                        └──────────────┬───────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │    Participant Digital Pass  │
                        │     (Unique TARAS Pass ID)   │
                        └──────────────┬───────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SQUAD MANAGEMENT HUB                            │
│  - Create Squad → Generates unique code (e.g. TR-A7K92)                    │
│  - Join Squad → Pending request sent to Captain                             │
│  - Captain Approves/Rejects member join requests                            │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EVENT REGISTRATION WIZARD                          │
│  - Select Event (Paper Presentation, Circuit Debugging, Hackathons, etc.)   │
│  - Internal (SRM VEC) ₹0 Free Entry vs External ₹200/member Fee             │
│  - Submit UTR Payment Proof                                                 │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REAL-TIME ADMIN & STAFF PIPELINE                      │
│                                                                             │
│  ┌────────────────────────┐ ┌───────────────────────┐ ┌───────────────────┐  │
│  │ Registration Staff Desk│ │   Event Coordinators  │ │ President Control │  │
│  │ Verifies UTR Payment   │ │ Marks Round 1 & 2     │ │ Live Overview     │  │
│  └────────────────────────┘ └───────────────────────┘ └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Squad (Team) System (`src/services/teamService.ts`)
- **Event-Independent Squad Creation**: Participants create squads independent of event selection first.
- **Unique Code Generator**: Generates collision-free 6-character squad codes (e.g., `TR-A7K92`).
- **Atomic Join Workflows**: Joining a team creates a `PENDING` request in `/team_join_requests`. Captains approve/reject using Firestore atomic transactions.
- **Payment Lock**: Once event payment is verified, team composition is locked to prevent adding extra unpaid members.

### 2. Event Registration & Payments (`src/services/eventRegistrationService.ts`)
- **UTR Registry**: Every transaction UTR number is registered in `/utr_registry/{utr}` to guarantee global uniqueness and prevent duplicate submissions.
- **Verification Desk**: Staff verify UTR proof screenshots, updating the registration status to `CONFIRMED`.

### 3. Real-Time Synchronization (`src/config/firebase.ts`)
- All major dashboards subscribe to live Firestore snapshots via `db.subscribeCollection()` or `onSnapshot()`, eliminating manual page reloads.

---

## 📁 Project Directory Structure

```
taras_2k26/
├── firestore.rules          # Production Cloud Firestore Security Rules
├── firebase.json            # Firebase CLI deployment configuration
├── index.html               # Entry HTML template
├── package.json             # Package dependencies and npm scripts
├── src/
│   ├── components/          # UI Components
│   │   ├── admin/           # Admin navigation, audit logs, staff management
│   │   ├── common/          # Reusable UI primitives (Button, Badge, Modal)
│   │   ├── coordinator/     # Event-isolated coordinator control console
│   │   ├── events/          # Event cards, event grid, event filters
│   │   ├── president/       # Live presidential overview widgets
│   │   ├── registration/    # Registration wizard & pamphlet modals
│   │   ├── team/            # Squad creation, join requests, Team Hub
│   │   └── visual/          # Atmospheric themes, Spider-Man visual effects
│   ├── config/
│   │   └── firebase.ts      # Firebase init, Firestore helper wrappers (`db`)
│   ├── context/
│   │   └── AuthContext.tsx  # Authentication provider & RBAC state management
│   ├── data/
│   │   ├── events.ts        # Technical & Non-Technical event metadata
│   │   └── team.ts          # Team constants & helper definitions
│   ├── pages/               # Route pages
│   │   ├── Home.tsx         # Landing page
│   │   ├── EventsHub.tsx    # Events catalogue page
│   │   ├── EventDetail.tsx  # Detailed event track view
│   │   ├── admin/           # President, Registration, Announcement dashboards
│   │   └── participant/     # Participant dashboard, Digital Pass, My Events
│   ├── services/            # Business Logic & Firestore API integrations
│   │   ├── teamService.ts   # Squad transactions, codes, approvals
│   │   ├── paymentService.ts# UTR verification & payment workflow
│   │   └── excelExportService.ts # Excel export engine for registrations
│   ├── types/               # TypeScript interface definitions
│   └── utils/               # College registration logic & formatting helpers
└── vite.config.ts           # Vite bundler configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Firebase CLI**: Installed globally (`npm install -g firebase-tools`)

### 2. Installation
Clone the repository and install dependencies:
```bash
cd taras_2k26
npm install
```

### 3. Local Development Server
Start the Vite development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Type Checking & Production Build
To check TypeScript types and build the production distribution bundle:
```bash
# Type check without emitting files
npx tsc --noEmit

# Build production bundle to /dist
npm run build
```

---

## 📦 Deployment Commands

### Deploy Security Rules to Cloud Firestore
To update live database security rules without touching web hosting:
```bash
npx firebase-tools deploy --only firestore:rules
```

### Deploy Web Application to Firebase Hosting
To deploy the compiled `/dist` build to Firebase Hosting:
```bash
npm run build
npx firebase-tools deploy --only hosting
```

---

## 🛡️ Security Guidelines for Developers

1. **Never Bypass Firestore Security Rules**: All client database writes must adhere strictly to `firestore.rules`.
2. **Use Transactions for Roster & State Changes**: Always use Firestore `runTransaction()` for squad updates, join approvals, and payment verifications to prevent race conditions.
3. **Keep Operational Roles Secure**: Role promotion (e.g. promoting a user to `admin` or `super_admin`) is strictly guarded in `firestore.rules` and cannot be self-assigned by participants.

---

## 👥 Support & Contribution

For technical queries, bug reports, or feature requests regarding the **TARAS 2K26** platform, please coordinate with the lead development team or refer to the internal documentation.
