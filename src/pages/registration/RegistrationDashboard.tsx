import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, runAtomicVenueCheckIn } from '../../config/firebase';
import {
  getRegistrationsForVerification,
  verifyPayment,
  rejectPayment,
} from '../../services/paymentService';
import { getPaymentProofViewUrl } from '../../services/paymentProofStorageService';
import { getDriveThumbnailUrl, getDriveDirectStreamUrl } from '../../utils/driveUrlHelper';
import type { CheckInResultState } from '../../types/eventDay';
import type { EventRegistration } from '../../types/registration';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import {
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Search,
  Users,
  AlertCircle,
  Clock,
  Building2,
  UserCheck,
  RefreshCw,
  Camera,
  X,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Shield,
  CreditCard,
  Check,
  XCircle,
  Eye,
  AlertTriangle,
  Filter,
  DollarSign,
} from 'lucide-react';
import { ParticipantDataExportConsole } from '../../components/export/ParticipantDataExportConsole';

interface RecentCheckInItem {
  id: string;
  fullName: string;
  participantId: string;
  college: string;
  time: string;
  status: 'NEW_CHECKIN' | 'ALREADY_CHECKED_IN';
  staffUid?: string;
}

const REJECT_REASON_OPTIONS = [
  'Payment amount does not match',
  'Invalid UTR / Transaction ID',
  'Payment record not found in TARAS UPI statement',
  'Payment screenshot proof is unclear or unreadable',
  'Duplicate UTR submitted for another registration',
  'Other / Transaction incomplete',
];

export const RegistrationDashboard: React.FC = () => {
  const { participantProfile, user, logout } = useAuth();

  // Active Console Tab
  const [activeTerminalTab, setActiveTerminalTab] = useState<'payments' | 'gate'>('payments');

  // ── PAYMENT VERIFICATION STATE ──
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReg, setSelectedReg] = useState<EventRegistration | null>(null);
  const [proofViewUrl, setProofViewUrl] = useState<string | null>(null);
  const [loadingProofUrl, setLoadingProofUrl] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReasonSelect, setRejectReasonSelect] = useState(REJECT_REASON_OPTIONS[0]);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // ── VENUE GATE CHECK-IN SCANNER STATE ──
  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [resultState, setResultState] = useState<CheckInResultState | null>(null);
  const [activeParticipant, setActiveParticipant] = useState<Record<string, any> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Live Statistics
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckInItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isCameraActiveRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const isProcessingScanRef = useRef(false);
  const barcodeDetectorRef = useRef<any>(null);

  useEffect(() => {
    // Auth Guard: Only subscribe when authoritative currentUser is authenticated and available
    if (!user) {
      setLoadingRegs(false);
      setIsLoadingStats(false);
      return;
    }

    setLoadingRegs(true);
    setIsLoadingStats(true);

    // Live Real-Time Subscriptions for Registrations and Participants
    const unsubRegistrations = db.subscribeCollection('registrations', (liveDocs) => {
      setRegistrations(liveDocs as unknown as EventRegistration[]);
      setLoadingRegs(false);
    });

    const unsubParticipants = db.subscribeCollection('participants', (liveParts) => {
      setTotalParticipants(liveParts.length);
      const checked = liveParts.filter(
        (p: any) => p.venueCheckIn === true || p.venueCheckInStatus === 'CHECKED_IN'
      );
      setCheckedInCount(checked.length);
      setIsLoadingStats(false);
    });

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
      unsubRegistrations();
      unsubParticipants();
      stopCamera();
    };
  }, [user]);

  // Resolve payment proof view URL whenever a registration is inspected
  useEffect(() => {
    let active = true;
    if (!selectedReg) {
      setProofViewUrl(null);
      return;
    }

    setLoadingProofUrl(true);
    getPaymentProofViewUrl(selectedReg as Record<string, any>)
      .then((url) => {
        if (active) setProofViewUrl(url);
      })
      .catch((err) => {
        console.warn('Failed to get payment proof view URL:', err);
        if (active) setProofViewUrl(null);
      })
      .finally(() => {
        if (active) setLoadingProofUrl(false);
      });

    return () => {
      active = false;
    };
  }, [selectedReg]);

  // Payment Verification Metrics
  const pendingCount = registrations.filter((r) => r.paymentStatus === 'PENDING' || r.status === 'PAYMENT_VERIFICATION_PENDING').length;
  const verifiedCount = registrations.filter((r) => r.paymentStatus === 'VERIFIED' || r.status === 'CONFIRMED').length;
  const rejectedCount = registrations.filter((r) => r.paymentStatus === 'REJECTED' || r.status === 'REJECTED').length;
  
  // Total Collection strictly counts VERIFIED payments only
  const verifiedCollection = registrations
    .filter((r) => r.paymentStatus === 'VERIFIED' || r.status === 'CONFIRMED')
    .reduce((sum, r) => sum + (r.feeAmount || 200), 0);

  // Search & Filtered Registrations
  const filteredRegistrations = registrations.filter((reg) => {
    const pStat = reg.paymentStatus || (reg.status === 'CONFIRMED' ? 'VERIFIED' : 'PENDING');
    if (statusFilter !== 'ALL' && pStat !== statusFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (reg.registrationId && reg.registrationId.toLowerCase().includes(q)) ||
      (reg.participantId && reg.participantId.toLowerCase().includes(q)) ||
      (reg.eventName && reg.eventName.toLowerCase().includes(q)) ||
      (reg.teamName && reg.teamName.toLowerCase().includes(q)) ||
      (reg.utrNumber && reg.utrNumber.toLowerCase().includes(q)) ||
      (reg.bankName && reg.bankName.toLowerCase().includes(q)) ||
      (reg.transactionDate && reg.transactionDate.toLowerCase().includes(q)) ||
      (reg.uid && reg.uid.toLowerCase().includes(q))
    );
  });

  const handleVerify = async (regId: string) => {
    if (!user?.uid) return;
    setActionError(null);
    setIsProcessingAction(true);
    try {
      await verifyPayment(regId, user.uid);
      setIsDetailModalOpen(false);
      setSelectedReg(null);
    } catch (err: any) {
      setActionError(err.message || 'Verification failed.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg || !user?.uid) return;

    const finalReason =
      rejectReasonSelect === 'Other / Transaction incomplete'
        ? customRejectReason.trim()
        : rejectReasonSelect;

    if (!finalReason) {
      setActionError('Please specify a valid rejection reason.');
      return;
    }

    setActionError(null);
    setIsProcessingAction(true);
    try {
      await rejectPayment(selectedReg.registrationId, user.uid, finalReason);
      setIsRejectModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedReg(null);
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ── QR Scanner Camera Logic ──
  const onQrDecoded = (decoded: string) => {
    if (isProcessingScanRef.current) return;
    const clean = decoded.trim();
    if (!clean) return;

    isProcessingScanRef.current = true;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(120);
      } catch {}
    }

    stopCamera();
    setScanInput(clean);
    handleLookup(clean);
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
          } catch {}
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
            console.warn('QR frame scan error:', e);
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
        throw new Error('Camera scanner is not supported on this browser.');
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
        } catch {}
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
        setCameraError(err.message || 'Unable to initialize camera.');
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

  const resetScanner = () => {
    setScanInput('');
    setResultState(null);
    setActiveParticipant(null);
    setErrorMessage(null);
  };

  const loadDemoParticipant = async () => {
    setScanInput('QR-TARAS-DEMO-001-TOKEN');
    handleLookup('QR-TARAS-DEMO-001-TOKEN');
  };

  const handleLookup = async (inputToken: string) => {
    let cleanToken = inputToken.trim();
    if (!cleanToken) return;

    try {
      if (cleanToken.startsWith('http://') || cleanToken.startsWith('https://')) {
        const urlObj = new URL(cleanToken);
        const extracted =
          urlObj.searchParams.get('token') ||
          urlObj.searchParams.get('id') ||
          urlObj.searchParams.get('qr') ||
          urlObj.searchParams.get('qrToken') ||
          urlObj.searchParams.get('participantId');
        if (extracted) {
          cleanToken = extracted.trim();
        }
      }
    } catch {}

    setErrorMessage(null);
    setResultState(null);
    setActiveParticipant(null);
    setIsScanning(true);

    try {
      const byQr = await db.queryWhere('participants', 'qrToken', cleanToken);
      let found: any = byQr[0];

      if (!found) {
        const byId = await db.queryWhere('participants', 'participantId', cleanToken);
        found = byId[0];
      }

      if (!found) {
        const docRes = await db.getDoc('participants', cleanToken);
        if (docRes.exists && docRes.data) {
          found = docRes.data;
        }
      }

      if (!found) {
        setResultState('NOT_FOUND');
        setErrorMessage(`No registered participant found with token/ID "${cleanToken}".`);
        return;
      }

      setActiveParticipant(found);
      if (found.venueCheckIn === true || found.venueCheckInStatus === 'CHECKED_IN') {
        setResultState('ALREADY_CHECKED_IN');
      } else {
        setResultState('VALID');
      }
    } catch (err: any) {
      setResultState('DATABASE_ERROR');
      setErrorMessage(err.message || 'Lookup failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const executeCheckIn = async () => {
    if (!activeParticipant || !user) return;
    const token = String(activeParticipant.qrToken || activeParticipant.participantId || '');

    setIsScanning(true);
    try {
      const res = await runAtomicVenueCheckIn(token, user.uid);
      setActiveParticipant(res.participant);

      if (res.isAlreadyCheckedIn) {
        setResultState('ALREADY_CHECKED_IN');
      } else {
        setResultState('VALID');
        setCheckedInCount((prev) => prev + 1);

        const newRecentItem: RecentCheckInItem = {
          id: String(res.participant.uid || Math.random()),
          fullName: String(res.participant.fullName || 'TARAS Demo Participant'),
          participantId: String(res.participant.participantId || 'TARAS-DEMO-001'),
          college: String(res.participant.college || 'Saveetha Engineering College'),
          time: new Date().toLocaleTimeString(),
          status: 'NEW_CHECKIN',
          staffUid: user.uid,
        };

        setRecentCheckIns((prev) => [newRecentItem, ...prev.slice(0, 7)]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Venue check-in execution failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const remainingCount = Math.max(0, totalParticipants - checkedInCount);
  const checkInPercent = totalParticipants > 0 ? Math.round((checkedInCount / totalParticipants) * 100) : 0;

  return (
    <div className="space-y-8 pb-24">
      {/* Atmosphere Header */}
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="TARAS 2K26 REGISTRATION STAFF TERMINAL"
        title="REGISTRATION &amp; VERIFICATION CONSOLE"
        subtitle="Authorized Registration Team terminal for reviewing manual UPI payment proofs, verifying event registrations, and executing campus gate check-ins."
        height="compact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Terminal Header & Navigation Bar */}
        <div className="glass-panel-glow p-6 rounded-3xl border border-[#b91c1c]/50 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1a0000] border-2 border-[#b91c1c] flex items-center justify-center text-[#b91c1c] shrink-0 shadow-lg shadow-[#b91c1c]/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white font-mono">
                    TARAS 2K26 REGISTRATION STAFF CONSOLE
                  </h2>
                  <Badge variant="red">AUTHORIZED STAFF</Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Officer UID: <strong className="text-white">{user?.email || 'registration.demo@taras2k26.test'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoadingRegs(true);
                  setIsLoadingStats(true);
                  setTimeout(() => {
                    setLoadingRegs(false);
                    setIsLoadingStats(false);
                  }, 400);
                }}
                disabled={loadingRegs || isLoadingStats}
                className="font-mono text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingRegs ? 'animate-spin' : ''}`} /> Refresh Terminal
              </Button>
              <Button variant="outline" size="sm" onClick={logout} className="font-mono text-xs">
                Sign Out
              </Button>
            </div>
          </div>

          {/* ── PARTICIPANT DATA EXPORT CONSOLE ── */}
          <ParticipantDataExportConsole
            profile={
              participantProfile || {
                uid: user?.uid || 'registration_staff_console',
                role: 'registration_staff',
                email: user?.email || 'registration.taras2k26@gmail.com',
                fullName: 'Registration Desk Officer',
                participantId: 'REG_STAFF',
                registrationNumber: 'STAFF',
                college: 'SRM Valliammai Engineering College',
                department: 'ECE',
                year: 'IV',
                section: 'A',
                phone: '0000000000',
                registeredEvents: [],
                teamIds: [],
                venueCheckIn: true,
                venueCheckInStatus: 'CHECKED_IN',
                qrToken: '',
                attendanceStatus: {},
                shortlistStatus: {},
                certificateStatus: 'READY',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            }
            title="Registration Team Participant Data Export"
            subtitle="Download complete operational participant, payment verification, and team rosters in Excel (.xlsx) and CSV format."
          />

          {/* Console Tab Switches */}
          <div className="flex border-b border-white/10 gap-3">
            <button
              onClick={() => setActiveTerminalTab('payments')}
              className={`px-5 py-3 text-xs sm:text-sm font-bold font-mono rounded-t-2xl transition-all flex items-center gap-2 border-t border-x ${
                activeTerminalTab === 'payments'
                  ? 'bg-[#1a0000] text-white border-[#b91c1c] shadow-lg'
                  : 'bg-[#0a0c10] text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-[#b91c1c]" />
              PAYMENT VERIFICATION QUEUE
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#b91c1c] text-white text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTerminalTab('gate')}
              className={`px-5 py-3 text-xs sm:text-sm font-bold font-mono rounded-t-2xl transition-all flex items-center gap-2 border-t border-x ${
                activeTerminalTab === 'gate'
                  ? 'bg-[#1a0000] text-white border-[#b91c1c] shadow-lg'
                  : 'bg-[#0a0c10] text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#b91c1c]" />
              EVENT-DAY VENUE GATE SCANNER
            </button>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 1: PAYMENT VERIFICATION QUEUE & DASHBOARD                    */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTerminalTab === 'payments' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Dashboard Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-[#1a0f00] border border-amber-500/50 space-y-1">
                <div className="flex items-center justify-between text-amber-400 font-mono text-[10px] uppercase font-bold">
                  <span>PENDING VERIFICATION</span>
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <span className="text-3xl font-black text-white font-mono">{pendingCount}</span>
              </div>

              <div className="p-5 rounded-3xl bg-[#06140b] border border-emerald-500/50 space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-mono text-[10px] uppercase font-bold">
                  <span>VERIFIED PAYMENTS</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-3xl font-black text-emerald-400 font-mono">{verifiedCount}</span>
              </div>

              <div className="p-5 rounded-3xl bg-[#1a0000] border border-red-800 space-y-1">
                <div className="flex items-center justify-between text-red-400 font-mono text-[10px] uppercase font-bold">
                  <span>REJECTED PAYMENTS</span>
                  <XCircle className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-3xl font-black text-white font-mono">{rejectedCount}</span>
              </div>

              <div className="p-5 rounded-3xl bg-[#0a0c10] border border-[#b91c1c]/50 space-y-1">
                <div className="flex items-center justify-between text-[#b91c1c] font-mono text-[10px] uppercase font-bold">
                  <span>VERIFIED COLLECTION</span>
                  <DollarSign className="w-4 h-4 text-[#b91c1c]" />
                </div>
                <span className="text-3xl font-black text-white font-mono">₹{verifiedCollection}</span>
                <span className="text-[9px] text-slate-500 font-mono block">Verified payments only</span>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="glass-panel p-4 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">Filter:</span>
                {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-[#b91c1c] text-white shadow-md'
                        : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                <input
                  type="text"
                  placeholder="Search Reg ID, Participant, UTR, Event, Team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0a0c10] border border-slate-700 rounded-2xl text-xs text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>
            </div>

            {/* Verification Table / List */}
            {loadingRegs ? (
              <div className="p-12 text-center text-slate-500 font-mono text-xs">
                Loading verification queue…
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-3 font-mono text-xs">
                <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white uppercase">NO REGISTRATION RECORDS FOUND</h4>
                <p className="text-slate-400 text-xs">No registrations match the selected status filter or search criteria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRegistrations.map((reg) => {
                  const pStat = reg.paymentStatus || (reg.status === 'CONFIRMED' ? 'VERIFIED' : 'PENDING');

                  return (
                    <div
                      key={reg.registrationId}
                      className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs hover:border-[#b91c1c]/40 transition-all"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-[#b91c1c] text-sm">{reg.registrationId}</span>
                          <Badge variant={pStat === 'VERIFIED' ? 'green' : pStat === 'REJECTED' ? 'crimson' : 'amber'}>
                            {pStat === 'PENDING' ? '⏳ PENDING VERIFICATION' : pStat === 'VERIFIED' ? '✓ VERIFIED' : '✕ REJECTED'}
                          </Badge>
                          {Boolean(reg.possibleDuplicate) && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/60 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> POSSIBLE DUPLICATE UTR
                            </span>
                          )}
                        </div>

                        <div className="text-slate-200">
                          <strong>Participant / ID:</strong> {reg.participantId} &bull; <strong>Event:</strong> {reg.eventName}
                          {reg.teamName && (
                            <span className="block text-slate-400">Team: <strong className="text-white">{reg.teamName}</strong> ({reg.teamId})</span>
                          )}
                        </div>

                        <div className="text-slate-400 text-[11px] flex flex-wrap items-center gap-3">
                          <span>UTR: <strong className="text-amber-300">{reg.utrNumber || 'N/A'}</strong></span>
                          <span>Fee: <strong className="text-white">₹{reg.feeAmount || 200}</strong></span>
                          <span>Submitted: {reg.paymentSubmittedAt ? new Date(reg.paymentSubmittedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                        <Button
                          variant="glow"
                          size="sm"
                          onClick={() => {
                            setSelectedReg(reg);
                            setActionError(null);
                            setIsDetailModalOpen(true);
                          }}
                          className="font-mono text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> VIEW DETAILS
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 2: VENUE GATE SCANNER TERMINAL                                */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTerminalTab === 'gate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#b91c1c]" />
                  SCAN DIGITAL PASS / SEARCH PARTICIPANT
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetScanner}
                    className="p-1.5 rounded-lg bg-[#0a0c10] border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Reset Scanner"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <Badge variant="green">DESK ACTIVE</Badge>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-2xl bg-[#1a0000] border-2 border-[#b91c1c] text-[#b91c1c] flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-mono text-white">{errorMessage}</span>
                </div>
              )}

              {cameraError && (
                <div className="p-4 rounded-2xl bg-[#1a0808] border border-[#b91c1c] text-xs font-mono text-rose-300">
                  {cameraError}
                </div>
              )}

              <div
                className={`relative rounded-2xl overflow-hidden border-2 border-[#b91c1c] bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center transition-all duration-300 ${
                  isCameraActive ? 'block' : 'hidden'
                }`}
              >
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />

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
                    <span>ALIGN QR CODE INSIDE BOX</span>
                  </div>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 rounded-xl bg-black/80 text-white border border-white/20 hover:border-red-500 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2 rounded-xl bg-black/80 text-white border border-white/20 hover:border-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookup(scanInput);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                    Participant Token / Pass QR Code / ID Number
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. QR-TARAS-DEMO-001-TOKEN or TARAS-DEMO-001"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-[#0a0c10] border border-[#b91c1c]/50 rounded-2xl text-sm font-mono text-white focus:outline-none focus:border-[#b91c1c]"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    variant="glow"
                    size="md"
                    type="submit"
                    disabled={isScanning}
                    className="w-full sm:flex-1 justify-center font-mono py-3"
                  >
                    {isScanning ? 'Verifying Participant…' : 'Scan / Lookup Credentials'}
                  </Button>

                  {!isCameraActive ? (
                    <Button
                      variant="outline"
                      size="md"
                      type="button"
                      onClick={() => startCamera()}
                      className="w-full sm:w-auto font-mono text-xs"
                    >
                      <Camera className="w-4 h-4 mr-1.5" /> Camera Scanner
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="md"
                      type="button"
                      onClick={stopCamera}
                      className="w-full sm:w-auto font-mono text-xs"
                    >
                      Stop Camera
                    </Button>
                  )}
                </div>
              </form>

              {activeParticipant && (
                <div className="p-6 rounded-2xl bg-[#0a0c10] border border-[#b91c1c]/50 space-y-6 animate-fadeIn shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                      <span className="text-sm font-bold text-white font-mono">
                        PARTICIPANT FOUND &amp; VERIFIED
                      </span>
                    </div>
                    <Badge variant={activeParticipant.venueCheckIn ? 'green' : 'red'}>
                      {activeParticipant.venueCheckIn ? 'CHECKED IN ✓' : 'NOT CHECKED IN'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 uppercase block text-[10px]">Participant Name:</span>
                      <span className="font-extrabold text-white text-base block mt-0.5">
                        {String(activeParticipant.fullName || 'TARAS Participant')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase block text-[10px]">Registration ID:</span>
                      <span className="font-extrabold text-[#b91c1c] text-base block mt-0.5">
                        {String(activeParticipant.participantId || 'TARAS-001')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase block text-[10px]">Institution:</span>
                      <span className="text-slate-200 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-[#b91c1c]" />
                        {String(activeParticipant.college || 'Saveetha Engineering College')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {!activeParticipant.venueCheckIn ? (
                      <Button
                        variant="glow"
                        size="md"
                        onClick={executeCheckIn}
                        disabled={isScanning}
                        className="flex-1 justify-center font-mono py-3 font-bold"
                      >
                        <UserCheck className="w-4 h-4 mr-2" /> Execute Venue Check-In
                      </Button>
                    ) : (
                      <div className="flex-1 p-3 rounded-xl bg-green-950/40 border border-green-500/50 text-green-400 text-center font-mono font-bold text-xs flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> VENUE CHECK-IN COMPLETED
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#b91c1c]" />
                SESSION GATE ACTIVITY
              </h3>

              {recentCheckIns.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-700" />
                  <p>No check-ins recorded in this desk session yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCheckIns.map((item) => (
                    <div
                      key={item.id + item.time}
                      className="p-3 rounded-xl bg-[#0a0c10] border border-slate-800 space-y-1 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white">{item.fullName}</span>
                        <span className="text-[10px] font-mono text-green-400">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── PAYMENT VERIFICATION DETAIL MODAL ── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedReg(null);
        }}
        title="PAYMENT PROOF VERIFICATION DETAIL"
        maxWidthClass="max-w-2xl sm:max-w-3xl"
      >
        {selectedReg && (
          <div className="space-y-5 font-mono text-xs">
            {actionError && (
              <div className="p-3.5 rounded-xl bg-[#1a0000] border border-[#b91c1c] text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {Boolean(selectedReg.possibleDuplicate) && (
              <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <strong className="block text-white font-bold">⚠ POSSIBLE DUPLICATE TRANSACTION DETECTED</strong>
                  <span className="text-[11px]">This UTR has been submitted for another registration record in the system.</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#0a0c10] border border-white/10">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Registration ID:</span>
                <span className="font-extrabold text-[#b91c1c] text-sm">{selectedReg.registrationId}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Payment Proof ID:</span>
                <span className="font-extrabold text-amber-300 text-sm font-mono">
                  {selectedReg.paymentProofId || (selectedReg.paymentProof as any)?.paymentProofId || 'PAY-TARAS-LEGACY'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Participant UID / ID:</span>
                <span className="text-slate-200">{selectedReg.participantId} ({selectedReg.uid})</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Event Track:</span>
                <span className="text-white font-bold">{selectedReg.eventName}</span>
              </div>

              {selectedReg.teamName && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Squad Name &amp; ID:</span>
                  <span className="text-white font-bold">{selectedReg.teamName} ({selectedReg.teamId})</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Authoritative Submission Timestamp:</span>
                <span className="text-white font-bold">
                  {(selectedReg as any).uploadedAtIST || (selectedReg as any).paymentSubmittedAt || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Expected Fee Amount:</span>
                <span className="text-white font-extrabold text-sm">₹{selectedReg.feeAmount || 200}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Submitted UTR / Ref:</span>
                <span className="text-amber-400 font-extrabold text-sm">{selectedReg.utrNumber || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Bank Name:</span>
                <span className="text-white font-bold text-xs">{selectedReg.bankName || (selectedReg.paymentProof as any)?.bankName || 'Not provided'}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Transaction Date:</span>
                <span className="text-white font-bold text-xs">{selectedReg.transactionDate || (selectedReg.paymentProof as any)?.transactionDate || 'Not provided'}</span>
              </div>

              {/* Dual Storage Metadata */}
              <div className="col-span-1 sm:col-span-2 pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Drive Storage Path</span>
                  <span className="text-[11px] font-mono text-emerald-400 truncate block">
                    {(selectedReg as any).paymentProof?.drivePath ||
                      (selectedReg as any).googleDrivePath ||
                      selectedReg.paymentScreenshotPath ||
                      'N/A'}
                  </span>
                  <span className="text-[9px] text-slate-500">Status: <strong className="text-emerald-400">
                    {(selectedReg as any).paymentProof?.driveUploadStatus ||
                     (selectedReg as any).googleDriveUploadStatus ||
                     'SUCCESS'}
                  </strong></span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Google Drive Archive</span>
                  {(selectedReg as any).googleDriveFileId || (selectedReg.paymentProof as any)?.googleDriveFileId ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-blue-400 truncate block">
                        File ID: {(selectedReg as any).googleDriveFileId || (selectedReg.paymentProof as any)?.googleDriveFileId}
                      </span>
                      <a
                        href={`https://drive.google.com/file/d/${(selectedReg as any).googleDriveFileId || (selectedReg.paymentProof as any)?.googleDriveFileId}/view`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-amber-400 hover:text-white underline flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Drive
                      </a>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500 block">
                      Status: {(selectedReg as any).googleDriveUploadStatus || 'PENDING'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Proof Screenshot Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Submitted Payment Screenshot Proof
                </span>
                {selectedReg.paymentScreenshotSize && (
                  <span className="text-[10px] font-mono text-green-400 bg-green-950/40 px-2 py-0.5 rounded border border-green-800/50">
                    Optimized: {(selectedReg.paymentScreenshotSize / 1024).toFixed(0)} KB
                  </span>
                )}
              </div>
              {loadingProofUrl ? (
                <div className="p-8 text-center text-slate-400 bg-[#0a0c10] rounded-2xl border border-slate-800 flex items-center justify-center gap-2 font-mono text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#b91c1c]" /> Retrieving payment proof link...
                </div>
              ) : proofViewUrl ? (
                <div className="p-4 rounded-2xl bg-[#0a0c10] border border-[#b91c1c]/40 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                      Payment proof stored in Google Drive.
                    </span>
                    <a
                      href={proofViewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-amber-400 hover:text-white underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Full Drive View
                    </a>
                  </div>

                  {/* Direct Embed Image Preview */}
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center min-h-[160px] max-h-[380px]">
                    <img
                      src={getDriveThumbnailUrl(proofViewUrl) || proofViewUrl}
                      alt="Payment proof screenshot"
                      className="object-contain max-h-[380px] w-auto mx-auto"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const directUrl = getDriveDirectStreamUrl(proofViewUrl);
                        if (directUrl && target.src !== directUrl) {
                          target.src = directUrl;
                        }
                      }}
                    />
                  </div>

                  <a
                    href={proofViewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#1a0000] border border-[#b91c1c]/60 text-white font-bold text-xs font-mono hover:bg-[#b91c1c]/20 transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-[#dc2626]" />
                    OPEN ORIGINAL IN GOOGLE DRIVE
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-[#0a0c10] rounded-2xl border border-slate-800">
                  No payment screenshot uploaded.
                </div>
              )}
            </div>

            {selectedReg.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-[#1a0000] border border-red-800 text-red-300 text-xs">
                <strong>Previous Rejection Reason:</strong> {selectedReg.rejectionReason}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedReg(null);
                }}
              >
                Close
              </Button>

              {selectedReg.paymentStatus !== 'VERIFIED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={isProcessingAction}
                  className="bg-[#1a0000] text-red-400 border-red-800 hover:text-white"
                >
                  <XCircle className="w-4 h-4 mr-1" /> REJECT PAYMENT
                </Button>
              )}

              {selectedReg.paymentStatus !== 'VERIFIED' && (
                <Button
                  variant="glow"
                  size="md"
                  onClick={() => handleVerify(selectedReg.registrationId)}
                  disabled={isProcessingAction}
                  className="font-bold"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {isProcessingAction ? 'Verifying…' : 'VERIFY PAYMENT & CONFIRM'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── REJECT REASON MODAL ── */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="REJECT PAYMENT PROOF"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4 font-mono text-xs">
          {actionError && (
            <div className="p-3 rounded-xl bg-[#1a0000] border border-[#b91c1c] text-white">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
              Select Rejection Reason
            </label>
            <select
              value={rejectReasonSelect}
              onChange={(e) => setRejectReasonSelect(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0a0c10] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
            >
              {REJECT_REASON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {rejectReasonSelect === 'Other / Transaction incomplete' && (
            <div>
              <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                Specific Rejection Reason
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain why the payment proof is being rejected..."
                value={customRejectReason}
                onChange={(e) => setCustomRejectReason(e.target.value)}
                className="w-full p-3 bg-[#0a0c10] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="glow" size="sm" type="submit" disabled={isProcessingAction} className="bg-[#1a0000] border-red-600 text-red-400">
              {isProcessingAction ? 'Rejecting…' : 'CONFIRM REJECT'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
