/**
 * TARAS 2K26 — Firebase Configuration & Data Adapter
 *
 * Real Firebase implementation.
 *
 * Services:
 * - Firebase Authentication
 * - Cloud Firestore
 * - Firebase Storage
 *
 * This file preserves the existing Phase 2 API so existing components
 * can continue using:
 *
 *   db.setDoc()
 *   db.getDoc()
 *   db.updateDoc()
 *   db.queryWhere()
 *
 * and:
 *
 *   signUpWithEmail()
 *   signInWithEmail()
 *   sendPasswordReset()
 *   signOutUser()
 *   getSessionUser()
 *   saveSessionUser()
 */

import { initializeApp } from "firebase/app";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import {
  getFirestore,
  doc,
  setDoc as firestoreSetDoc,
  getDoc as firestoreGetDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  addDoc as firestoreAddDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  getDocs,
  getCountFromServer,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { EventRegistration } from "../types/registration";
import type { EventTeam, RegistrationTeamMember, TeamJoinRequest } from "../types/team";
import type {
  EventCheckIn,
  Scorecard,
  EventResult,
  CertificateRecord,
  AuditLog,
  AuditAction,
  EventAttendanceRound,
} from "../types/eventDay";

import { getStorage } from "firebase/storage";

// ─────────────────────────────────────────────────────────────────────────────
// Firebase Configuration
// ─────────────────────────────────────────────────────────────────────────────
//
// IMPORTANT:
// Firebase configuration is read from Vite environment variables.
//
// Create a .env.local file in the project root:
//
// VITE_FIREBASE_API_KEY=YOUR_API_KEY
// VITE_FIREBASE_AUTH_DOMAIN=taras-2k26.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=taras-2k26
// VITE_FIREBASE_STORAGE_BUCKET=taras-2k26.firebasestorage.app
// VITE_FIREBASE_MESSAGING_SENDER_ID=633606057179
// VITE_FIREBASE_APP_ID=1:633606057179:web:e9352a2805b028566df0fe
//
// Do NOT put Firebase Admin SDK credentials/service-account private keys here.
//

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ─────────────────────────────────────────────────────────────────────────────
// Validate Firebase configuration
// ─────────────────────────────────────────────────────────────────────────────

const requiredFirebaseConfig = [
  ["VITE_FIREBASE_API_KEY", firebaseConfig.apiKey],
  ["VITE_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
  ["VITE_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
  ["VITE_FIREBASE_STORAGE_BUCKET", firebaseConfig.storageBucket],
  ["VITE_FIREBASE_MESSAGING_SENDER_ID", firebaseConfig.messagingSenderId],
  ["VITE_FIREBASE_APP_ID", firebaseConfig.appId],
] as const;

const missingFirebaseConfig = requiredFirebaseConfig
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingFirebaseConfig.length > 0) {
  console.error(
    "TARAS 2K26 Firebase configuration is incomplete. Missing:",
    missingFirebaseConfig.join(", ")
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Firebase
// ─────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);

// Firebase services

export const auth = getAuth(app);

/** Raw Cloud Firestore instance — use `db` (the TARAS adapter) for application code. */
export const firestore = getFirestore(app);

export const storage = getStorage(app);

export default app;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  uid: string;
  email: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Firebase User → TARAS Auth User
// ─────────────────────────────────────────────────────────────────────────────

function mapFirebaseUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email ?? "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore Data Sanitization
// ─────────────────────────────────────────────────────────────────────────────
//
// Existing TARAS components may pass undefined values.
//
// Firestore does not accept undefined values by default.
// Remove undefined recursively before writing.
//

function removeUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefined(item)) as T;
  }

  if (
    value !== null &&
    typeof value === "object" &&
    !(value instanceof Date)
  ) {
    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(
      value as Record<string, unknown>
    )) {
      if (item !== undefined) {
        result[key] = removeUndefined(item);
      }
    }

    return result as T;
  }

  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore Database Adapter
// ─────────────────────────────────────────────────────────────────────────────
//
// This preserves the original Phase 2 API:
//
// db.setDoc()
// db.getDoc()
// db.updateDoc()
// db.queryWhere()
//
// but now uses REAL Cloud Firestore.
//

export const database = {
  /**
   * Create or completely replace a Firestore document.
   */
  async setDoc(
    col: string,
    docId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const cleanedData = removeUndefined(data);

    await firestoreSetDoc(
      doc(firestore, col, docId),
      {
        ...cleanedData,
        updatedAt: serverTimestamp(),
      },
      {
        merge: false,
      }
    );
  },

  /**
   * Retrieve a Firestore document.
   */
  async getDoc(
    col: string,
    docId: string
  ): Promise<{
    exists: boolean;
    data: Record<string, unknown> | null;
  }> {
    const snapshot = await firestoreGetDoc(doc(firestore, col, docId));

    if (!snapshot.exists()) {
      return {
        exists: false,
        data: null,
      };
    }

    return {
      exists: true,
      data: snapshot.data() as Record<string, unknown>,
    };
  },

  /**
   * Update selected fields of an existing Firestore document.
   */
  async updateDoc(
    col: string,
    docId: string,
    partial: Record<string, unknown>
  ): Promise<void> {
    const cleanedData = removeUndefined(partial);

    await firestoreUpdateDoc(doc(firestore, col, docId), {
      ...cleanedData,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Query documents where a field equals a specific value.
   */
  async queryWhere(
    col: string,
    field: string,
    value: unknown
  ): Promise<Record<string, unknown>[]> {
    const collectionRef = collection(firestore, col);

    const q = query(collectionRef, where(field, "==", value));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  },

  /**
   * Retrieve all documents in a collection.
   */
  async getCollection(col: string): Promise<Record<string, unknown>[]> {
    const collectionRef = collection(firestore, col);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  },

  /**
   * Delete a document in a collection.
   */
  async deleteDoc(col: string, docId: string): Promise<void> {
    await firestoreDeleteDoc(doc(firestore, col, docId));
  },

  /**
   * Add a new document with an auto-generated ID.
   */
  async addDoc(col: string, data: Record<string, unknown>): Promise<string> {
    const cleanedData = removeUndefined(data);
    const docRef = await firestoreAddDoc(collection(firestore, col), {
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Real-time subscription to a single document.
   * Calls callback with document data and existence boolean whenever document changes.
   * Returns unsubscribe function.
   */
  subscribeDoc(
    col: string,
    docId: string,
    callback: (data: Record<string, unknown> | null, exists: boolean) => void
  ): () => void {
    const docRef = doc(firestore, col, docId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as Record<string, unknown>, true);
        } else {
          callback(null, false);
        }
      },
      (error) => {
        console.warn(`[Firestore subscribeDoc error on ${col}/${docId}]:`, error.message);
      }
    );
  },

  /**
   * Real-time subscription to an entire collection.
   * Calls callback with array of document data whenever any document in collection changes.
   * Returns unsubscribe function.
   */
  subscribeCollection(
    col: string,
    callback: (docs: Record<string, unknown>[]) => void
  ): () => void {
    const collectionRef = collection(firestore, col);
    return onSnapshot(
      collectionRef,
      (snapshot) => {
        const docs = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        callback(docs);
      },
      (error) => {
        console.warn(`[Firestore subscribeCollection error on ${col}]:`, error.message);
      }
    );
  },

  /**
   * Real-time subscription to a query where a field equals a specific value.
   * Returns unsubscribe function.
   */
  subscribeQuery(
    col: string,
    field: string,
    value: unknown,
    callback: (docs: Record<string, unknown>[]) => void
  ): () => void {
    const collectionRef = collection(firestore, col);
    const q = query(collectionRef, where(field, "==", value));
    return onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        callback(docs);
      },
      (error) => {
        console.warn(`[Firestore subscribeQuery error on ${col}.${field}==${value}]:`, error.message);
      }
    );
  },

  /**
   * Paginated collection fetch to prevent downloading high-volume collections into memory.
   */
  async getPaginatedCollection(
    col: string,
    pageSize = 50,
    lastDocSnap: QueryDocumentSnapshot<DocumentData> | null = null
  ): Promise<{
    docs: Record<string, unknown>[];
    lastSnapshot: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }> {
    const collectionRef = collection(firestore, col);
    let q = query(collectionRef, limit(pageSize));

    if (lastDocSnap) {
      q = query(collectionRef, startAfter(lastDocSnap), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    const lastSnap = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      docs,
      lastSnapshot: lastSnap,
      hasMore: snapshot.docs.length === pageSize,
    };
  },

  /**
   * Paginated query with limit.
   */
  async queryWherePaginated(
    col: string,
    field: string,
    value: unknown,
    pageSize = 50,
    lastDocSnap: QueryDocumentSnapshot<DocumentData> | null = null
  ): Promise<{
    docs: Record<string, unknown>[];
    lastSnapshot: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }> {
    const collectionRef = collection(firestore, col);
    let q = query(collectionRef, where(field, "==", value), limit(pageSize));

    if (lastDocSnap) {
      q = query(collectionRef, where(field, "==", value), startAfter(lastDocSnap), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    const lastSnap = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      docs,
      lastSnapshot: lastSnap,
      hasMore: snapshot.docs.length === pageSize,
    };
  },

  /**
   * Fast server-side count aggregation query (reads 0 document payloads, returns exact total count).
   */
  async getCollectionCount(col: string, field?: string, value?: unknown): Promise<number> {
    const collectionRef = collection(firestore, col);
    const q = field && value !== undefined ? query(collectionRef, where(field, "==", value)) : query(collectionRef);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  /**
   * Real-time subscription to a collection capped with a limit to avoid unbounded data streams.
   */
  subscribeQueryLimited(
    col: string,
    limitCount = 50,
    callback: (docs: Record<string, unknown>[]) => void
  ): () => void {
    const collectionRef = collection(firestore, col);
    const q = query(collectionRef, limit(limitCount));
    return onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        callback(docs);
      },
      (error) => {
        console.warn(`[Firestore subscribeQueryLimited error on ${col}]:`, error.message);
      }
    );
  },
};

/**
 * TARAS database adapter — THIS is what AuthContext and all application code imports.
 *
 * API:
 *   db.setDoc(collection, docId, data)
 *   db.getDoc(collection, docId)
 *   db.updateDoc(collection, docId, partial)
 *   db.queryWhere(collection, field, value)
 */
export const db = database;

// Also export under legacy alias names for any future use.
export const firestoreDb = database;
export const tarasDb = database;



// ─────────────────────────────────────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a participant account using Firebase Authentication.
 *
 * IMPORTANT:
 * Passwords are NEVER stored manually.
 * Firebase Authentication handles password security.
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    return mapFirebaseUser(credential.user);
  } catch (error: unknown) {
    throw normalizeFirebaseAuthError(error);
  }
}

/**
 * Sign in using Firebase Authentication.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    return mapFirebaseUser(credential.user);
  } catch (error: unknown) {
    throw normalizeFirebaseAuthError(error);
  }
}

/**
 * Send Firebase password-reset email.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    await sendPasswordResetEmail(auth, normalizedEmail);
  } catch (error: unknown) {
    throw normalizeFirebaseAuthError(error);
  }
}

/**
 * Sign out the current Firebase user.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Get the currently authenticated Firebase user.
 *
 * This is synchronous and may return null while Firebase is initializing.
 *
 * For reactive authentication state, use `onAuthStateChanged`.
 */
export function getSessionUser(): AuthUser | null {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  return mapFirebaseUser(user);
}

/**
 * Compatibility function.
 *
 * Firebase Authentication itself manages the authentication session.
 *
 * This function intentionally does NOT write credentials or passwords
 * into localStorage.
 */
export function saveSessionUser(_user: AuthUser): void {
  // Firebase Auth automatically persists the authenticated session.
  // No localStorage authentication data is required.
}

/**
 * Subscribe to Firebase authentication state changes.
 *
 * Useful for React auth providers/context.
 */
export function subscribeToAuthState(
  callback: (user: AuthUser | null) => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? mapFirebaseUser(user) : null);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Firebase Authentication Error Handling
// ─────────────────────────────────────────────────────────────────────────────

function normalizeFirebaseAuthError(error: unknown): Error {
  const firebaseError = error as {
    code?: string;
    message?: string;
  };

  switch (firebaseError.code) {
    case "auth/email-already-in-use":
      return new Error(
        "An account with this email already exists."
      );

    case "auth/invalid-email":
      return new Error(
        "Please enter a valid email address."
      );

    case "auth/weak-password":
      return new Error(
        "Password is too weak. Please choose a stronger password."
      );

    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return new Error(
        "Invalid email or password. Please try again."
      );

    case "auth/too-many-requests":
      return new Error(
        "Too many attempts. Please wait a moment and try again."
      );

    case "auth/network-request-failed":
      return new Error(
        "Network error. Please check your internet connection and try again."
      );

    case "auth/operation-not-allowed":
      return new Error(
        "Email/password authentication is not enabled in Firebase Authentication."
      );

    default:
      return new Error(
        firebaseError.message ||
        "Authentication failed. Please try again."
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the current Firebase UID.
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

/**
 * Check whether a user is currently authenticated.
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Create a Firestore server timestamp field.
 *
 * Can be used by other services when creating records.
 */
export function firestoreServerTimestamp() {
  return serverTimestamp();
}

// ─────────────────────────────────────────────────────────────────────────────
// Atomic Firestore Transaction Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Atomically creates an event registration and updates the participant profile.
 * Prevents race conditions, double-registrations, and partial writes.
 */
export async function runAtomicRegistration(
  uid: string,
  participantId: string,
  eventId: string,
  eventName: string,
  category: EventRegistration['category'],
  isTeamEvent: boolean,
  teamId?: string
): Promise<EventRegistration> {
  const regId = `REG-${eventId}-${participantId}`;
  const regRef = doc(firestore, 'registrations', regId);
  const participantRef = doc(firestore, 'participants', uid);
  const eventRef = doc(firestore, 'events', eventId);

  return await runTransaction(firestore, async (transaction) => {
    // Read 1: Existing registration doc check
    const regDoc = await transaction.get(regRef);
    if (regDoc.exists()) {
      throw new Error('You are already registered for this event.');
    }

    // Read 2: Event status and capacity check
    const eventDoc = await transaction.get(eventRef);
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();
      if (eventData.registrationOpen === false) {
        throw new Error('Event registration is closed.');
      }
      const maxCap = eventData.maxCapacity || eventData.capacity;
      const currentCount = typeof eventData.registeredCount === 'number' ? eventData.registeredCount : 0;
      if (maxCap && currentCount >= maxCap) {
        throw new Error(`Event "${eventName}" has reached maximum capacity (${maxCap} seats filled).`);
      }
    }

    // Read 3: Participant profile check
    const partDoc = await transaction.get(participantRef);
    if (!partDoc.exists()) {
      throw new Error('Participant profile not found. Please log in again.');
    }
    const partData = partDoc.data();
    const registeredEvents = (partData.registeredEvents as string[]) || [];
    if (registeredEvents.includes(eventId)) {
      throw new Error('You are already registered for this event.');
    }

    const now = new Date().toISOString();
    const newReg: EventRegistration = {
      registrationId: regId,
      participantId,
      uid,
      eventId,
      eventName,
      category,
      isTeamEvent,
      teamId,
      status: 'PAYMENT_VERIFICATION_PENDING',
      paymentStatus: 'PENDING',
      feeAmount: 200,
      registeredAt: now,
      venueCheckInRequired: true,
      eventAttendance: 'NOT_MARKED',
      shortlistStatus: 'NOT_EVALUATED',
      certificateEligible: false,
    };

    const updatedEvents = Array.from(new Set([...registeredEvents, eventId]));
    const currentTeamIds = (partData.teamIds as string[]) || [];
    const updatedTeamIds = teamId ? Array.from(new Set([...currentTeamIds, teamId])) : currentTeamIds;

    // Writes: Registration doc + Participant doc update + Event capacity increment
    transaction.set(regRef, {
      ...newReg,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(participantRef, {
      registeredEvents: updatedEvents,
      teamIds: updatedTeamIds,
      updatedAt: serverTimestamp(),
    });

    if (eventDoc.exists()) {
      const currentCount = typeof eventDoc.data().registeredCount === 'number' ? eventDoc.data().registeredCount : 0;
      transaction.update(eventRef, {
        registeredCount: currentCount + 1,
        updatedAt: serverTimestamp(),
      });
    }

    return newReg;
  });
}

/**
 * Verifies that a team name is unique globally (case-insensitive).
 */
export async function verifyUniqueTeamName(teamName: string, excludeTeamId?: string): Promise<void> {
  const normalized = teamName.trim().toLowerCase();
  if (!normalized) {
    throw new Error('Team name cannot be empty.');
  }

  const snap = await getDocs(collection(firestore, 'teams'));

  for (const docSnap of snap.docs) {
    const data = docSnap.data() as EventTeam;
    if (excludeTeamId && data.teamId === excludeTeamId) continue;
    if (data.teamName && data.teamName.trim().toLowerCase() === normalized) {
      throw new Error(`Team name "${teamName.trim()}" is already taken. Please choose a unique team name.`);
    }
  }
}

/**
 * Atomically renames a team after verifying leadership and unique team name.
 */
export async function runAtomicRenameTeam(
  leaderUid: string,
  teamId: string,
  newTeamName: string
): Promise<EventTeam> {
  const trimmed = newTeamName.trim();
  if (!trimmed) throw new Error('Team name cannot be empty.');

  const teamRef = doc(firestore, 'teams', teamId);
  const teamSnap = await firestoreGetDoc(teamRef);
  if (!teamSnap.exists()) {
    throw new Error('Team not found.');
  }

  const teamData = teamSnap.data() as EventTeam;
  if (teamData.leaderUid !== leaderUid) {
    throw new Error('Only the team captain can rename the team.');
  }

  await verifyUniqueTeamName(trimmed, teamId);

  const batch = writeBatch(firestore);
  const now = new Date().toISOString();

  batch.update(teamRef, {
    teamName: trimmed,
    updatedAt: now,
  });

  if (teamData.eventId) {
    for (const m of teamData.members) {
      const regRef = doc(firestore, 'registrations', `REG-${teamData.eventId}-${m.participantId}`);
      batch.update(regRef, {
        teamName: trimmed,
        updatedAt: now,
      });
    }
  }

  await batch.commit();

  return { ...teamData, teamName: trimmed, updatedAt: now };
}

/**
 * Atomically removes a non-captain member from a team and deletes their registration record.
 * Only the team leader can perform member removal.
 */
export async function runAtomicRemoveMember(
  leaderUid: string,
  teamId: string,
  targetMemberUid: string,
  targetParticipantId: string
): Promise<EventTeam> {
  const teamRef = doc(firestore, 'teams', teamId);
  const partRef = doc(firestore, 'participants', targetMemberUid);
  const reqRef = doc(firestore, 'team_join_requests', `REQ-${teamId}-${targetParticipantId}`);

  return await runTransaction(firestore, async (transaction) => {
    // ── ALL READS MUST OCCUR BEFORE ANY WRITES ──
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists()) {
      throw new Error('Team not found.');
    }

    const teamData = teamSnap.data() as EventTeam;
    if (teamData.leaderUid !== leaderUid) {
      throw new Error('Only the team captain can remove members from the team.');
    }

    if (targetMemberUid === leaderUid) {
      throw new Error('Captain cannot be removed. To delete the team, use Disband Team.');
    }

    if (!teamData.memberUids.includes(targetMemberUid)) {
      throw new Error('Target participant is not a member of this team.');
    }

    const regRef = doc(firestore, 'registrations', `REG-${teamData.eventId}-${targetParticipantId}`);
    const regSnap = await transaction.get(regRef);
    const partSnap = await transaction.get(partRef);
    const reqSnap = await transaction.get(reqRef);

    // ── ALL WRITES OCCUR HERE ──
    const updatedMemberUids = teamData.memberUids.filter((id) => id !== targetMemberUid);
    const updatedMembers = teamData.members.filter((m) => m.uid !== targetMemberUid);
    const now = new Date().toISOString();
    const updatedStatus = updatedMembers.length >= teamData.minTeamSize ? 'CONFIRMED' : 'FORMING';

    const updatedTeam: EventTeam = {
      ...teamData,
      memberUids: updatedMemberUids,
      members: updatedMembers,
      status: updatedStatus,
      updatedAt: now,
    };

    // 1. Update Team document
    transaction.update(teamRef, {
      memberUids: updatedMemberUids,
      members: updatedMembers,
      status: updatedStatus,
      updatedAt: serverTimestamp(),
    });

    // 2. Delete member's registration
    if (regSnap.exists()) {
      transaction.delete(regRef);
    }

    // 3. Update member's participant profile
    if (partSnap.exists()) {
      const pData = partSnap.data();
      const registeredEvents = ((pData.registeredEvents as string[]) || []).filter((id) => id !== teamData.eventId);
      const teamIds = ((pData.teamIds as string[]) || []).filter((id) => id !== teamId);
      transaction.update(partRef, {
        registeredEvents,
        teamIds,
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Update join request if exists
    if (reqSnap.exists()) {
      transaction.update(reqRef, {
        status: 'REJECTED',
        reviewedAt: now,
        reviewedBy: leaderUid,
        updatedAt: serverTimestamp(),
      });
    }

    return updatedTeam;
  });
}

/**
 * Atomically disbands and deletes a team, deleting all member registrations for the event
 * and updating member participant profiles. Only the team captain can disband the team.
 */
export async function runAtomicDisbandTeam(
  leaderUid: string,
  teamId: string
): Promise<{ success: boolean; message: string }> {
  const teamRef = doc(firestore, 'teams', teamId);
  const teamSnap = await firestoreGetDoc(teamRef);
  if (!teamSnap.exists()) {
    throw new Error('Team not found.');
  }
  const teamData = teamSnap.data() as EventTeam;
  if (teamData.leaderUid !== leaderUid) {
    throw new Error('Only the team captain can disband this squad.');
  }

  // Check lifecycle status restriction
  const allowedStatuses = ['FORMING', 'CONFIRMED', 'READY'];
  if (teamData.status && !allowedStatuses.includes(teamData.status)) {
    throw new Error(`Cannot disband squad in status "${teamData.status}".`);
  }

  // Pre-fetch join requests for this team
  let teamPendingReqs: TeamJoinRequest[] = [];
  try {
    const joinReqs = await getTeamJoinRequestsForLeader(leaderUid);
    teamPendingReqs = joinReqs.filter((r) => r.teamId === teamId);
  } catch (err) {
    console.warn('Error fetching join requests for disband:', err);
  }

  const memberUids = teamData.members.map((m) => m.uid);
  const memberRegIds = teamData.members.map((m) => `REG-${teamData.eventId}-${m.participantId}`);

  return await runTransaction(firestore, async (transaction) => {
    // ── 1. ALL READS FIRST (Strictly Sequential) ──
    const tSnap = await transaction.get(teamRef);
    if (!tSnap.exists()) {
      throw new Error('Team not found.');
    }

    const pSnaps = [];
    for (const mUid of memberUids) {
      const pSnap = await transaction.get(doc(firestore, 'participants', mUid));
      pSnaps.push(pSnap);
    }

    const rSnaps = [];
    for (const rId of memberRegIds) {
      const rSnap = await transaction.get(doc(firestore, 'registrations', rId));
      rSnaps.push(rSnap);
    }

    const qSnaps = [];
    for (const qReq of teamPendingReqs) {
      const qSnap = await transaction.get(doc(firestore, 'team_join_requests', qReq.requestId));
      qSnaps.push(qSnap);
    }

    // ── 2. ALL WRITES SECOND (Clean registrations & join requests BEFORE deleting team) ──
    // A. Delete member registrations first (while team doc still exists)
    rSnaps.forEach((rSnap, i) => {
      if (rSnap.exists()) {
        transaction.delete(doc(firestore, 'registrations', memberRegIds[i]));
      }
    });

    // B. Clean up pending join requests
    const now = new Date().toISOString();
    qSnaps.forEach((qSnap, i) => {
      if (qSnap.exists()) {
        transaction.update(doc(firestore, 'team_join_requests', teamPendingReqs[i].requestId), {
          status: 'REJECTED',
          reviewedAt: now,
          reviewedBy: leaderUid,
          updatedAt: serverTimestamp(),
        });
      }
    });

    // C. Update member profiles
    pSnaps.forEach((pSnap, i) => {
      if (pSnap.exists()) {
        const pData = pSnap.data();
        const registeredEvents = ((pData.registeredEvents as string[]) || []).filter((evId) => evId !== teamData.eventId);
        const teamIds = ((pData.teamIds as string[]) || []).filter((tId) => tId !== teamId);
        transaction.update(doc(firestore, 'participants', memberUids[i]), {
          registeredEvents,
          teamIds,
          updatedAt: serverTimestamp(),
        });
      }
    });

    // D. Delete team document last
    transaction.delete(teamRef);

    return {
      success: true,
      message: `Squad "${teamData.teamName}" has been disbanded successfully.`,
    };
  });
}

/**
 * Atomically creates a new event-independent team and updates the leader's profile.
 *
 * IMPORTANT: This function NO LONGER creates an event registration.
 * Teams are event-independent. Event registration is a separate step
 * performed via eventRegistrationService.createEventRegistration().
 */
export async function runAtomicCreateTeam(
  uid: string,
  participantId: string,
  fullName: string,
  email: string,
  college: string,
  qrToken: string,
  teamName: string,
  memberCount: number,
  minTeamSize: number = 1,
  maxTeamSize: number = 10
): Promise<EventTeam> {
  const trimmedName = teamName.trim();
  if (!trimmedName) throw new Error('Team name cannot be empty.');
  if (!memberCount || memberCount < 1) throw new Error('Member count must be at least 1.');

  const teamCode = `TR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const teamId = `TEAM-${teamCode}`;
  const teamRef = doc(firestore, 'teams', teamId);
  const participantRef = doc(firestore, 'participants', uid);

  return await runTransaction(firestore, async (transaction) => {
    const partDoc = await transaction.get(participantRef);
    if (!partDoc.exists()) {
      throw new Error('Participant profile not found.');
    }
    const partData = partDoc.data();

    const now = new Date().toISOString();
    const newTeam: EventTeam = {
      teamId,
      teamCode,
      teamName: trimmedName,
      leaderUid: uid,
      leaderParticipantId: participantId,
      memberUids: [uid],
      members: [
        {
          uid,
          participantId,
          fullName,
          college,
          isLeader: true,
        },
      ],
      memberCount,
      minTeamSize,
      maxTeamSize,
      status: 'FORMING',
      eventRegistrationStarted: false,
      createdAt: now,
      updatedAt: now,
    };

    const teamIds = (partData.teamIds as string[]) || [];
    const updatedTeamIds = Array.from(new Set([...teamIds, teamId]));

    transaction.set(teamRef, {
      ...newTeam,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const codeRef = doc(firestore, 'team_codes', teamCode);
    transaction.set(codeRef, {
      teamId,
      teamCode,
      teamName: trimmedName,
      leaderUid: uid,
      memberCount,
      currentMemberCount: 1,
      maxTeamSize,
      isLocked: false,
      isFull: 1 >= memberCount,
      updatedAt: serverTimestamp(),
    });

    transaction.update(participantRef, {
      teamIds: updatedTeamIds,
      updatedAt: serverTimestamp(),
    });

    return newTeam;
  });
}

/**
 * Atomically submits a join request for a team using the team code.
 * Status is set to 'PENDING'. Member is NOT added to memberUids until captain approves.
 */
export async function runAtomicRequestJoinTeam(
  uid: string,
  participantId: string,
  fullName: string,
  email: string,
  college: string,
  _qrToken: string | undefined,
  rawTeamCode: string
): Promise<{ request: TeamJoinRequest; teamName: string }> {
  const normalizedCode = rawTeamCode.trim().toUpperCase();

  const codeRef = doc(firestore, 'team_codes', normalizedCode);
  const codeSnap = await firestoreGetDoc(codeRef);

  let targetTeamId: string;
  let targetTeamCode: string;
  let targetTeamName: string;
  let targetLeaderUid: string;
  let currentMemberCount: number;
  let targetMemberCount: number;
  let targetMaxTeamSize: number;
  let isLocked: boolean;

  if (codeSnap.exists()) {
    const codeData = codeSnap.data();
    targetTeamId = codeData.teamId;
    targetTeamCode = codeData.teamCode || normalizedCode;
    targetTeamName = codeData.teamName;
    targetLeaderUid = codeData.leaderUid;
    currentMemberCount = codeData.currentMemberCount || 0;
    targetMemberCount = codeData.memberCount || 10;
    targetMaxTeamSize = codeData.maxTeamSize || 10;
    isLocked = !!codeData.isLocked;
  } else {
    const q = query(collection(firestore, 'teams'), where('teamCode', '==', normalizedCode));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      throw new Error(`Team code "${normalizedCode}" not found. Please verify the code with your Team Leader.`);
    }

    const legacyData = querySnap.docs[0].data() as EventTeam;
    targetTeamId = legacyData.teamId;
    targetTeamCode = legacyData.teamCode;
    targetTeamName = legacyData.teamName;
    targetLeaderUid = legacyData.leaderUid;
    currentMemberCount = legacyData.members.length;
    targetMemberCount = legacyData.memberCount;
    targetMaxTeamSize = legacyData.maxTeamSize;
    isLocked = !!legacyData.eventRegistrationStarted;
  }

  return await runTransaction(firestore, async (transaction) => {
    if (targetLeaderUid === uid) {
      throw new Error('You are the captain of this team.');
    }

    if (isLocked) {
      throw new Error(
        `Squad "${targetTeamName}" has already registered for an event and is now locked. New members cannot join a locked squad.`
      );
    }

    if (currentMemberCount >= targetMaxTeamSize) {
      throw new Error(`Team "${targetTeamName}" is already full (max ${targetMaxTeamSize} members).`);
    }

    const reqId = `REQ-${targetTeamId}-${participantId}`;
    const reqRef = doc(firestore, 'team_join_requests', reqId);
    const reqSnap = await transaction.get(reqRef);
    if (reqSnap.exists()) {
      const existingReq = reqSnap.data() as TeamJoinRequest;
      if (existingReq.status === 'PENDING') {
        throw new Error('You already have a pending join request for this team. Waiting for captain review.');
      }
      if (existingReq.status === 'APPROVED') {
        throw new Error('Your join request has already been approved.');
      }
    }

    const now = new Date().toISOString();
    const newRequest: TeamJoinRequest = {
      requestId: reqId,
      teamId: targetTeamId,
      teamCode: targetTeamCode,
      leaderUid: targetLeaderUid,
      participantUid: uid,
      participantId,
      fullName,
      college,
      status: 'PENDING',
      requestedAt: now,
    };

    transaction.set(reqRef, {
      ...newRequest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { request: newRequest, teamName: targetTeamName };
  });
}

/**
 * Atomically approves a pending join request.
 * Only the team leader can execute this operation.
 * Adds member to team.memberUids, creates event registration, and updates member profile.
 */
export async function runAtomicApproveJoinRequest(
  leaderUid: string,
  requestId: string
): Promise<{ team: EventTeam }> {
  const reqRef = doc(firestore, 'team_join_requests', requestId);

  return await runTransaction(firestore, async (transaction) => {
    const reqSnap = await transaction.get(reqRef);
    if (!reqSnap.exists()) {
      throw new Error('Join request not found.');
    }

    const reqData = reqSnap.data() as TeamJoinRequest;
    if (reqData.status !== 'PENDING') {
      throw new Error(`This join request has already been ${reqData.status.toLowerCase()}.`);
    }

    const teamRef = doc(firestore, 'teams', reqData.teamId);
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists()) {
      throw new Error('Team not found.');
    }

    const teamData = teamSnap.data() as EventTeam;
    if (teamData.leaderUid !== leaderUid) {
      throw new Error('Only the team captain can approve join requests.');
    }

    if (teamData.memberUids.includes(reqData.participantUid)) {
      throw new Error('Participant is already a member of this team.');
    }

    if (teamData.members.length >= teamData.maxTeamSize) {
      // Team capacity reached: reject request atomically
      transaction.update(reqRef, {
        status: 'REJECTED',
        reviewedAt: new Date().toISOString(),
        reviewedBy: leaderUid,
        updatedAt: serverTimestamp(),
      });
      throw new Error(`Cannot approve: Team "${teamData.teamName}" is full (max ${teamData.maxTeamSize} members). Request rejected.`);
    }

    // Check if team is locked before approving new members
    if (teamData.eventRegistrationStarted) {
      transaction.update(reqRef, {
        status: 'REJECTED',
        reviewedAt: new Date().toISOString(),
        reviewedBy: leaderUid,
        updatedAt: serverTimestamp(),
      });
      throw new Error(`Cannot approve: Squad "${teamData.teamName}" has already registered for an event and is locked.`);
    }

    // Block if already at declared memberCount
    if (teamData.members.length >= teamData.memberCount) {
      throw new Error(
        `Cannot approve: Squad has reached its declared member count of ${teamData.memberCount}.`
      );
    }

    const partRef = doc(firestore, 'participants', reqData.participantUid);
    const partSnap = await transaction.get(partRef);
    if (!partSnap.exists()) {
      throw new Error('Participant profile not found.');
    }
    const partData = partSnap.data();

    const now = new Date().toISOString();
    const updatedMemberUids = [...teamData.memberUids, reqData.participantUid];
    const sanitizedExisting = teamData.members.map((m) => {
      const { email, qrToken, ...rest } = m as any;
      return rest as RegistrationTeamMember;
    });

    const newMember: RegistrationTeamMember = {
      uid: reqData.participantUid,
      participantId: reqData.participantId,
      fullName: reqData.fullName,
      college: reqData.college,
      isLeader: false,
    };
    const updatedMembers = [...sanitizedExisting, newMember];

    const updatedTeam: EventTeam = {
      ...teamData,
      memberUids: updatedMemberUids,
      members: updatedMembers,
      status: updatedMembers.length >= teamData.minTeamSize ? 'CONFIRMED' : 'FORMING',
      updatedAt: now,
    };

    const teamIds = (partData.teamIds as string[]) || [];
    const updatedTeamIds = Array.from(new Set([...teamIds, teamData.teamId]));

    transaction.update(teamRef, {
      memberUids: updatedMemberUids,
      members: updatedMembers,
      status: updatedTeam.status,
      updatedAt: serverTimestamp(),
    });

    const codeRef = doc(firestore, 'team_codes', teamData.teamCode);
    transaction.set(
      codeRef,
      {
        teamId: teamData.teamId,
        teamCode: teamData.teamCode,
        teamName: teamData.teamName,
        leaderUid: teamData.leaderUid,
        memberCount: teamData.memberCount,
        currentMemberCount: updatedMembers.length,
        maxTeamSize: teamData.maxTeamSize,
        isLocked: teamData.eventRegistrationStarted || false,
        isFull: updatedMembers.length >= teamData.memberCount,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.update(partRef, {
      teamIds: updatedTeamIds,
      updatedAt: serverTimestamp(),
    });

    transaction.update(reqRef, {
      status: 'APPROVED',
      reviewedAt: now,
      reviewedBy: leaderUid,
      updatedAt: serverTimestamp(),
    });

    return { team: updatedTeam };
  });
}

/**
 * Atomically rejects a pending join request.
 * Only the team leader can execute this operation.
 */
export async function runAtomicRejectJoinRequest(
  leaderUid: string,
  requestId: string
): Promise<void> {
  const reqRef = doc(firestore, 'team_join_requests', requestId);

  return await runTransaction(firestore, async (transaction) => {
    const reqSnap = await transaction.get(reqRef);
    if (!reqSnap.exists()) {
      throw new Error('Join request not found.');
    }

    const reqData = reqSnap.data() as TeamJoinRequest;
    if (reqData.status !== 'PENDING') {
      throw new Error(`This join request has already been ${reqData.status.toLowerCase()}.`);
    }

    const teamRef = doc(firestore, 'teams', reqData.teamId);
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists()) {
      throw new Error('Team not found.');
    }

    const teamData = teamSnap.data() as EventTeam;
    if (teamData.leaderUid !== leaderUid) {
      throw new Error('Only the team captain can reject join requests.');
    }

    const now = new Date().toISOString();
    transaction.update(reqRef, {
      status: 'REJECTED',
      reviewedAt: now,
      reviewedBy: leaderUid,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Backwards compatibility wrapper for join team. Sends a join request.
 */
export async function runAtomicJoinTeam(
  uid: string,
  participantId: string,
  fullName: string,
  email: string,
  college: string,
  _qrToken: string | undefined,
  rawTeamCode: string
): Promise<{ teamName: string }> {
  const res = await runAtomicRequestJoinTeam(uid, participantId, fullName, email, college, _qrToken, rawTeamCode);
  throw new Error(`Join request sent to captain of "${res.teamName}". Membership will be confirmed once captain approves.`);
}

export async function getTeamJoinRequestsForLeader(leaderUid: string): Promise<TeamJoinRequest[]> {
  const q = query(
    collection(firestore, 'team_join_requests'),
    where('leaderUid', '==', leaderUid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TeamJoinRequest);
}

export async function getParticipantJoinRequests(participantUid: string): Promise<TeamJoinRequest[]> {
  const q = query(
    collection(firestore, 'team_join_requests'),
    where('participantUid', '==', participantUid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TeamJoinRequest);
}

/**
 * Atomically removes a participant from a team and deletes their registration for the event.
 * Disbands team if leader leaves and no other members remain.
 */
export async function runAtomicLeaveTeam(
  uid: string,
  teamId: string
): Promise<{ success: boolean; message: string }> {
  const teamRef = doc(firestore, 'teams', teamId);
  const partRef = doc(firestore, 'participants', uid);

  return await runTransaction(firestore, async (transaction) => {
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists()) {
      throw new Error('Team not found.');
    }
    const teamData = teamSnap.data() as EventTeam;

    if (!teamData.memberUids.includes(uid)) {
      throw new Error('You are not a member of this team.');
    }

    const partSnap = await transaction.get(partRef);
    if (!partSnap.exists()) {
      throw new Error('Participant profile not found.');
    }
    const partData = partSnap.data();

    // Check if participant has already checked in at venue
    if (partData.venueCheckIn === true) {
      throw new Error('Cannot leave team: You have already checked in at the venue gate.');
    }

    const regId = `REG-${teamData.eventId}-${(partData.participantId as string) || ''}`;
    const regRef = doc(firestore, 'registrations', regId);
    const regSnap = await transaction.get(regRef);

    const isLeader = teamData.leaderUid === uid;
    const remainingMemberUids = teamData.memberUids.filter((id) => id !== uid);

    if (isLeader && remainingMemberUids.length > 0) {
      throw new Error(
        'Team Leader cannot leave while other members exist. Remove members first or click Disband Squad.'
      );
    }

    const remainingMembers = teamData.members.filter((m) => m.uid !== uid);

    // ── ALL WRITES SECOND ──
    // If no members remain or leader disbands empty team -> Delete team doc
    if (remainingMemberUids.length === 0) {
      transaction.delete(teamRef);
    } else {
      transaction.update(teamRef, {
        memberUids: remainingMemberUids,
        members: remainingMembers,
        status: remainingMembers.length >= teamData.minTeamSize ? 'CONFIRMED' : 'FORMING',
        updatedAt: serverTimestamp(),
      });
    }

    // Delete Registration doc
    if (regSnap.exists()) {
      transaction.delete(regRef);
    }

    // Update Participant Profile
    const registeredEvents = (partData.registeredEvents as string[]) || [];
    const updatedEvents = registeredEvents.filter((evId) => evId !== teamData.eventId);

    const teamIds = (partData.teamIds as string[]) || [];
    const updatedTeamIds = teamIds.filter((tId) => tId !== teamId);

    transaction.update(partRef, {
      registeredEvents: updatedEvents,
      teamIds: updatedTeamIds,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: isLeader ? 'Team disbanded successfully.' : 'You have left the team.',
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 7 Event-Day Operations Engine (Atomic & Transaction-Safe)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record an immutable audit log entry for security and operational actions.
 */
export async function logAuditEvent(
  action: AuditAction,
  actorUid: string,
  actorRole: string,
  targetUid?: string,
  eventId?: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const cleanedMetadata = metadata ? removeUndefined(metadata) : {};
  const docRef = await firestoreAddDoc(collection(firestore, "audit_logs"), {
    action,
    actorUid,
    actorRole,
    targetUid: targetUid || null,
    eventId: eventId || null,
    timestamp: serverTimestamp(),
    metadata: cleanedMetadata,
  });
  return docRef.id;
}

/**
 * Atomically verifies a QR token/ID at the Gate Registration Desk and records Venue Check-In.
 */
export async function runAtomicVenueCheckIn(
  scanInput: string,
  staffUid: string
): Promise<{ participant: Record<string, unknown>; isAlreadyCheckedIn: boolean }> {
  const normalized = scanInput.trim();

  // Search by qrToken first, then by participantId, then by doc UID
  let targetUid: string | null = null;

  const qQr = query(collection(firestore, "participants"), where("qrToken", "==", normalized));
  const snapQr = await getDocs(qQr);

  if (!snapQr.empty) {
    targetUid = snapQr.docs[0].id;
  } else {
    const qPart = query(collection(firestore, "participants"), where("participantId", "==", normalized));
    const snapPart = await getDocs(qPart);
    if (!snapPart.empty) {
      targetUid = snapPart.docs[0].id;
    } else {
      const docRef = doc(firestore, "participants", normalized);
      const docSnap = await firestoreGetDoc(docRef);
      if (docSnap.exists()) {
        targetUid = normalized;
      }
    }
  }

  if (!targetUid) {
    throw new Error(`NOT_FOUND: Participant with token/ID "${normalized}" not found.`);
  }

  const participantRef = doc(firestore, "participants", targetUid);

  return await runTransaction(firestore, async (transaction) => {
    const partSnap = await transaction.get(participantRef);
    if (!partSnap.exists()) {
      throw new Error(`NOT_FOUND: Participant document not found.`);
    }

    const partData = partSnap.data() as Record<string, unknown>;
    const isAlready = partData.venueCheckIn === true;
    const now = new Date().toISOString();

    if (!isAlready) {
      transaction.update(participantRef, {
        venueCheckIn: true,
        venueCheckInStatus: "CHECKED_IN",
        venueCheckInTimestamp: serverTimestamp(),
        checkedInByStaffUid: staffUid,
        updatedAt: serverTimestamp(),
      });

      // Write audit log
      const auditRef = doc(collection(firestore, "audit_logs"));
      transaction.set(auditRef, {
        action: "VENUE_CHECK_IN",
        actorUid: staffUid,
        actorRole: "staff",
        targetUid,
        timestamp: serverTimestamp(),
        metadata: {
          participantId: partData.participantId,
          fullName: partData.fullName,
        },
      });
    }

    return {
      participant: {
        ...partData,
        venueCheckIn: true,
        venueCheckInStatus: "CHECKED_IN",
        venueCheckInTimestamp: now,
      },
      isAlreadyCheckedIn: isAlready,
    };
  });
}

/**
 * Atomically checks in a participant for a specific event hall desk.
 * Strictly enforces that venueCheckIn == true before allowing event check-in.
 * Idempotent: Returns isAlreadyCheckedIn if already recorded.
 */
export async function runAtomicEventCheckIn(
  eventId: string,
  eventName: string,
  participantInput: string,
  coordinatorUid: string,
  round: EventAttendanceRound = 'ROUND_1'
): Promise<{ checkIn: EventCheckIn; participant: Record<string, unknown>; isAlreadyCheckedIn: boolean }> {
  const normalized = participantInput.trim();

  let targetUid: string | null = null;
  const qQr = query(collection(firestore, "participants"), where("qrToken", "==", normalized));
  const snapQr = await getDocs(qQr);

  if (!snapQr.empty) {
    targetUid = snapQr.docs[0].id;
  } else {
    const qPart = query(collection(firestore, "participants"), where("participantId", "==", normalized));
    const snapPart = await getDocs(qPart);
    if (!snapPart.empty) {
      targetUid = snapPart.docs[0].id;
    } else {
      const docRef = doc(firestore, "participants", normalized);
      const docSnap = await firestoreGetDoc(docRef);
      if (docSnap.exists()) {
        targetUid = normalized;
      }
    }
  }

  if (!targetUid) {
    throw new Error(`Participant with token/ID "${normalized}" not found.`);
  }

  const checkInId = `EVCHK-${eventId}-${targetUid}`;
  const checkInRef = doc(firestore, "event_checkins", checkInId);
  const participantRef = doc(firestore, "participants", targetUid);
  const regId = `REG-${eventId}-${targetUid}`;
  const regRef = doc(firestore, "registrations", regId);

  return await runTransaction(firestore, async (transaction) => {
    const partSnap = await transaction.get(participantRef);
    if (!partSnap.exists()) {
      throw new Error("Participant document not found.");
    }

    const partData = partSnap.data() as Record<string, unknown>;

    // Requirement 6 Check: Must have completed Venue Gate Check-In first!
    if (partData.venueCheckIn !== true && partData.venueCheckInStatus !== 'CHECKED_IN') {
      throw new Error(
        `Gate Check-in Prerequisite Failed: ${partData.fullName || 'Participant'} has not completed Ground Floor Venue Gate Check-In.`
      );
    }

    // Verify registration for event
    const registeredEvents = (partData.registeredEvents as string[]) || [];
    if (!registeredEvents.includes(eventId)) {
      throw new Error(
        `${partData.fullName || 'Participant'} is not registered for ${eventName}.`
      );
    }

    // Check duplicate event check-in (Idempotency)
    const existingCheckInSnap = await transaction.get(checkInRef);
    const isAlready = existingCheckInSnap.exists();

    const now = new Date().toISOString();
    const existingData = isAlready ? (existingCheckInSnap.data() as EventCheckIn) : null;

    const checkInRecord: EventCheckIn = existingData || {
      checkInId,
      eventId,
      eventName,
      participantId: (partData.participantId as string) || "",
      uid: targetUid,
      isTeam: false,
      round,
      status: "CHECKED_IN",
      checkedInAt: now,
      checkedInByUid: coordinatorUid,
    };

    if (!isAlready) {
      // Update participant attendance status for event
      const attendanceStatusMap = (partData.attendanceStatus as Record<string, string>) || {};
      const updatedAttendanceMap = {
        ...attendanceStatusMap,
        [eventId]: "PRESENT",
      };

      transaction.set(checkInRef, {
        ...checkInRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      transaction.update(participantRef, {
        attendanceStatus: updatedAttendanceMap,
        updatedAt: serverTimestamp(),
      });

      // Update registration record if exists
      const regSnap = await transaction.get(regRef);
      if (regSnap.exists()) {
        transaction.update(regRef, {
          eventAttendance: 'PRESENT',
          status: 'CHECKED_IN',
          updatedAt: serverTimestamp(),
        });
      }

      // Write audit log
      const auditRef = doc(collection(firestore, "audit_logs"));
      transaction.set(auditRef, {
        action: "EVENT_CHECK_IN",
        actorUid: coordinatorUid,
        actorRole: "coordinator",
        targetUid,
        targetParticipantId: (partData.participantId as string) || "",
        eventId,
        timestamp: serverTimestamp(),
        metadata: {
          eventName,
          round,
        },
      });
    }

    return {
      checkIn: checkInRecord,
      participant: {
        ...partData,
        attendanceStatus: {
          ...((partData.attendanceStatus as Record<string, string>) || {}),
          [eventId]: "PRESENT",
        },
      },
      isAlreadyCheckedIn: isAlready,
    };
  });
}

/**
 * Atomically updates round-based event attendance for a participant.
 */
export async function runAtomicUpdateAttendance(
  eventId: string,
  eventName: string,
  targetUid: string,
  status: 'NOT_MARKED' | 'PRESENT' | 'ABSENT',
  round: EventAttendanceRound,
  actorUid: string,
  actorRole: string
): Promise<void> {
  const participantRef = doc(firestore, "participants", targetUid);
  const regId = `REG-${eventId}-${targetUid}`;
  const regRef = doc(firestore, "registrations", regId);

  await runTransaction(firestore, async (transaction) => {
    const partSnap = await transaction.get(participantRef);
    if (!partSnap.exists()) {
      throw new Error("Participant profile not found.");
    }

    const partData = partSnap.data() as Record<string, unknown>;

    // Gate Check-in check for marking PRESENT
    if (status === 'PRESENT' && partData.venueCheckIn !== true && partData.venueCheckInStatus !== 'CHECKED_IN') {
      throw new Error("Cannot mark PRESENT: Participant has not completed Venue Gate Check-In.");
    }

    const attendanceMap = (partData.attendanceStatus as Record<string, string>) || {};
    const updatedMap = {
      ...attendanceMap,
      [eventId]: status,
    };

    transaction.update(participantRef, {
      attendanceStatus: updatedMap,
      updatedAt: serverTimestamp(),
    });

    const regSnap = await transaction.get(regRef);
    if (regSnap.exists()) {
      transaction.update(regRef, {
        eventAttendance: status,
        updatedAt: serverTimestamp(),
      });
    }

    const auditRef = doc(collection(firestore, "audit_logs"));
    transaction.set(auditRef, {
      action: "ATTENDANCE_UPDATED",
      actorUid,
      actorRole,
      targetUid,
      targetParticipantId: (partData.participantId as string) || "",
      eventId,
      timestamp: serverTimestamp(),
      metadata: {
        eventName,
        status,
        round,
      },
    });
  });
}

/**
 * Atomically validates, submits, and locks a scorecard for a participant or team.
 */
export async function runAtomicSubmitScorecard(
  scorecardData: Omit<Scorecard, "submittedAt" | "createdAt" | "updatedAt">
): Promise<Scorecard> {
  const { scorecardId, eventId, eventName, targetId, judgeUid, criteria, status } = scorecardData;

  // Validate criteria values (0..max)
  let calculatedTotal = 0;
  for (const [critKey, scoreVal] of Object.entries(criteria)) {
    if (typeof scoreVal !== "number" || isNaN(scoreVal) || scoreVal < 0) {
      throw new Error(`Invalid score value for criterion "${critKey}": ${scoreVal}`);
    }
    calculatedTotal += scoreVal;
  }

  const scoreRef = doc(firestore, "scorecards", scorecardId);

  return await runTransaction(firestore, async (transaction) => {
    const existingSnap = await transaction.get(scoreRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as Scorecard;
      if (existingData.status === "SUBMITTED" && status === "SUBMITTED") {
        throw new Error("Scorecard has already been submitted and locked. Contact Admin to reopen.");
      }
    }

    const now = new Date().toISOString();
    const finalScorecard: Scorecard = {
      ...scorecardData,
      totalScore: calculatedTotal,
      status: "SUBMITTED",
      submittedAt: now,
      submittedByUid: judgeUid,
      createdAt: existingSnap.exists() ? (existingSnap.data().createdAt as string) : now,
      updatedAt: now,
    };

    transaction.set(scoreRef, {
      ...finalScorecard,
      updatedAt: serverTimestamp(),
    });

    const auditRef = doc(collection(firestore, "audit_logs"));
    transaction.set(auditRef, {
      action: "SCORE_SUBMITTED",
      actorUid: judgeUid,
      actorRole: "coordinator",
      eventId,
      timestamp: serverTimestamp(),
      metadata: {
        eventName,
        targetId,
        totalScore: calculatedTotal,
      },
    });

    return finalScorecard;
  });
}

/**
 * Admin operation to unlock/reopen a submitted scorecard.
 */
export async function runAtomicReopenScorecard(scorecardId: string, adminUid: string): Promise<void> {
  const scoreRef = doc(firestore, "scorecards", scorecardId);
  const snap = await firestoreGetDoc(scoreRef);

  if (!snap.exists()) {
    throw new Error("Scorecard not found.");
  }

  const now = new Date().toISOString();

  await firestoreUpdateDoc(scoreRef, {
    status: "REOPENED",
    reopenedAt: now,
    reopenedByUid: adminUid,
    updatedAt: serverTimestamp(),
  });

  await logAuditEvent("SCORE_REOPENED", adminUid, "admin", undefined, snap.data().eventId as string, {
    scorecardId,
  });
}

/**
 * Atomically updates shortlisting status for a participant or team.
 */
export async function runAtomicUpdateShortlist(
  eventId: string,
  eventName: string,
  targetId: string,
  shortlistStatus: 'NOT_EVALUATED' | 'SHORTLISTED' | 'NOT_SHORTLISTED' | 'FINALIST',
  actorUid: string,
  actorRole: string
): Promise<void> {
  const participantRef = doc(firestore, "participants", targetId);
  const regId = `REG-${eventId}-${targetId}`;
  const regRef = doc(firestore, "registrations", regId);

  await runTransaction(firestore, async (transaction) => {
    const partSnap = await transaction.get(participantRef);
    if (partSnap.exists()) {
      const partData = partSnap.data() as Record<string, unknown>;
      const shortlistMap = (partData.shortlistStatus as Record<string, string>) || {};
      const updatedMap = {
        ...shortlistMap,
        [eventId]: shortlistStatus,
      };

      transaction.update(participantRef, {
        shortlistStatus: updatedMap,
        updatedAt: serverTimestamp(),
      });
    }

    const regSnap = await transaction.get(regRef);
    if (regSnap.exists()) {
      transaction.update(regRef, {
        shortlistStatus,
        updatedAt: serverTimestamp(),
      });
    }

    const auditRef = doc(collection(firestore, "audit_logs"));
    transaction.set(auditRef, {
      action: "SHORTLIST_UPDATED",
      actorUid,
      actorRole,
      targetUid: targetId,
      eventId,
      timestamp: serverTimestamp(),
      metadata: {
        eventName,
        shortlistStatus,
      },
    });
  });
}

/**
 * Admin operation to publish official event results and update event state.
 */
export async function runAtomicPublishResult(
  resultData: Omit<EventResult, "publishedAt" | "createdAt" | "updatedAt">,
  adminUid: string
): Promise<EventResult> {
  const resultRef = doc(firestore, "results", resultData.resultId);
  const now = new Date().toISOString();

  const publishedResult: EventResult = {
    ...resultData,
    status: "PUBLISHED",
    publishedAt: now,
    publishedByUid: adminUid,
    createdAt: now,
    updatedAt: now,
  };

  await firestoreSetDoc(resultRef, {
    ...publishedResult,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update event status to COMPLETED
  const eventRef = doc(firestore, "events", resultData.eventId);
  const eventSnap = await firestoreGetDoc(eventRef);
  if (eventSnap.exists()) {
    await firestoreUpdateDoc(eventRef, {
      status: "COMPLETED",
      updatedAt: serverTimestamp(),
    });
  }

  await logAuditEvent("RESULT_PUBLISHED", adminUid, "admin", undefined, resultData.eventId, {
    eventName: resultData.eventName,
    winner: resultData.winner.name,
    rankingsCount: resultData.rankings.length,
  });

  return publishedResult;
}

/**
 * Issues an authentic symposium certificate record with unique verification code.
 */
export async function runAtomicIssueCertificate(
  participantUid: string,
  eventId: string,
  eventName: string,
  achievement: string,
  certificateType: CertificateRecord['certificateType'],
  adminUid: string
): Promise<CertificateRecord> {
  const participantRef = doc(firestore, "participants", participantUid);
  const partSnap = await firestoreGetDoc(participantRef);

  if (!partSnap.exists()) {
    throw new Error("Participant not found.");
  }

  const partData = partSnap.data() as Record<string, unknown>;
  const partId = (partData.participantId as string) || "TARAS26-ID";
  const fullName = (partData.fullName as string) || "Participant";
  const college = (partData.college as string) || "Institution";

  // Generate cryptographically secure unique verification code
  const cryptoBytes = new Uint8Array(4);
  (typeof crypto !== 'undefined' ? crypto : (window as any).crypto).getRandomValues(cryptoBytes);
  const randomCode = Array.from(cryptoBytes, (b: number) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const certId = `TARAS26-CERT-${randomCode}`;
  const certRef = doc(firestore, "certificate_records", certId);
  const now = new Date().toISOString();

  const certRecord: CertificateRecord = {
    certId,
    participantId: partId,
    uid: participantUid,
    fullName,
    college,
    eventId,
    eventName,
    achievement,
    certificateType,
    status: "ISSUED",
    issueDate: now,
    issuedByUid: adminUid,
    verificationCode: randomCode,
    verificationUrl: `${window.location.origin}/verify-certificate?id=${certId}`,
  };

  await firestoreSetDoc(certRef, {
    ...certRecord,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update participant profile
  await firestoreUpdateDoc(participantRef, {
    certificateStatus: "READY",
    updatedAt: serverTimestamp(),
  });

  await logAuditEvent("CERTIFICATE_ISSUED", adminUid, "admin", participantUid, eventId, {
    certId,
    achievement,
    certificateType,
  });

  return certRecord;
}

/**
 * Revokes a certificate record.
 */
export async function runAtomicRevokeCertificate(certId: string, adminUid: string): Promise<void> {
  const certRef = doc(firestore, "certificate_records", certId);
  const snap = await firestoreGetDoc(certRef);

  if (!snap.exists()) {
    throw new Error("Certificate not found.");
  }

  await firestoreUpdateDoc(certRef, {
    status: "REVOKED",
    updatedAt: serverTimestamp(),
  });

  await logAuditEvent("CERTIFICATE_REVOKED", adminUid, "admin", snap.data().uid as string, snap.data().eventId as string, {
    certId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Default application exports
// ─────────────────────────────────────────────────────────────────────────────

export const firebase = {
  app,
  auth,
  db: database,
  storage,
};