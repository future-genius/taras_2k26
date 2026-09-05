import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  db,
  signUpWithEmail,
  signInWithEmail,
  sendPasswordReset,
  signOutUser,
  saveSessionUser,
  subscribeToAuthState,
  runAtomicRegistration,
  runAtomicCreateTeam,
  runAtomicJoinTeam,
  runAtomicRequestJoinTeam,
  runAtomicApproveJoinRequest,
  runAtomicRejectJoinRequest,
  runAtomicRenameTeam,
  runAtomicRemoveMember,
  runAtomicDisbandTeam,
  runAtomicLeaveTeam,
} from '../config/firebase';
import * as teamService from '../services/teamService';
import type { ParticipantProfile, DigitalPass, UserRole } from '../types/participant';
import type { EventTeam as Team, TeamJoinRequest } from '../types/team';
import type { EventRegistration } from '../types/registration';
import type { AuthUser } from '../types/auth';
import {
  isSuperAdmin as checkSuperAdmin,
  isAdminOrAbove,
  isCoordinatorOrAbove,
  isStaffOrAbove,
  getCanonicalRole,
} from '../utils/roleHelpers';

// ── Types ─────────────────────────────────────────────────────────────────────
interface RegisterData {
  fullName: string;
  phone: string;
  college: string;
  department: string;
  year: 'I' | 'II' | 'III' | 'IV' | 'PG';
  section?: string;
  registrationNumber?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  currentUser: AuthUser | null;
  participantProfile: ParticipantProfile | null;
  role: UserRole;
  isSuperAdmin: boolean;    // TARAS 2K26 President — highest authority
  isAdmin: boolean;         // admin OR super_admin
  isStaff: boolean;         // staff and above
  isCoordinator: boolean;   // coordinator and above
  isParticipant: boolean;
  assignedEventIds: string[];
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<{ role: string }>;
  register: (email: string, pass: string, data: RegisterData) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateParticipantProfile: (data: Partial<ParticipantProfile>) => Promise<void>;
  registerForEvent: (
    eventId: string,
    eventName: string,
    category: EventRegistration['category'],
    isTeam: boolean,
    teamId?: string
  ) => Promise<void>;
  createTeam: (teamName: string, memberCount: number, minSize?: number, maxSize?: number) => Promise<Team>;
  joinTeam: (teamCode: string) => Promise<Team>;
  requestJoinTeam: (teamCode: string) => Promise<TeamJoinRequest>;
  approveJoinRequest: (requestId: string) => Promise<void>;
  rejectJoinRequest: (requestId: string) => Promise<void>;
  renameTeam: (teamId: string, newName: string) => Promise<Team>;
  removeMemberFromTeam: (teamId: string, targetMemberUid: string, targetParticipantId: string) => Promise<Team>;
  disbandTeam: (teamId: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
  getDigitalPass: () => DigitalPass | null;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PROFILE_CACHE_KEY = 'taras2k26_participant_profile';

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateParticipantId(): string {
  return `TARAS26-${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function generateQRToken(participantId: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    const uuidHex = crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase();
    return `QR-${participantId}-${uuidHex}`;
  }
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  const hex = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `QR-${participantId}-${hex}`;
}

function generateTeamCode(): string {
  return `TR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [participantProfile, setParticipantProfile] = useState<ParticipantProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const syncProfile = useCallback((profile: ParticipantProfile | null) => {
    setParticipantProfile(profile);
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  }, []);

  // Subscribe to Firebase Auth state & Real-Time Profile updates
  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsubscribeAuth = subscribeToAuthState(async (user) => {
      setAuthUser(user);

      // Clean up previous profile listener if any
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (user) {
        // 1. Initial cached profile hydration for instant UI response
        const cached = localStorage.getItem(PROFILE_CACHE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as ParticipantProfile;
            if (parsed.uid === user.uid) {
              setParticipantProfile(parsed);
            }
          } catch {
            // Ignore parse errors
          }
        }

        // 2. Real-time Live Firestore Profile Listener
        // Whenever President / Admin modifies role, event assignments, check-in, or certificates,
        // this triggers instantly across all open browser sessions in parallel.
        profileUnsub = db.subscribeDoc('participants', user.uid, (data, exists) => {
          if (exists && data) {
            const profile = data as unknown as ParticipantProfile;
            syncProfile(profile);
          }
          setLoading(false);
        });
      } else {
        setParticipantProfile(null);
        localStorage.removeItem(PROFILE_CACHE_KEY);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (profileUnsub) {
        profileUnsub();
      }
    };
  }, [syncProfile]);

  // Derived Role Checks — using centralized roleHelpers
  const rawRole = participantProfile?.role;
  const isSuperAdminUser = checkSuperAdmin(rawRole);
  const isAdmin = isAdminOrAbove(rawRole);           // true for super_admin AND admin
  const isCoordinator = isCoordinatorOrAbove(rawRole);
  const isStaff = isStaffOrAbove(rawRole);
  const isParticipant = !isStaff && !isCoordinator && !isAdmin;
  const assignedEventIds = participantProfile?.assignedEventIds || [];

  // Canonical role — super_admin is preserved as its own role
  const canonicalRole: UserRole = getCanonicalRole(rawRole);

  // ── Register ────────────────────────────────────────────────────────────────
  // Security Principle: User can NEVER select role at registration. Always 'participant'.
  const register = async (email: string, pass: string, profileData: RegisterData) => {
    setError(null);
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, pass);
      saveSessionUser(user);
      setAuthUser(user);

      const participantId = generateParticipantId();
      const qrToken = generateQRToken(participantId);
      const now = new Date().toISOString();

      const newProfile: ParticipantProfile = {
        uid: user.uid,
        participantId,
        fullName: profileData.fullName,
        email,
        phone: profileData.phone,
        college: profileData.college,
        department: profileData.department,
        year: profileData.year,
        section: profileData.section || 'A',
        registrationNumber: profileData.registrationNumber || '',
        role: 'participant',
        assignedEventIds: [],
        qrToken,
        venueCheckIn: false,
        venueCheckInStatus: 'NOT_CHECKED_IN',
        registeredEvents: [],
        teamIds: [],
        attendanceStatus: {},
        shortlistStatus: {},
        certificateStatus: 'PENDING',
        createdAt: now,
        updatedAt: now,
      };

      await db.setDoc('participants', user.uid, newProfile as unknown as Record<string, unknown>);
      syncProfile(newProfile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = async (email: string, pass: string): Promise<{ role: string }> => {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithEmail(email, pass);
      saveSessionUser(user);
      setAuthUser(user);

      // Try to load existing profile
      const stored = await db.getDoc('participants', user.uid);
      let resolvedRole = 'participant';
      if (stored.exists && stored.data) {
        const profile = stored.data as unknown as ParticipantProfile;
        syncProfile(profile);
        resolvedRole = (profile.role as string) || 'participant';
      } else {
        // Create basic profile if first time
        const participantId = generateParticipantId();
        const now = new Date().toISOString();
        const newProfile: ParticipantProfile = {
          uid: user.uid,
          participantId,
          fullName: email.split('@')[0],
          email,
          phone: '',
          college: '',
          department: 'ECE',
          year: 'III',
          section: 'A',
          registrationNumber: '',
          role: 'participant',
          assignedEventIds: [],
          qrToken: generateQRToken(participantId),
          venueCheckIn: false,
          venueCheckInStatus: 'NOT_CHECKED_IN',
          registeredEvents: [],
          teamIds: [],
          attendanceStatus: {},
          shortlistStatus: {},
          certificateStatus: 'PENDING',
          createdAt: now,
          updatedAt: now,
        };
        await db.setDoc('participants', user.uid, newProfile as unknown as Record<string, unknown>);
        syncProfile(newProfile);
        resolvedRole = 'participant';
      }
      return { role: resolvedRole };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = () => {
    signOutUser();
    setAuthUser(null);
    setParticipantProfile(null);
    localStorage.removeItem(PROFILE_CACHE_KEY);
  };

  // ── Reset Password ──────────────────────────────────────────────────────────
  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordReset(email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed';
      setError(msg);
      throw err;
    }
  };

  // ── Update Profile ──────────────────────────────────────────────────────────
  // Security Principle: Disallow updating role, participantId, qrToken, venueCheckIn, certificateStatus from standard profile edit
  const updateParticipantProfile = async (data: Partial<ParticipantProfile>) => {
    if (!participantProfile) return;

    // Filter out immutable security fields
    const safeData: Record<string, unknown> = {};
    if (data.fullName !== undefined) safeData.fullName = data.fullName;
    if (data.phone !== undefined) safeData.phone = data.phone;
    if (data.college !== undefined) safeData.college = data.college;
    if (data.department !== undefined) safeData.department = data.department;
    if (data.year !== undefined) safeData.year = data.year;
    if (data.section !== undefined) safeData.section = data.section;
    if (data.registrationNumber !== undefined) safeData.registrationNumber = data.registrationNumber;
    if (data.profilePhoto !== undefined) safeData.profilePhoto = data.profilePhoto;

    await db.updateDoc('participants', participantProfile.uid, safeData);

    const updated: ParticipantProfile = {
      ...participantProfile,
      ...(safeData as Partial<ParticipantProfile>),
      updatedAt: new Date().toISOString(),
    };
    syncProfile(updated);
  };

  // ── Event Registration ──────────────────────────────────────────────────────
  const registerForEvent = async (
    eventId: string,
    eventName: string,
    category: EventRegistration['category'],
    isTeam: boolean,
    teamId?: string
  ) => {
    if (!participantProfile) throw new Error('Please login first to register.');

    await runAtomicRegistration(
      participantProfile.uid,
      participantProfile.participantId,
      eventId,
      eventName,
      category,
      isTeam,
      teamId
    );

    const updatedDoc = await db.getDoc('participants', participantProfile.uid);
    if (updatedDoc.exists && updatedDoc.data) {
      syncProfile(updatedDoc.data as unknown as ParticipantProfile);
    }
  };

  // ── Create Team ─────────────────────────────────────────────────────────────
  const createTeam = async (
    teamName: string,
    memberCount: number,
    minSize: number = 1,
    maxSize: number = 10
  ): Promise<Team> => {
    if (!participantProfile) throw new Error('Please login to create a team.');

    const team = await teamService.createTeam(
      participantProfile.uid,
      participantProfile.participantId,
      participantProfile.fullName,
      participantProfile.email,
      participantProfile.college,
      participantProfile.qrToken,
      teamName,
      memberCount,
      minSize,
      maxSize
    );

    const updatedDoc = await db.getDoc('participants', participantProfile.uid);
    if (updatedDoc.exists && updatedDoc.data) {
      syncProfile(updatedDoc.data as unknown as ParticipantProfile);
    }

    return team;
  };

  // ── Join Team (Backwards Compatibility) ──────────────────────────────────
  const joinTeam = async (teamCode: string): Promise<Team> => {
    if (!participantProfile) throw new Error('Please login to join a team.');

    const req = await teamService.requestToJoinTeam(
      participantProfile.uid,
      participantProfile.participantId,
      participantProfile.fullName,
      participantProfile.email,
      participantProfile.college,
      undefined,
      teamCode
    );

    const team = await teamService.getTeam(req.teamId);
    if (!team) throw new Error('Team request submitted, waiting for captain review.');

    const updatedDoc = await db.getDoc('participants', participantProfile.uid);
    if (updatedDoc.exists && updatedDoc.data) {
      syncProfile(updatedDoc.data as unknown as ParticipantProfile);
    }

    return team;
  };

  // ── Request Join Team ──────────────────────────────────────────────────────
  const requestJoinTeam = async (teamCode: string): Promise<TeamJoinRequest> => {
    if (!participantProfile) throw new Error('Please login to send a join request.');

    return await teamService.requestToJoinTeam(
      participantProfile.uid,
      participantProfile.participantId,
      participantProfile.fullName,
      participantProfile.email,
      participantProfile.college,
      undefined,
      teamCode
    );
  };

  // ── Approve Join Request ──────────────────────────────────────────────────
  const approveJoinRequest = async (requestId: string): Promise<void> => {
    if (!participantProfile) throw new Error('Please login to review join requests.');

    await teamService.approveJoinRequest(participantProfile.uid, requestId);

    const updatedDoc = await db.getDoc('participants', participantProfile.uid);
    if (updatedDoc.exists && updatedDoc.data) {
      syncProfile(updatedDoc.data as unknown as ParticipantProfile);
    }
  };

  // ── Reject Join Request ───────────────────────────────────────────────────
  const rejectJoinRequest = async (requestId: string): Promise<void> => {
    if (!participantProfile) throw new Error('Please login to review join requests.');

    await teamService.rejectJoinRequest(participantProfile.uid, requestId);
  };

  // ── Rename Team ────────────────────────────────────────────────────────────
  const renameTeam = async (teamId: string, newName: string): Promise<Team> => {
    if (!participantProfile) throw new Error('Please login to rename a team.');

    await teamService.renameTeam(participantProfile.uid, teamId, newName);
    const updated = await teamService.getTeam(teamId);
    if (!updated) throw new Error('Failed to fetch updated team after rename.');
    return updated;
  };

  // ── Remove Member From Team ────────────────────────────────────────────────
  const removeMemberFromTeam = async (
    teamId: string,
    targetMemberUid: string,
    _targetParticipantId: string
  ): Promise<Team> => {
    if (!participantProfile) throw new Error('Please login to remove members.');

    return await teamService.removeMemberFromTeam(
      participantProfile.uid,
      teamId,
      targetMemberUid
    );
  };

  // ── Disband Team ────────────────────────────────────────────────────────────
  const disbandTeam = async (teamId: string): Promise<void> => {
    if (!participantProfile) throw new Error('Please login to disband a team.');

    await teamService.deleteTeam(participantProfile.uid, teamId);

    const updatedDoc = await db.getDoc('participants', participantProfile.uid);
    if (updatedDoc.exists && updatedDoc.data) {
      syncProfile(updatedDoc.data as unknown as ParticipantProfile);
    }
  };

  // ── Leave Team ──────────────────────────────────────────────────────────────
  const leaveTeam = async (teamId: string): Promise<void> => {
    if (!participantProfile) throw new Error('Please login to leave a team.');

    await teamService.leaveTeam(participantProfile.uid, teamId);

    const updatedDoc = await db.getDoc('participants', participantProfile.uid);
    if (updatedDoc.exists && updatedDoc.data) {
      syncProfile(updatedDoc.data as unknown as ParticipantProfile);
    }
  };

  // ── Get Digital Pass ────────────────────────────────────────────────────────
  const getDigitalPass = (): DigitalPass | null => {
    if (!participantProfile) return null;
    return {
      passId: `PASS-${participantProfile.participantId}`,
      participantId: participantProfile.participantId,
      holderName: participantProfile.fullName,
      email: participantProfile.email,
      college: participantProfile.college,
      department: participantProfile.department,
      qrToken: participantProfile.qrToken,
      venueCheckIn: participantProfile.venueCheckIn,
      registeredEvents: participantProfile.registeredEvents,
      issuedAt: participantProfile.createdAt,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user: authUser,
        currentUser: authUser,
        participantProfile,
        role: canonicalRole,
        isSuperAdmin: isSuperAdminUser,
        isAdmin,
        isStaff,
        isCoordinator,
        isParticipant,
        assignedEventIds,
        loading,
        error,
        login,
        register,
        logout,
        resetPassword,
        updateParticipantProfile,
        registerForEvent,
        createTeam,
        joinTeam,
        requestJoinTeam,
        approveJoinRequest,
        rejectJoinRequest,
        renameTeam,
        removeMemberFromTeam,
        disbandTeam,
        leaveTeam,
        getDigitalPass,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
};
