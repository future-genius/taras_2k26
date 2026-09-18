import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import jsQR from 'jsqr';
import type { TARASEvent } from '../../types/event';
import { useAuth } from '../../context/AuthContext';
import {
  db,
  firestore,
  runAtomicEventCheckIn,
  runAtomicVenueCheckIn,
  runAtomicUpdateAttendance,
  cleanScanToken,
} from '../../config/firebase';
import {
  getCoordinatorEventTeams,
  saveTeamRound1Result,
  saveTeamRound2Result,
} from '../../services/coordinatorService';
import type {
  CoordinatorTeamItem,
  Round1ResultStatus,
  Round2ResultStatus,
} from '../../types/round1';
import type { EventAttendanceRound } from '../../types/eventDay';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import {
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Search,
  Users,
  AlertCircle,
  Award,
  RefreshCw,
  Check,
  X,
  Camera,
  RotateCcw,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Trophy,
  Medal,
  Activity,
  DoorOpen,
  Sparkles,
} from 'lucide-react';

interface EventControlConsoleProps {
  event: TARASEvent;
  coordinatorUid: string;
}

interface ParticipantRegistrationItem {
  id: string; // uid
  participantId: string;
  fullName: string;
  college: string;
  isTeam: boolean;
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  venueCheckIn: boolean;
  eventAttendance: 'NOT_MARKED' | 'PRESENT' | 'ABSENT';
  round1Attendance?: 'NOT_MARKED' | 'PRESENT' | 'ABSENT';
  round2Attendance?: 'NOT_MARKED' | 'PRESENT' | 'ABSENT';
}

export const EventControlConsole: React.FC<EventControlConsoleProps> = ({
  event,
  coordinatorUid,
}) => {
  const { assignedEventIds, role } = useAuth();

  // Strict Event Scope Guard
  const isAuthorized =
    assignedEventIds.includes(event.id) ||
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'PRESIDENT';

  const [activeTab, setActiveTab] = useState<'teams' | 'scoring' | 'checkin' | 'attendance'>('teams');
  const [selectedRound, setSelectedRound] = useState<EventAttendanceRound>('ROUND_1');
  const [scanCheckpoint, setScanCheckpoint] = useState<'ROUND_1' | 'ROUND_2'>('ROUND_1');

  // Teams State (Assigned Event Scope Only)
  const [eventTeams, setEventTeams] = useState<CoordinatorTeamItem[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamResultFilter, setTeamResultFilter] = useState<'ALL' | 'SELECTED' | 'NOT_SELECTED' | 'NOT_DECLARED'>('ALL');
  const [teamR2ResultFilter, setTeamR2ResultFilter] = useState<'ALL' | 'WINNER' | 'RUNNER_UP' | 'NOT_SELECTED' | 'NOT_DECLARED'>('ALL');
  const [inspectedTeam, setInspectedTeam] = useState<CoordinatorTeamItem | null>(null);

  // Scoring / Result State (Round 1 & Round 2)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [resultSuccessMsg, setResultSuccessMsg] = useState<string | null>(null);
  const [resultErrorMsg, setResultErrorMsg] = useState<string | null>(null);

  const [isSavingR2Result, setIsSavingR2Result] = useState(false);
  const [r2SuccessMsg, setR2SuccessMsg] = useState<string | null>(null);
  const [r2ErrorMsg, setR2ErrorMsg] = useState<string | null>(null);

  // Check-In & Attendance State
  const [scanInput, setScanInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [registeredParticipants, setRegisteredParticipants] = useState<ParticipantRegistrationItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Camera QR Scanner State & Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCameraActiveRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const isProcessingScanRef = useRef(false);
  const barcodeDetectorRef = useRef<any>(null);

  // Initialize native BarcodeDetector API if available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        });
      } catch {
        barcodeDetectorRef.current = null;
      }
    }
  }, []);

  if (!isAuthorized) {
    return (
      <div className="p-8 rounded-3xl bg-[#1a0000] border border-[#b91c1c] text-center space-y-3 font-mono">
        <ShieldAlert className="w-10 h-10 text-[#b91c1c] mx-auto" />
        <h3 className="text-base font-bold text-white uppercase tracking-wider">
          ACCESS RESTRICTED — EVENT BOUNDARY ENFORCED
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          You do not have coordinator permissions for "{event.name}". You may only access your assigned event track.
        </p>
      </div>
    );
  }

  // Helper to parse JSON or formatted QR strings or URLs
  const parseScannedQr = (raw: string): string => {
    return cleanScanToken(raw);
  };

  // Fetch Event Teams and Attendees strictly scoped to this eventId
  const loadEventData = async () => {
    setIsLoadingTeams(true);
    try {
      // 1. Fetch strictly scoped teams and Round 1 results via coordinator service
      const teams = await getCoordinatorEventTeams(event.id, coordinatorUid);
      setEventTeams(teams);

      // Auto-select first team if none selected
      if (!selectedTeamId && teams.length > 0) {
        setSelectedTeamId(teams[0].teamId);
      }

      // 2. Query registrations strictly for this eventId
      const regs = await db.queryWhere('registrations', 'eventId', event.id);

      const participantMap = new Map<string, ParticipantRegistrationItem>();

      // Apply Paper-X-Verse internal/external partitioning if applicable
      let filteredRegs = (regs as any[]).filter(
        (r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED'
      );

      if (event.id === 'taras-01-int' || event.id === 'paper-x-verse-internal') {
        filteredRegs = filteredRegs.filter(
          (r) => r.participantType === 'internal' || r.eventId === 'taras-01-int'
        );
      } else if (event.id === 'taras-01-ext' || event.id === 'paper-x-verse-external') {
        filteredRegs = filteredRegs.filter(
          (r) => r.participantType === 'external' || r.eventId === 'taras-01-ext'
        );
      }

      // Process registrations
      await Promise.all(
        filteredRegs.map(async (r) => {
          const uid = r.uid as string;
          if (!uid) return;
          try {
            const pDoc = await db.getDoc('participants', uid);
            const pData = (pDoc.data as Record<string, unknown>) || {};
            const attMap = (pData.attendanceStatus as Record<string, string>) || {};

            participantMap.set(uid, {
              id: uid,
              participantId: (r.participantId as string) || (pData.participantId as string) || 'N/A',
              fullName: (pData.fullName as string) || (r.participantName as string) || (r.teamLeaderName as string) || 'Participant',
              college: (pData.college as string) || (r.college as string) || 'Institution',
              isTeam: r.isTeamEvent === true || event.maxTeamSize > 1,
              teamId: (r.teamId as string) || undefined,
              teamName: (r.teamName as string) || undefined,
              venueCheckIn: pData.venueCheckIn === true || pData.venueCheckInStatus === 'CHECKED_IN',
              eventAttendance: (attMap[event.id] as any) || (r.eventAttendance as any) || 'NOT_MARKED',
              round1Attendance: (attMap[`${event.id}_ROUND_1`] as any) || (attMap[event.id] as any) || (r.eventAttendance as any) || 'NOT_MARKED',
              round2Attendance: (attMap[`${event.id}_ROUND_2`] as any) || 'NOT_MARKED',
            });
          } catch {
            // fallback if pDoc missing
          }
        })
      );

      setRegisteredParticipants(Array.from(participantMap.values()));
    } catch (err: any) {
      console.error('[EventControlConsole] Failed to load event data:', err);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadEventData();

    // Real-Time Subscriptions for Event Isolation Scoped Data
    const regsRef = collection(firestore, 'registrations');
    const qRegs = query(regsRef, where('eventId', '==', event.id));
    const unsubRegs = onSnapshot(qRegs, () => {
      if (isMounted) loadEventData();
    });

    const r1Ref = collection(firestore, 'round1_results');
    const qR1 = query(r1Ref, where('eventId', '==', event.id));
    const unsubR1 = onSnapshot(qR1, () => {
      if (isMounted) loadEventData();
    });

    const r2Ref = collection(firestore, 'round2_results');
    const qR2 = query(r2Ref, where('eventId', '==', event.id));
    const unsubR2 = onSnapshot(qR2, () => {
      if (isMounted) loadEventData();
    });

    const teamsRef = collection(firestore, 'teams');
    const unsubTeams = onSnapshot(teamsRef, () => {
      if (isMounted) loadEventData();
    });

    return () => {
      isMounted = false;
      unsubRegs();
      unsubR1();
      unsubR2();
      unsubTeams();
    };
  }, [event.id]);

  // Selected Team for Evaluation
  const currentSelectedTeam = eventTeams.find((t) => t.teamId === selectedTeamId) || eventTeams[0];

  // ─── Round 1 Result Handler ───────────────────────────────────────────────
  const handleSaveRound1Outcome = async (outcome: Round1ResultStatus) => {
    if (!currentSelectedTeam) {
      setResultErrorMsg('Please select a team to record their Round 1 result.');
      return;
    }

    setIsSavingResult(true);
    setResultSuccessMsg(null);
    setResultErrorMsg(null);

    try {
      await saveTeamRound1Result({
        eventId: event.id,
        eventName: event.name,
        teamId: currentSelectedTeam.teamId,
        teamName: currentSelectedTeam.teamName,
        teamCode: currentSelectedTeam.teamCode,
        registrationId: currentSelectedTeam.registrationId,
        round1Result: outcome,
        coordinatorUid,
      });

      const nowStr = new Date().toISOString();
      setEventTeams((prev) =>
        prev.map((t) =>
          t.teamId === currentSelectedTeam.teamId
            ? {
                ...t,
                round1Result: outcome,
                round1UpdatedAt: nowStr,
                round1UpdatedBy: coordinatorUid,
              }
            : t
        )
      );

      const statusLabel =
        outcome === 'SELECTED' ? 'Selected for Next Round' : 'Not Selected for Next Round';
      setResultSuccessMsg(
        `Round 1 Result saved for "${currentSelectedTeam.teamName}": ${statusLabel}`
      );
    } catch (err: any) {
      setResultErrorMsg(err.message || 'Failed to save Round 1 result.');
    } finally {
      setIsSavingResult(false);
    }
  };

  // ─── Round 2 (Final Result) Handler ───────────────────────────────────────
  const handleSaveRound2Outcome = async (outcome: Round2ResultStatus) => {
    if (!currentSelectedTeam) {
      setR2ErrorMsg('Please select a team to record their Round 2 final result.');
      return;
    }

    if (currentSelectedTeam.round1Result !== 'SELECTED') {
      setR2ErrorMsg(
        `Cannot declare Round 2 Final Result: "${currentSelectedTeam.teamName}" was not selected in Round 1. Only teams marked "Selected for Next Round" can receive a Round 2 final outcome.`
      );
      return;
    }

    setIsSavingR2Result(true);
    setR2SuccessMsg(null);
    setR2ErrorMsg(null);

    try {
      await saveTeamRound2Result({
        eventId: event.id,
        eventName: event.name,
        teamId: currentSelectedTeam.teamId,
        teamName: currentSelectedTeam.teamName,
        teamCode: currentSelectedTeam.teamCode,
        registrationId: currentSelectedTeam.registrationId,
        round2Result: outcome,
        coordinatorUid,
      });

      const nowStr = new Date().toISOString();
      setEventTeams((prev) =>
        prev.map((t) =>
          t.teamId === currentSelectedTeam.teamId
            ? {
                ...t,
                round2Result: outcome,
                round2UpdatedAt: nowStr,
                round2UpdatedBy: coordinatorUid,
              }
            : t
        )
      );

      const statusLabel =
        outcome === 'WINNER' ? '🏆 Winner' : outcome === 'RUNNER_UP' ? '🥈 Runner-Up' : 'Not Selected';
      setR2SuccessMsg(
        `Round 2 Final Result saved for "${currentSelectedTeam.teamName}": ${statusLabel}`
      );
    } catch (err: any) {
      setR2ErrorMsg(err.message || 'Failed to save Round 2 final result.');
    } finally {
      setIsSavingR2Result(false);
    }
  };

  // ─── Check-In Handler for Event Round 1 & Round 2 ───────────────────────────
  const executeCheckInWithToken = async (tokenOrId: string) => {
    const clean = parseScannedQr(tokenOrId);
    if (!clean) return;

    setIsCheckingIn(true);
    setCheckInSuccess(null);
    setCheckInError(null);

    try {
      const targetRound: EventAttendanceRound = scanCheckpoint === 'ROUND_2' ? 'ROUND_2' : 'ROUND_1';
      const res = await runAtomicEventCheckIn(event.id, event.name, clean, coordinatorUid, targetRound);
      const part = res.participant as any;
      const label = targetRound === 'ROUND_2' ? 'Round 2' : 'Round 1';
      
      if (res.isAlreadyCheckedIn) {
        setCheckInError(
          `Already Scanned for ${label}: ${part?.fullName || 'Participant'} (${part?.participantId || 'N/A'})`
        );
      } else {
        setCheckInSuccess(
          `✓ ${label} Attendance Recorded: ${part?.fullName || 'Participant'} (${part?.participantId || 'N/A'})`
        );
        setScanInput('');
        loadEventData();
      }
    } catch (err: any) {
      setCheckInError(err.message || 'Check-in failed.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleEventCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCheckInWithToken(scanInput);
  };

  // ─── Attendance Quick Action ──────────────────────────────────────────────
  const handleAttendanceChange = async (
    targetUid: string,
    newStatus: 'PRESENT' | 'ABSENT',
    targetRound: EventAttendanceRound = selectedRound
  ) => {
    try {
      await runAtomicUpdateAttendance(
        event.id,
        event.name,
        targetUid,
        newStatus,
        targetRound,
        coordinatorUid,
        'coordinator'
      );
      setRegisteredParticipants((prev) =>
        prev.map((p) => (p.id === targetUid ? { ...p, eventAttendance: newStatus } : p))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance');
    }
  };

  // ─── Real-Time Camera QR Frame Scanner Loop ────────────────────────────────
  const scanFrame = async () => {
    if (!isCameraActiveRef.current) return;

    const video = videoRef.current;
    const now = performance.now();

    if (video && video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      if (now - lastScanTimeRef.current >= 90) {
        lastScanTimeRef.current = now;

        let detectedValue: string | null = null;

        // 1. Try BarcodeDetector native API
        if (barcodeDetectorRef.current) {
          try {
            const barcodes = await barcodeDetectorRef.current.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              detectedValue = barcodes[0].rawValue;
            }
          } catch {
            // fallback to jsQR below
          }
        }

        // 2. Fallback to jsQR canvas processing
        if (!detectedValue) {
          try {
            if (!canvasRef.current) {
              canvasRef.current = document.createElement('canvas');
            }
            const canvas = canvasRef.current;
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            canvas.width = vw;
            canvas.height = vh;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, vw, vh);
              const imageData = ctx.getImageData(0, 0, vw, vh);
              const qr = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (qr && qr.data && qr.data.trim()) {
                detectedValue = qr.data.trim();
              }
            }
          } catch (e) {
            console.warn('QR frame scan error:', e);
          }
        }

        // Execute check-in on valid scan
        if (detectedValue && !isProcessingScanRef.current) {
          isProcessingScanRef.current = true;
          const cleanToken = parseScannedQr(detectedValue);
          setScanInput(cleanToken);
          await executeCheckInWithToken(cleanToken);
          setTimeout(() => {
            isProcessingScanRef.current = false;
          }, 1500);
        }
      }
    }

    if (isCameraActiveRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  };

  const startCamera = async (targetFacing?: 'environment' | 'user') => {
    setCameraError(null);
    const mode = targetFacing || facingMode;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera scanner is not supported on this browser. Please use manual entry.');
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // autoplay handling
        }
      }
      setIsCameraActive(true);
      isCameraActiveRef.current = true;
      isProcessingScanRef.current = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access denied. Please allow camera permissions in browser.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera device found. Please use manual token entry.');
      } else {
        setCameraError(err.message || 'Camera initialization failed.');
      }
      setIsCameraActive(false);
      isCameraActiveRef.current = false;
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    isCameraActiveRef.current = false;
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    stopCamera();
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    setTimeout(() => startCamera(nextMode), 150);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Filtered teams list
  const filteredTeams = eventTeams.filter((t) => {
    const q = teamSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.teamName.toLowerCase().includes(q) ||
      t.teamCode.toLowerCase().includes(q) ||
      t.members.some((m) => m.fullName.toLowerCase().includes(q) || m.participantId.toLowerCase().includes(q));

    let matchesR1 = true;
    if (teamResultFilter === 'SELECTED') matchesR1 = t.round1Result === 'SELECTED';
    else if (teamResultFilter === 'NOT_SELECTED') matchesR1 = t.round1Result === 'NOT_SELECTED';
    else if (teamResultFilter === 'NOT_DECLARED') matchesR1 = !t.round1Result || t.round1Result === 'NOT_DECLARED';

    let matchesR2 = true;
    if (teamR2ResultFilter === 'WINNER') matchesR2 = t.round2Result === 'WINNER';
    else if (teamR2ResultFilter === 'RUNNER_UP') matchesR2 = t.round2Result === 'RUNNER_UP';
    else if (teamR2ResultFilter === 'NOT_SELECTED') matchesR2 = t.round2Result === 'NOT_SELECTED';
    else if (teamR2ResultFilter === 'NOT_DECLARED') matchesR2 = !t.round2Result || t.round2Result === 'NOT_DECLARED';

    return matchesSearch && matchesR1 && matchesR2;
  });

  // Filtered attendees list
  const filteredParticipants = registeredParticipants.filter((p) => {
    const q = searchFilter.toLowerCase();
    const matchesSearch =
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.participantId.toLowerCase().includes(q) ||
      p.college.toLowerCase().includes(q) ||
      (p.teamName && p.teamName.toLowerCase().includes(q));

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'PRESENT') return matchesSearch && p.eventAttendance === 'PRESENT';
    if (statusFilter === 'ABSENT') return matchesSearch && p.eventAttendance === 'ABSENT';
    if (statusFilter === 'NOT_MARKED') return matchesSearch && p.eventAttendance === 'NOT_MARKED';
    if (statusFilter === 'GATE_CHECKED') return matchesSearch && p.venueCheckIn;
    return matchesSearch;
  });

  const totalRegisteredAttendees = registeredParticipants.length;
  const gateCheckedInCount = registeredParticipants.filter((p) => p.venueCheckIn).length;
  const presentCount = registeredParticipants.filter((p) => p.eventAttendance === 'PRESENT').length;
  const round1SelectedCount = eventTeams.filter((t) => t.round1Result === 'SELECTED').length;
  const round1NotSelectedCount = eventTeams.filter((t) => t.round1Result === 'NOT_SELECTED').length;
  const round2WinnerCount = eventTeams.filter((t) => t.round2Result === 'WINNER').length;
  const round2RunnerUpCount = eventTeams.filter((t) => t.round2Result === 'RUNNER_UP').length;

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/40 space-y-8">
      {/* ── Header & Track Operational Summary ── */}
      <div className="space-y-4 border-b border-white/10 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="crimson">{event.category}</Badge>
              <Badge variant="outline">{event.venue}</Badge>
              <Badge variant="outline">
                {event.type === 'TEAM' ? `Team (${event.minTeamSize}-${event.maxTeamSize})` : 'Individual'}
              </Badge>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                ACTIVE TRACK
              </span>
            </div>
            <h2 className="text-2xl font-black text-white font-mono uppercase tracking-tight">
              {event.name}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Assigned Track Console // Teams, Gate Verification, Round 1 &amp; Round 2 Final Outcomes
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadEventData}
            disabled={isLoadingTeams}
            className="text-xs font-mono shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingTeams ? 'animate-spin' : ''}`} />
            Sync Track Data
          </Button>
        </div>

        {/* Live Counters Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3 rounded-2xl bg-[#0a0c10] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Enrolled Candidates
            </span>
            <span className="text-xl font-bold text-white font-mono">{registeredParticipants.length}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#0a0c10] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Gate Cleared
            </span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{gateCheckedInCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#1a0000]/60 border border-[#b91c1c]/40">
            <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider block">
              Hall Present
            </span>
            <span className="text-xl font-bold text-[#b91c1c] font-mono">{presentCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#0a0c10] border border-green-900/40">
            <span className="text-[10px] font-mono text-green-400 uppercase tracking-wider block">
              R1 Selected
            </span>
            <span className="text-xl font-bold text-green-400 font-mono">{round1SelectedCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#0a0c10] border border-rose-900/40">
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">
              R1 Eliminated
            </span>
            <span className="text-xl font-bold text-rose-400 font-mono">{round1NotSelectedCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#0a0c10] border border-amber-900/50">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block flex items-center gap-1">
              🏆 R2 Winner
            </span>
            <span className="text-xl font-bold text-amber-300 font-mono">{round2WinnerCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#0a0c10] border border-blue-900/50">
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block flex items-center gap-1">
              🥈 Runner-Up
            </span>
            <span className="text-xl font-bold text-blue-300 font-mono">{round2RunnerUpCount}</span>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-800">
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'teams'
              ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
              : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-[#b91c1c]" />
          [TEAMS &amp; MEMBERS ({eventTeams.length})]
        </button>

        <button
          onClick={() => setActiveTab('scoring')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'scoring'
              ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
              : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-[#b91c1c]" />
          [ROUND 1 &amp; 2 RESULT ENGINE]
        </button>

        <button
          onClick={() => setActiveTab('checkin')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'checkin'
              ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
              : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4 text-[#b91c1c]" />
          [SCAN PASS &amp; CHECKIN]
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
              : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-[#b91c1c]" />
          [ATTENDANCE REGISTER ({presentCount}/{totalRegisteredAttendees})]
        </button>
      </div>

      {/* ── TAB 1: COORDINATOR TEAM LIST & MEMBER DETAILS ── */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search teams by name, team code, or member name..."
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10] border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">R1:</span>
              {(['ALL', 'SELECTED', 'NOT_SELECTED', 'NOT_DECLARED'] as const).map((filterVal) => (
                <button
                  key={`r1-${filterVal}`}
                  onClick={() => setTeamResultFilter(filterVal)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all ${
                    teamResultFilter === filterVal
                      ? 'bg-[#b91c1c] text-white shadow-sm'
                      : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {filterVal === 'ALL'
                    ? 'All'
                    : filterVal === 'SELECTED'
                    ? 'Selected'
                    : filterVal === 'NOT_SELECTED'
                    ? 'Not Selected'
                    : 'Not Declared'}
                </button>
              ))}

              <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0 ml-2">R2:</span>
              {(['ALL', 'WINNER', 'RUNNER_UP', 'NOT_SELECTED', 'NOT_DECLARED'] as const).map((filterVal) => (
                <button
                  key={`r2-${filterVal}`}
                  onClick={() => setTeamR2ResultFilter(filterVal)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all ${
                    teamR2ResultFilter === filterVal
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {filterVal === 'ALL'
                    ? 'All'
                    : filterVal === 'WINNER'
                    ? '🏆 Winner'
                    : filterVal === 'RUNNER_UP'
                    ? '🥈 Runner-Up'
                    : filterVal === 'NOT_SELECTED'
                    ? 'Not Selected'
                    : 'Not Declared'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a0c10] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Team Name &amp; Code</th>
                  <th className="p-3">Registration Status</th>
                  <th className="p-3">Members Count</th>
                  <th className="p-3">Round 1 Result</th>
                  <th className="p-3">Round 2 — Final Result</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#06080c]">
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                      {isLoadingTeams ? 'Loading assigned track teams…' : 'No teams found registered for this event track.'}
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => (
                    <tr key={team.teamId} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white text-sm">{team.teamName}</div>
                        <div className="text-[10px] text-[#b91c1c] font-mono mt-0.5">
                          Code: {team.teamCode}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            team.registrationStatus === 'CONFIRMED'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {team.registrationStatus}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        <span className="font-bold text-white">{team.members.length}</span> Members
                      </td>
                      <td className="p-3">
                        {team.round1Result === 'SELECTED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/40 inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Selected for Next Round
                          </span>
                        ) : team.round1Result === 'NOT_SELECTED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 inline-flex items-center gap-1">
                            <X className="w-3 h-3" /> Not Selected for Next Round
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Result Not Declared
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {team.round2Result === 'WINNER' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                            <Trophy className="w-3 h-3 text-amber-400" /> Winner
                          </span>
                        ) : team.round2Result === 'RUNNER_UP' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 inline-flex items-center gap-1">
                            <Medal className="w-3 h-3 text-blue-400" /> Runner-Up
                          </span>
                        ) : team.round2Result === 'NOT_SELECTED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 inline-flex items-center gap-1">
                            <X className="w-3 h-3" /> Not Selected
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Result Not Declared
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectedTeam(team)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition-colors"
                          >
                            View Members
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTeamId(team.teamId);
                              setActiveTab('scoring');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#1a0000] hover:bg-[#b91c1c] text-white border border-[#b91c1c]/60 text-[10px] font-mono transition-colors inline-flex items-center gap-1"
                          >
                            Evaluate <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {inspectedTeam && (
            <Modal
              isOpen={!!inspectedTeam}
              onClose={() => setInspectedTeam(null)}
              title={`Team Roster: ${inspectedTeam.teamName} [${inspectedTeam.teamCode}]`}
            >
              <div className="space-y-4 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[#0a0c10] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assigned Event</span>
                    <span className="text-white font-bold">{event.name}</span>
                  </div>
                  <Badge variant="outline">{inspectedTeam.members.length} Members</Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Enrolled Team Members
                  </h4>
                  <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-[#06080c] overflow-hidden">
                    {inspectedTeam.members.map((member) => (
                      <div key={member.uid} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{member.fullName}</span>
                            {member.isLeader && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                LEADER
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ID: <span className="text-slate-200">{member.participantId}</span> • College: <span className="text-slate-200">{member.college}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInspectedTeam(null)}
                    className="font-mono text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ── TAB 2: STREAMLINED SCORING ENGINE ── */}
      {activeTab === 'scoring' && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Award className="w-4 h-4 text-[#b91c1c]" />
              ROUND 1 &amp; 2 FINAL RESULT ENGINE — {event.name}
            </h4>
            <p className="text-xs text-slate-400 font-light">
              Select a registered team to evaluate Round 1 progression and declare Round 2 final podium outcomes (Winner / Runner-Up).
            </p>
          </div>

          {resultSuccessMsg && (
            <div className="p-4 rounded-2xl bg-[#1a0000] border border-green-500/60 text-green-400 flex items-center gap-2 text-xs font-mono font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{resultSuccessMsg}</span>
            </div>
          )}

          {resultErrorMsg && (
            <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-[#b91c1c] flex items-center gap-2 text-xs font-mono font-bold animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{resultErrorMsg}</span>
            </div>
          )}

          {r2SuccessMsg && (
            <div className="p-4 rounded-2xl bg-[#1a0000] border border-amber-500/60 text-amber-400 flex items-center gap-2 text-xs font-mono font-bold animate-fadeIn">
              <Trophy className="w-5 h-5 shrink-0" />
              <span>{r2SuccessMsg}</span>
            </div>
          )}

          {r2ErrorMsg && (
            <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-[#b91c1c] flex items-center gap-2 text-xs font-mono font-bold animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{r2ErrorMsg}</span>
            </div>
          )}

          <div className="space-y-2 font-mono">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Select Team to Evaluate
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setResultSuccessMsg(null);
                setResultErrorMsg(null);
                setR2SuccessMsg(null);
                setR2ErrorMsg(null);
              }}
              className="w-full px-4 py-3 bg-[#0a0c10] border border-[#b91c1c]/40 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#b91c1c]"
            >
              <option value="">-- Choose Registered Team --</option>
              {eventTeams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  [TEAM] {t.teamName} ({t.teamCode}) — {t.members.length} members
                </option>
              ))}
            </select>
          </div>

          {currentSelectedTeam ? (
            <div className="space-y-6 pt-2 font-mono">
              <div className="p-5 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Selected Team</span>
                  <span className="text-[10px] text-amber-400 font-bold">Code: {currentSelectedTeam.teamCode}</span>
                </div>
                <div className="text-xl font-black text-white">{currentSelectedTeam.teamName}</div>
                <p className="text-xs text-slate-400">
                  Members: {currentSelectedTeam.members.map((m) => m.fullName).join(', ') || 'Roster pending'}
                </p>
              </div>

              {/* Section 1 — Round 1 Result */}
              <div className="p-6 rounded-3xl bg-[#08090d] border border-slate-800 space-y-4">
                <div>
                  <h5 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#b91c1c]" /> Section 1 — Round 1 Result
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Record whether this team is selected to progress to the next round.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <button
                    type="button"
                    disabled={isSavingResult}
                    onClick={() => handleSaveRound1Outcome('SELECTED')}
                    className={`py-4 px-5 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                      currentSelectedTeam.round1Result === 'SELECTED'
                        ? 'bg-green-600 text-white border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                        : 'bg-[#0a0c10] text-green-400 hover:bg-green-950/60 border-green-800/60'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    [ Selected for Next Round ]
                  </button>

                  <button
                    type="button"
                    disabled={isSavingResult}
                    onClick={() => handleSaveRound1Outcome('NOT_SELECTED')}
                    className={`py-4 px-5 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                      currentSelectedTeam.round1Result === 'NOT_SELECTED'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                        : 'bg-[#0a0c10] text-rose-400 hover:bg-rose-950/60 border-rose-800/60'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    [ Not Selected for Next Round ]
                  </button>
                </div>

                {isSavingResult && (
                  <p className="text-xs text-amber-400 text-center font-mono animate-pulse">
                    Saving Round 1 decision to TARAS registry…
                  </p>
                )}
              </div>

              {/* Section 2 — Round 2 — Final Result */}
              <div className="p-6 rounded-3xl bg-[#08090d] border border-slate-800 space-y-4">
                <div>
                  <h5 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Section 2 — Round 2 — Final Result
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Declare the final event podium results (Winner / Runner-Up / Not Selected) for teams qualified from Round 1.
                  </p>
                </div>

                {currentSelectedTeam.round1Result !== 'SELECTED' ? (
                  <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Round 2 Locked:</span> Round 2 Final Result is reserved for teams advancing from Round 1. Mark this team as <strong className="text-white">"Selected for Next Round"</strong> in Section 1 above to enable Final Result evaluation.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isSavingR2Result}
                      onClick={() => handleSaveRound2Outcome('WINNER')}
                      className={`py-3.5 px-4 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                        currentSelectedTeam.round2Result === 'WINNER'
                          ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                          : 'bg-[#0a0c10] text-amber-400 hover:bg-amber-950/60 border-amber-800/60'
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                      [ 🏆 Winner ]
                    </button>

                    <button
                      type="button"
                      disabled={isSavingR2Result}
                      onClick={() => handleSaveRound2Outcome('RUNNER_UP')}
                      className={`py-3.5 px-4 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                        currentSelectedTeam.round2Result === 'RUNNER_UP'
                          ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                          : 'bg-[#0a0c10] text-blue-400 hover:bg-blue-950/60 border-blue-800/60'
                      }`}
                    >
                      <Medal className="w-4 h-4" />
                      [ 🥈 Runner-Up ]
                    </button>

                    <button
                      type="button"
                      disabled={isSavingR2Result}
                      onClick={() => handleSaveRound2Outcome('NOT_SELECTED')}
                      className={`py-3.5 px-4 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                        currentSelectedTeam.round2Result === 'NOT_SELECTED'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                          : 'bg-[#0a0c10] text-rose-400 hover:bg-rose-950/60 border-rose-800/60'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      [ ✕ Not Selected ]
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#0a0c10] border border-slate-800 text-center text-slate-500 text-xs font-mono">
              No team selected or no teams registered for this track.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: GATE PREREQUISITE & MULTI-STAGE QR SCANNING ── */}
      {activeTab === 'checkin' && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-4 rounded-2xl bg-[#1a0000]/80 border border-[#b91c1c]/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-200 font-light leading-relaxed font-mono">
                <strong className="text-white">Event-Specific QR Verification:</strong> Select the event round (Round 1 or Round 2) to scan participant QR passes. Gate clearance at the ground floor registration desk is a mandatory prerequisite.
              </p>
            </div>
          </div>

          {/* Checkpoint Target Selector */}
          <div className="space-y-2 font-mono">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Select Scanner Round Target:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScanCheckpoint('ROUND_1')}
                className={`p-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  scanCheckpoint === 'ROUND_1'
                    ? 'bg-[#1a0000] text-white border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
                    : 'bg-[#0a0c10] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4 text-[#b91c1c]" />
                📍 Event Scanner (Round 1)
              </button>

              <button
                type="button"
                onClick={() => setScanCheckpoint('ROUND_2')}
                className={`p-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  scanCheckpoint === 'ROUND_2'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-[#0a0c10] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                🚀 Event Scanner (Round 2 — Selected Only)
              </button>
            </div>
          </div>

          {checkInSuccess && (
            <div className="p-4 rounded-2xl bg-[#1a0000] border border-green-500/60 text-green-400 flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-xs font-mono font-bold">{checkInSuccess}</span>
            </div>
          )}

          {checkInError && (
            <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-[#b91c1c] flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-xs font-mono font-bold">{checkInError}</span>
            </div>
          )}

          {cameraError && (
            <div className="p-4 rounded-2xl bg-[#1a0808] border border-[#b91c1c] text-xs font-mono text-rose-300">
              {cameraError}
            </div>
          )}

          {/* Camera Scanner Viewfinder */}
          <div
            className={`relative rounded-2xl overflow-hidden border-2 border-[#b91c1c] bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center transition-all duration-300 ${
              isCameraActive ? 'block' : 'hidden'
            }`}
          >
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            
            {/* Scannable Target Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-[#b91c1c] rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center relative">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#dc2626] to-transparent animate-scanline absolute" />
                <span className="text-[10px] font-mono text-white bg-black/80 px-2 py-1 rounded border border-[#b91c1c]/50">
                  ALIGN QR PASS WITHIN BOX
                </span>
              </div>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-2 rounded-xl bg-black/80 text-white border border-white/20 hover:border-red-500 transition-colors"
                title="Switch Camera"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="p-2 rounded-xl bg-black/80 text-white border border-white/20 hover:border-red-500 transition-colors"
                title="Close Camera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleEventCheckInSubmit} className="space-y-4 font-mono">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Scan Participant QR Pass / Enter Participant ID or Token
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. QR-TARAS26-89420194 or TARAS26-89420194"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-[#0a0c10] border border-[#b91c1c]/50 rounded-2xl text-sm font-mono text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="glow"
                size="lg"
                type="submit"
                disabled={isCheckingIn}
                className="w-full sm:flex-1 justify-center font-mono py-4 text-sm font-bold"
              >
                {isCheckingIn
                  ? 'Verifying Check-In…'
                  : `Confirm Check-In for [${scanCheckpoint.replace('_', ' ')}]`}
              </Button>

              {!isCameraActive ? (
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full sm:w-auto font-mono text-xs py-4 px-5"
                >
                  <Camera className="w-4 h-4 mr-2" /> Start Camera Scanner
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  onClick={stopCamera}
                  className="w-full sm:w-auto font-mono text-xs py-4 px-5"
                >
                  Stop Camera Scanner
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 4: ATTENDANCE MONITORING REGISTER (GATE, ROUND 1, ROUND 2) ── */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search registered candidate or team..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10] border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {['ALL', 'PRESENT', 'ABSENT', 'NOT_MARKED', 'GATE_CHECKED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap ${
                    statusFilter === st ? 'bg-[#b91c1c] text-white' : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a0c10] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Candidate / Team</th>
                  <th className="p-3">Institution</th>
                  <th className="p-3">Gate Entry Status</th>
                  <th className="p-3">Round 1 Attendance</th>
                  <th className="p-3">Round 2 Attendance</th>
                  <th className="p-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#06080c]">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                      No attendees matched your filter.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white">{p.fullName}</div>
                        <div className="text-[10px] text-[#b91c1c] font-mono">
                          {p.participantId} {p.teamName ? `• ${p.teamName}` : ''}
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">{p.college}</td>
                      <td className="p-3">
                        {p.venueCheckIn ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 inline-flex items-center gap-1">
                            <DoorOpen className="w-3 h-3 text-emerald-400" /> GATE CLEARED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500">
                            NOT AT VENUE
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {p.eventAttendance === 'PRESENT' || p.round1Attendance === 'PRESENT' ? (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/40 flex items-center gap-1 w-fit">
                            <Check className="w-3.5 h-3.5" /> PRESENT
                          </span>
                        ) : p.eventAttendance === 'ABSENT' || p.round1Attendance === 'ABSENT' ? (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 w-fit">
                            <X className="w-3.5 h-3.5" /> ABSENT
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-slate-800 text-slate-400">
                            NOT MARKED
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {p.round2Attendance === 'PRESENT' ? (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-fit">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" /> R2 PRESENT
                          </span>
                        ) : p.round2Attendance === 'ABSENT' ? (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 w-fit">
                            <X className="w-3.5 h-3.5" /> R2 ABSENT
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-slate-800 text-slate-400">
                            NOT MARKED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAttendanceChange(p.id, 'PRESENT', 'ROUND_1')}
                            disabled={!p.venueCheckIn}
                            title={!p.venueCheckIn ? 'Gate Check-in prerequisite not fulfilled' : 'Mark Round 1 Present'}
                            className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all ${
                              p.eventAttendance === 'PRESENT'
                                ? 'bg-green-600 text-white'
                                : p.venueCheckIn
                                ? 'bg-slate-800 text-green-400 hover:bg-green-600 hover:text-white'
                                : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            R1 Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(p.id, 'PRESENT', 'ROUND_2')}
                            disabled={!p.venueCheckIn}
                            title={!p.venueCheckIn ? 'Gate Check-in prerequisite not fulfilled' : 'Mark Round 2 Present'}
                            className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all ${
                              p.round2Attendance === 'PRESENT'
                                ? 'bg-amber-600 text-white'
                                : p.venueCheckIn
                                ? 'bg-slate-800 text-amber-400 hover:bg-amber-600 hover:text-white'
                                : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            R2 Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(p.id, 'ABSENT', 'ROUND_1')}
                            className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all ${
                              p.eventAttendance === 'ABSENT'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-800 text-rose-400 hover:bg-rose-600 hover:text-white'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

          </div>
        </div>
      )}
    </div>
  );
};