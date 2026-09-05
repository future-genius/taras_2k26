import React, { useState, useEffect, useRef } from 'react';
import type { TARASEvent } from '../../types/event';
import {
  db,
  runAtomicEventCheckIn,
  runAtomicSubmitScorecard,
  runAtomicUpdateAttendance,
  runAtomicUpdateShortlist,
} from '../../config/firebase';
import type { Scorecard, EventAttendanceRound } from '../../types/eventDay';
import { getEventScoringCriteria } from '../../data/scoringCriteria';
import { computeDeterministicRanking } from '../../services/rankingEngine';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import jsQR from 'jsqr';
import {
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Search,
  Users,
  AlertCircle,
  Clock,
  Award,
  Lock,
  ChevronRight,
  Trophy,
  Filter,
  RefreshCw,
  Eye,
  Star,
  Check,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  Camera,
  RotateCcw,
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
  shortlistStatus: 'NOT_EVALUATED' | 'SHORTLISTED' | 'NOT_SHORTLISTED' | 'FINALIST';
}

interface TeamItem {
  teamId: string;
  teamCode: string;
  teamName: string;
  leaderUid: string;
  memberUids: string[];
  members: Array<{ fullName: string; college: string; participantId: string; isLeader: boolean }>;
}

export const EventControlConsole: React.FC<EventControlConsoleProps> = ({ event, coordinatorUid }) => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'attendance' | 'scoring' | 'shortlist' | 'preview'>('checkin');
  const [selectedRound, setSelectedRound] = useState<EventAttendanceRound>('ROUND_1');

  // Check-In State
  const [scanInput, setScanInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Attendees & Teams State
  const [registeredParticipants, setRegisteredParticipants] = useState<ParticipantRegistrationItem[]>([]);
  const [eventTeams, setEventTeams] = useState<TeamItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Configurable Scoring State
  const criteriaList = getEventScoringCriteria(event.id, event.category);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedTargetName, setSelectedTargetName] = useState<string>('');
  const [isTeamTarget, setIsTeamTarget] = useState<boolean>(false);
  const [scoresMap, setScoresMap] = useState<Record<string, number>>({});
  const [judgeNotes, setJudgeNotes] = useState<string>('');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSuccess, setScoreSuccess] = useState<string | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);

  // Initialize scores map when criteria change or participant selected
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    criteriaList.forEach((c) => {
      initialScores[c.name] = Math.round(c.maxScore * 0.7); // default 70%
    });
    setScoresMap(initialScores);
  }, [event.id]);

  // Fetch Event Participants and Teams
  const fetchParticipantsAndScores = async () => {
    setIsLoadingList(true);
    try {
      // Find all registrations for this event
      const regs = await db.queryWhere('registrations', 'eventId', event.id);

      // Fetch teams for team events
      const teamsData = await db.queryWhere('teams', 'eventId', event.id);
      const teams: TeamItem[] = (teamsData as unknown as TeamItem[]) || [];
      setEventTeams(teams);

      // Concurrently resolve participant profiles in parallel to avoid sequential N+1 roundtrips
      const participantDocs = await Promise.all(
        regs.map(async (r) => {
          const uid = r.uid as string;
          try {
            const pDoc = await db.getDoc('participants', uid);
            return { reg: r, pDoc };
          } catch {
            return { reg: r, pDoc: { exists: false, data: {} } };
          }
        })
      );

      const items: ParticipantRegistrationItem[] = participantDocs.map(({ reg: r, pDoc }) => {
        const uid = r.uid as string;
        const pData = (pDoc.data as Record<string, unknown>) || {};
        const attMap = (pData.attendanceStatus as Record<string, string>) || {};
        const shortMap = (pData.shortlistStatus as Record<string, string>) || {};

        return {
          id: uid,
          participantId: (r.participantId as string) || (pData.participantId as string) || 'N/A',
          fullName: (pData.fullName as string) || (r.participantId as string) || 'Participant',
          college: (pData.college as string) || 'Institution',
          isTeam: r.isTeamEvent === true || event.maxTeamSize > 1,
          teamId: (r.teamId as string) || undefined,
          teamName: (r.teamName as string) || undefined,
          venueCheckIn: pData.venueCheckIn === true || pData.venueCheckInStatus === 'CHECKED_IN',
          eventAttendance: (attMap[event.id] as any) || (r.eventAttendance as any) || 'NOT_MARKED',
          shortlistStatus: (shortMap[event.id] as any) || (r.shortlistStatus as any) || 'NOT_EVALUATED',
        };
      });

      setRegisteredParticipants(items);

      // Fetch scorecards
      const scores = await db.queryWhere('scorecards', 'eventId', event.id);
      setScorecards((scores as unknown as Scorecard[]) || []);
    } catch (err) {
      console.error('Error fetching event data:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchParticipantsAndScores();
  }, [event.id]);

  // Operational metrics
  const totalRegistered = registeredParticipants.length;
  const gateCheckedIn = registeredParticipants.filter((p) => p.venueCheckIn).length;
  const eventCheckedIn = registeredParticipants.filter((p) => p.eventAttendance === 'PRESENT').length;
  const absentCount = registeredParticipants.filter((p) => p.eventAttendance === 'ABSENT').length;
  const shortlistedCount = registeredParticipants.filter((p) => p.shortlistStatus === 'SHORTLISTED' || p.shortlistStatus === 'FINALIST').length;
  const submittedScoresCount = scorecards.filter((s) => s.status === 'SUBMITTED').length;

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isCameraActiveRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const isProcessingScanRef = useRef(false);
  const barcodeDetectorRef = useRef<any>(null);

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
    return () => {
      stopCamera();
    };
  }, []);

  const onQrDecoded = (decoded: string) => {
    if (isProcessingScanRef.current) return;
    let clean = decoded.trim();
    if (!clean) return;

    isProcessingScanRef.current = true;

    try {
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const urlObj = new URL(clean);
        const extracted =
          urlObj.searchParams.get('token') ||
          urlObj.searchParams.get('id') ||
          urlObj.searchParams.get('qr') ||
          urlObj.searchParams.get('qrToken') ||
          urlObj.searchParams.get('participantId');
        if (extracted) clean = extracted.trim();
      }
    } catch {}

    try {
      if (clean.startsWith('{') && clean.endsWith('}')) {
        const parsed = JSON.parse(clean);
        if (parsed.qrToken) clean = parsed.qrToken;
        else if (parsed.participantId) clean = parsed.participantId;
        else if (parsed.token) clean = parsed.token;
        else if (parsed.id) clean = parsed.id;
      }
    } catch {}

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(120); } catch {}
    }

    stopCamera();
    setScanInput(clean);
    executeEventCheckInWithToken(clean);
  };

  const scanFrame = async () => {
    if (!isCameraActiveRef.current) return;

    const video = videoRef.current;
    const now = performance.now();

    if (video && video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      if (now - lastScanTimeRef.current >= 90) {
        lastScanTimeRef.current = now;

        let detected = false;
        if (barcodeDetectorRef.current) {
          try {
            const barcodes = await barcodeDetectorRef.current.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              detected = true;
              onQrDecoded(barcodes[0].rawValue);
              return;
            }
          } catch {
            // fallback
          }
        }

        if (!detected) {
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
                onQrDecoded(qr.data.trim());
                return;
              }
            }
          } catch (e) {
            console.warn('QR scan error:', e);
          }
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
        throw new Error('Camera scanner is not supported on this browser. Please use manual entry or a modern browser.');
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
          // autoplay policy
        }
      }
      setIsCameraActive(true);
      isCameraActiveRef.current = true;
      isProcessingScanRef.current = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera access was denied. Please allow camera permissions in your browser address bar.');
        } else {
          setCameraError(err.message || 'Unable to initialize camera.');
        }
      } else {
        setCameraError('Camera initialization failed.');
      }
      setIsCameraActive(false);
      isCameraActiveRef.current = false;
    }
  };

  const toggleCameraFacing = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (isCameraActive) {
      startCamera(next);
    }
  };

  const stopCamera = () => {
    isCameraActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const executeEventCheckInWithToken = async (rawInput: string) => {
    let clean = rawInput.trim();
    if (!clean) return;

    try {
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const urlObj = new URL(clean);
        const extracted =
          urlObj.searchParams.get('token') ||
          urlObj.searchParams.get('id') ||
          urlObj.searchParams.get('qr') ||
          urlObj.searchParams.get('qrToken') ||
          urlObj.searchParams.get('participantId');
        if (extracted) clean = extracted.trim();
      }
    } catch {}

    try {
      if (clean.startsWith('{') && clean.endsWith('}')) {
        const parsed = JSON.parse(clean);
        if (parsed.qrToken) clean = parsed.qrToken;
        else if (parsed.participantId) clean = parsed.participantId;
        else if (parsed.token) clean = parsed.token;
        else if (parsed.id) clean = parsed.id;
      }
    } catch {}

    setCheckInError(null);
    setCheckInSuccess(null);
    setIsCheckingIn(true);

    try {
      const res = await runAtomicEventCheckIn(event.id, event.name, clean, coordinatorUid, selectedRound);
      const targetUid = res.checkIn?.uid || (res.participant?.uid as string);
      const targetParticipantId = (res.participant?.participantId as string) || '';

      if (res.isAlreadyCheckedIn) {
        setCheckInSuccess(`[ALREADY CHECKED IN] ${res.participant.fullName as string} (${res.participant.participantId as string}) is already marked PRESENT for ${event.name}.`);
      } else {
        setCheckInSuccess(`[SUCCESS] Event Hall Check-In recorded for ${res.participant.fullName as string} (${res.participant.participantId as string}). Attendance marked PRESENT.`);
      }
      setScanInput('');

      // Targeted local React state update: update only affected row without reloading entire event dataset
      setRegisteredParticipants((prev) =>
        prev.map((p) => {
          if (p.id === targetUid || (targetParticipantId && p.participantId === targetParticipantId)) {
            return {
              ...p,
              eventAttendance: 'PRESENT',
            };
          }
          return p;
        })
      );
    } catch (err: unknown) {
      setCheckInError(err instanceof Error ? err.message : 'Event check-in failed.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Handle Event Check-In Submit
  const handleEventCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    await executeEventCheckInWithToken(scanInput);
  };

  // Direct Attendance Status Toggle
  const handleAttendanceChange = async (targetUid: string, newStatus: 'NOT_MARKED' | 'PRESENT' | 'ABSENT') => {
    try {
      await runAtomicUpdateAttendance(event.id, event.name, targetUid, newStatus, selectedRound, coordinatorUid, 'coordinator');
      // Update only affected row in local state
      setRegisteredParticipants((prev) =>
        prev.map((p) => (p.id === targetUid ? { ...p, eventAttendance: newStatus } : p))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update attendance');
    }
  };

  // Direct Shortlist Status Toggle
  const handleShortlistChange = async (targetId: string, newStatus: 'NOT_EVALUATED' | 'SHORTLISTED' | 'NOT_SHORTLISTED' | 'FINALIST') => {
    try {
      await runAtomicUpdateShortlist(event.id, event.name, targetId, newStatus, coordinatorUid, 'coordinator');
      // Update only affected row/team in local state
      setRegisteredParticipants((prev) =>
        prev.map((p) =>
          p.id === targetId || p.teamId === targetId ? { ...p, shortlistStatus: newStatus } : p
        )
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update shortlist status');
    }
  };

  // Handle Score Submission
  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) {
      setScoreError('Please select a participant or team to score.');
      return;
    }

    setScoreError(null);
    setScoreSuccess(null);
    setIsSubmittingScore(true);

    // Compute verified total
    const totalScore = Object.values(scoresMap).reduce((a, b) => a + Number(b), 0);
    const scorecardId = `SCORE-${event.id}-${selectedTargetId}-${coordinatorUid}`;

    try {
      await runAtomicSubmitScorecard({
        scorecardId,
        eventId: event.id,
        eventName: event.name,
        targetId: selectedTargetId,
        targetName: selectedTargetName,
        isTeam: isTeamTarget,
        teamId: isTeamTarget ? selectedTargetId : undefined,
        judgeUid: coordinatorUid,
        judgeName: 'Event Coordinator',
        criteria: scoresMap,
        totalScore,
        notes: judgeNotes,
        status: 'SUBMITTED',
      });

      setScoreSuccess(`Scorecard successfully submitted & locked for "${selectedTargetName}". Total Score: ${totalScore}/100.`);
      // Bounded reload: update only scorecards without re-fetching all participants and teams
      const updatedScores = await db.queryWhere('scorecards', 'eventId', event.id);
      setScorecards((updatedScores as unknown as Scorecard[]) || []);
    } catch (err: unknown) {
      setScoreError(err instanceof Error ? err.message : 'Failed to submit scorecard.');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // Filtered attendees for the Attendance table
  const filteredParticipants = registeredParticipants.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.participantId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.college.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.teamName && p.teamName.toLowerCase().includes(searchFilter.toLowerCase()));

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'PRESENT') return matchesSearch && p.eventAttendance === 'PRESENT';
    if (statusFilter === 'ABSENT') return matchesSearch && p.eventAttendance === 'ABSENT';
    if (statusFilter === 'NOT_MARKED') return matchesSearch && p.eventAttendance === 'NOT_MARKED';
    if (statusFilter === 'GATE_CHECKED') return matchesSearch && p.venueCheckIn;
    return matchesSearch;
  });

  // Calculate Deterministic Live Preview Rankings
  const previewRankings = computeDeterministicRanking({
    event,
    scorecards,
    participantsMetadata: Object.fromEntries(
      registeredParticipants.map((p) => [p.id, { fullName: p.fullName, college: p.college, participantId: p.participantId }])
    ),
    teamsMetadata: Object.fromEntries(
      eventTeams.map((t) => [
        t.teamId,
        {
          teamName: t.teamName,
          teamCode: t.teamCode,
          memberNames: t.members.map((m) => m.fullName),
          leaderName: t.members.find((m) => m.isLeader)?.fullName || 'Leader',
        },
      ])
    ),
  });

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/40 space-y-8">
      {/* ── Header & Operational Metrics Summary Bar ── */}
      <div className="space-y-4 border-b border-white/10 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="crimson">{event.category}</Badge>
              <Badge variant="outline">{event.venue}</Badge>
              <Badge variant="outline">{event.type === 'TEAM' ? `Team (${event.minTeamSize}-${event.maxTeamSize})` : 'Individual'}</Badge>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                ACTIVE TRACK
              </span>
            </div>
            <h2 className="text-2xl font-black text-white font-mono uppercase tracking-tight">{event.name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Assigned Track Console // Gate Prerequisite & Real-Time Judging Engine
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchParticipantsAndScores}
            disabled={isLoadingList}
            className="text-xs font-mono shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            Sync Track Data
          </Button>
        </div>

        {/* Live Operational Counters Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#0a0c10] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Registered</span>
            <span className="text-xl font-bold text-white font-mono">{totalRegistered}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0a0c10] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Gate Checked-In</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{gateCheckedIn}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1a0000]/60 border border-[#b91c1c]/40">
            <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider block">Hall Present</span>
            <span className="text-xl font-bold text-[#b91c1c] font-mono">{eventCheckedIn}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0a0c10] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Absent</span>
            <span className="text-xl font-bold text-rose-400 font-mono">{absentCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0a0c10] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Scores Submitted</span>
            <span className="text-xl font-bold text-amber-400 font-mono">{submittedScoresCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0a0c10] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Shortlisted</span>
            <span className="text-xl font-bold text-cyan-400 font-mono">{shortlistedCount}</span>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-800">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'checkin'
              ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
              : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4 text-[#b91c1c]" />
          [SCAN PARTICIPANT]
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
              : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-[#b91c1c]" />
          [ATTENDANCE ({eventCheckedIn}/{totalRegistered})]
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
          [SCORING ENGINE]
        </button>

        <button
          onClick={() => setActiveTab('shortlist')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'shortlist'
              ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
              : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
          }`}
        >
          <Star className="w-4 h-4 text-[#b91c1c]" />
          [SHORTLIST ({shortlistedCount})]
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'preview'
              ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
              : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-[#b91c1c]" />
          [VIEW RESULTS]
        </button>
      </div>

      {/* ── TAB 1: SCAN PARTICIPANT (EVENT HALL CHECK-IN) ── */}
      {activeTab === 'checkin' && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-4 rounded-2xl bg-[#1a0000]/80 border border-[#b91c1c]/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-200 font-light leading-relaxed">
                <strong className="text-white font-mono">Strict Requirement 6 Gate Verification:</strong> Participants must have completed Ground Floor <span className="text-[#b91c1c] font-mono font-bold">Venue Gate Check-In</span> before Event Hall Check-In can be granted.
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Repeated scans will return <strong>ALREADY CHECKED IN</strong> idempotently without corrupting attendance.
              </p>
            </div>
          </div>

          {/* Round Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">Check-In Round:</span>
            {(['ROUND_1', 'ROUND_2', 'FINAL'] as EventAttendanceRound[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRound(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  selectedRound === r
                    ? 'bg-[#b91c1c] text-white border border-[#b91c1c]'
                    : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
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

          {/* Live Camera View Area */}
          <div
            className={`relative rounded-2xl overflow-hidden border-2 border-[#b91c1c] bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center transition-all duration-300 ${
              isCameraActive ? 'block' : 'hidden'
            }`}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
              <div className="relative w-64 h-64 max-w-[75%] max-h-[75%] border border-red-500/20 rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#dc2626] rounded-tl-lg shadow-[0_0_8px_#dc2626]" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#dc2626] rounded-tr-lg shadow-[0_0_8px_#dc2626]" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#dc2626] rounded-bl-lg shadow-[0_0_8px_#dc2626]" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#dc2626] rounded-br-lg shadow-[0_0_8px_#dc2626]" />
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#dc2626] to-transparent shadow-[0_0_12px_#dc2626] animate-scanline" />
              </div>
            </div>

            <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-500/40 text-[11px] font-mono text-red-300 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>SCAN PARTICIPANT PASS</span>
              </div>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-2 rounded-xl bg-black/80 text-white border border-white/20 hover:border-red-500 transition-colors"
                title="Switch Camera (Front/Back)"
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

          <form onSubmit={handleEventCheckInSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Scan Participant QR Pass / Enter Participant ID or Token
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. QR-TARAS26-89420194 or TARAS26-89420194"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-[#0a0c10] border border-[#b91c1c]/50 rounded-2xl text-sm font-mono text-white focus:outline-none focus:border-[#b91c1c] focus:ring-1 focus:ring-[#b91c1c]"
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
                {isCheckingIn ? 'Verifying Gate & Event Prerequisite…' : `Confirm Event Check-In (${selectedRound})`}
              </Button>

              {!isCameraActive ? (
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full sm:w-auto font-mono text-xs py-4 px-5"
                >
                  <Camera className="w-4 h-4 mr-2" /> Camera Scanner
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  onClick={stopCamera}
                  className="w-full sm:w-auto font-mono text-xs py-4 px-5"
                >
                  Stop Camera
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: ATTENDANCE REGISTER ── */}
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

            <div className="flex items-center gap-2 overflow-x-auto">
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
                  <th className="p-3">Gate Status</th>
                  <th className="p-3">Hall Attendance</th>
                  <th className="p-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#06080c]">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                      No registrations matched your filter.
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            GATE CLEARED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500">
                            NOT AT VENUE
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {p.eventAttendance === 'PRESENT' ? (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/40 flex items-center gap-1 w-fit">
                            <Check className="w-3.5 h-3.5" /> PRESENT
                          </span>
                        ) : p.eventAttendance === 'ABSENT' ? (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 w-fit">
                            <X className="w-3.5 h-3.5" /> ABSENT
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
                            onClick={() => handleAttendanceChange(p.id, 'PRESENT')}
                            disabled={!p.venueCheckIn}
                            title={!p.venueCheckIn ? 'Gate Check-in prerequisite not fulfilled' : 'Mark Present'}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all ${
                              p.eventAttendance === 'PRESENT'
                                ? 'bg-green-600 text-white'
                                : p.venueCheckIn
                                ? 'bg-slate-800 text-green-400 hover:bg-green-600 hover:text-white'
                                : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(p.id, 'ABSENT')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all ${
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

      {/* ── TAB 3: CONFIGURABLE SCORING ENGINE ── */}
      {activeTab === 'scoring' && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Award className="w-4 h-4 text-[#b91c1c]" />
              CONFIGURABLE JUDGING SCORING ENGINE — {event.name}
            </h4>
            <p className="text-xs text-slate-400 font-light">
              Select an event-checked candidate/team. Scoring criteria are dynamically configured for this track. Total score is verified on the server. Submitted scorecards are immediately locked.
            </p>
          </div>

          {scoreSuccess && (
            <div className="p-4 rounded-2xl bg-[#1a0000] border border-green-500/60 text-green-400 flex items-center gap-2 text-xs font-mono font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{scoreSuccess}</span>
            </div>
          )}

          {scoreError && (
            <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-[#b91c1c] flex items-center gap-2 text-xs font-mono font-bold animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{scoreError}</span>
            </div>
          )}

          <form onSubmit={handleScoreSubmit} className="space-y-6">
            {/* Candidate / Team Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                Select Candidate / Team to Evaluate
              </label>
              <select
                required
                value={selectedTargetId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTargetId(val);

                  // Check if team or solo
                  const teamMatch = eventTeams.find((t) => t.teamId === val);
                  if (teamMatch) {
                    setIsTeamTarget(true);
                    setSelectedTargetName(`Team ${teamMatch.teamName} [${teamMatch.teamCode}]`);
                  } else {
                    const partMatch = registeredParticipants.find((p) => p.id === val);
                    setIsTeamTarget(false);
                    setSelectedTargetName(partMatch ? `${partMatch.fullName} (${partMatch.participantId})` : '');
                  }
                }}
                className="w-full px-4 py-3 bg-[#0a0c10] border border-[#b91c1c]/40 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#b91c1c]"
              >
                <option value="">-- Choose Present Candidate / Team --</option>
                {event.maxTeamSize > 1 && eventTeams.length > 0 ? (
                  <optgroup label="Registered Teams">
                    {eventTeams.map((t) => (
                      <option key={t.teamId} value={t.teamId}>
                        [TEAM] {t.teamName} ({t.teamCode}) — {t.members.map((m) => m.fullName).join(', ')}
                      </option>
                    ))}
                  </optgroup>
                ) : null}

                <optgroup label="Individual Candidates">
                  {registeredParticipants
                    .filter((p) => p.eventAttendance === 'PRESENT')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.participantId}) — {p.college}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Dynamic Configurable Criteria Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criteriaList.map((crit, idx) => {
                const currentScore = scoresMap[crit.name] ?? 0;
                return (
                  <div key={crit.id} className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-white block">
                          {idx + 1}. {crit.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-light leading-snug">
                          {crit.description}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-extrabold bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/50 shrink-0">
                        {currentScore} / {crit.maxScore}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max={crit.maxScore}
                        value={currentScore}
                        onChange={(e) =>
                          setScoresMap((prev) => ({
                            ...prev,
                            [crit.name]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#b91c1c] cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max={crit.maxScore}
                        value={currentScore}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(crit.maxScore, Number(e.target.value)));
                          setScoresMap((prev) => ({
                            ...prev,
                            [crit.name]: val,
                          }))
                        }}
                        className="w-16 px-2 py-1 bg-[#1a0000] border border-[#b91c1c]/40 rounded-lg text-xs font-mono text-center text-white focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Calculated Score Summary */}
            <div className="p-4 rounded-2xl bg-[#1a0000]/60 border border-[#b91c1c]/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Calculated Total Score</span>
                <span className="text-xs font-mono text-slate-300">Sum of validated criteria values</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {Object.values(scoresMap).reduce((a, b) => a + Number(b), 0)}
                <span className="text-sm text-slate-500 font-normal"> / 100</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Judge Remarks / Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Specific feedback, innovative highlights, or technical remarks..."
                value={judgeNotes}
                onChange={(e) => setJudgeNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0c10] border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <Button
              variant="glow"
              size="lg"
              type="submit"
              disabled={isSubmittingScore || !selectedTargetId}
              className="w-full justify-center font-mono py-4 text-sm font-bold flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isSubmittingScore ? 'Submitting & Locking Scorecard…' : 'Submit Official Scorecard & Lock'}
            </Button>
          </form>
        </div>
      )}

      {/* ── TAB 4: SHORTLISTING ── */}
      {activeTab === 'shortlist' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Star className="w-4 h-4 text-[#b91c1c]" />
              FINALIST & SHORTLIST MANAGEMENT
            </h4>
            <p className="text-xs text-slate-400 font-light">
              Select candidates or teams who advance to the next round or finals. Statuses are synchronized with the central registration record.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a0c10] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Candidate / Team</th>
                  <th className="p-3">Attendance</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3 text-right">Update Shortlist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#06080c]">
                {registeredParticipants
                  .filter((p) => p.eventAttendance === 'PRESENT')
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white">{p.fullName}</div>
                        <div className="text-[10px] text-[#b91c1c] font-mono">{p.participantId}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                          PRESENT
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            p.shortlistStatus === 'FINALIST' || p.shortlistStatus === 'SHORTLISTED'
                              ? 'crimson'
                              : 'outline'
                          }
                        >
                          {p.shortlistStatus.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleShortlistChange(p.id, 'SHORTLISTED')}
                            className="px-2.5 py-1 rounded bg-[#1a0000] text-white hover:bg-[#b91c1c] border border-[#b91c1c]/40 text-[10px] font-bold"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleShortlistChange(p.id, 'FINALIST')}
                            className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-[10px] font-bold"
                          >
                            Finalist
                          </button>
                          <button
                            onClick={() => handleShortlistChange(p.id, 'NOT_SHORTLISTED')}
                            className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 text-[10px] font-bold"
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: DETERMINISTIC RESULTS PREVIEW ── */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#b91c1c]" />
                DETERMINISTIC RANKING PREVIEW — {event.name}
              </h4>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Calculated strictly by total score descending with deterministic tie-breaking. Final publication is executed by Master Admin.
              </p>
            </div>
            <Badge variant="outline">{previewRankings.length} Evaluated</Badge>
          </div>

          {previewRankings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0a0c10] border border-slate-800 text-center text-slate-500 text-xs font-mono">
              No scorecards submitted yet for this track. Submit scores in the Scoring Engine tab to preview rankings.
            </div>
          ) : (
            <div className="space-y-3">
              {previewRankings.map((item) => (
                <div
                  key={item.targetId}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                    item.rank === 1
                      ? 'bg-[#1a0000] border-[#b91c1c] shadow-[0_0_20px_rgba(185,28,28,0.2)]'
                      : item.rank === 2
                      ? 'bg-[#0e1017] border-slate-700'
                      : 'bg-[#0a0c10] border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                        item.rank === 1
                          ? 'bg-[#b91c1c] text-white'
                          : item.rank === 2
                          ? 'bg-slate-300 text-black'
                          : item.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{item.rank}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm font-mono flex items-center gap-2">
                        {item.name}
                        {item.achievement && (
                          <Badge variant={item.rank === 1 ? 'crimson' : 'outline'}>
                            {item.achievement}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {item.college} {item.teamMembers ? `• Members: ${item.teamMembers.join(', ')}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-white font-mono">{item.totalScore}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Score / 100</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
