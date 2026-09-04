import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, runAtomicVenueCheckIn } from '../../config/firebase';
import type { CheckInResultState } from '../../types/eventDay';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
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
  Download,
  X,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface RecentCheckInItem {
  id: string;
  fullName: string;
  participantId: string;
  college: string;
  time: string;
  status: 'NEW_CHECKIN' | 'ALREADY_CHECKED_IN';
  staffUid?: string;
}

export const StaffDashboard: React.FC = () => {
  const { participantProfile, user, logout } = useAuth();

  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [resultState, setResultState] = useState<CheckInResultState | null>(null);
  const [activeParticipant, setActiveParticipant] = useState<Record<string, unknown> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

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

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const allParts = await db.getCollection('participants');
      setTotalParticipants(allParts.length);
      const checked = allParts.filter((p) => p.venueCheckIn === true || p.venueCheckInStatus === 'CHECKED_IN');
      setCheckedInCount(checked.length);
    } catch {
      // Ignore if offline
    } finally {
      setIsLoadingStats(false);
    }
  };

  const exportSessionCSV = () => {
    if (recentCheckIns.length === 0) return;
    const headers = ['Full Name', 'Participant ID', 'College', 'Check-In Time', 'Status', 'Staff UID'];
    const rows = recentCheckIns.map((item) => [
      item.fullName,
      item.participantId,
      item.college,
      item.time,
      item.status === 'NEW_CHECKIN' ? 'NEW CHECK-IN' : 'ALREADY CHECKED IN',
      item.staffUid || user?.uid || 'STAFF',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `TARAS_2K26_Session_CheckIns_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchStats();
    return () => {
      stopCamera();
    };
  }, []);

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
    executeCheckInWithToken(clean);
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
            // fallback to jsQR below
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
          setCameraError('Camera access was denied. Please allow camera permissions in your browser address bar and try again.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No camera found on this device. Please use manual token entry.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraError('Camera is currently in use by another application.');
        } else {
          setCameraError(err.message || 'Unable to initialize device camera.');
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

  const resetScanner = () => {
    setScanInput('');
    setResultState(null);
    setActiveParticipant(null);
    setErrorMessage(null);
  };

  const executeCheckInWithToken = async (rawInput: string) => {
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

    const staffUid = user?.uid || participantProfile?.uid || 'staff-terminal';

    setErrorMessage(null);
    setResultState(null);
    setActiveParticipant(null);
    setIsScanning(true);

    try {
      const res = await runAtomicVenueCheckIn(clean, staffUid);
      setActiveParticipant(res.participant as unknown as Record<string, unknown>);

      if (res.isAlreadyCheckedIn) {
        setResultState('ALREADY_CHECKED_IN');
      } else {
        setResultState('VALID');
        setCheckedInCount((prev) => prev + 1);

        const newRecentItem: RecentCheckInItem = {
          id: (res.participant.uid as string) || Math.random().toString(),
          fullName: (res.participant.fullName as string) || 'Participant',
          participantId: (res.participant.participantId as string) || clean,
          college: (res.participant.college as string) || 'SRM Valliammai Engineering College',
          time: new Date().toLocaleTimeString(),
          status: 'NEW_CHECKIN',
          staffUid,
        };

        setRecentCheckIns((prev) => [newRecentItem, ...prev.slice(0, 7)]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Venue check-in failed';
      if (msg.includes('NOT_FOUND')) {
        setResultState('NOT_FOUND');
        setErrorMessage(`No registered participant found for token/ID "${clean}".`);
      } else {
        setResultState('DATABASE_ERROR');
        setErrorMessage(msg);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    await executeCheckInWithToken(scanInput);
    setScanInput('');
  };

  const remainingCount = Math.max(0, totalParticipants - checkedInCount);
  const checkInPercent = totalParticipants > 0 ? Math.round((checkedInCount / totalParticipants) * 100) : 0;

  return (
    <div className="space-y-10 pb-24">
      {/* Atmosphere Header */}
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="OPERATIONS CONSOLE // REGISTRATION DESK"
        title="VENUE GATE CHECK-IN"
        subtitle="Ground floor quadrangle registration desk terminal for scanning participant QR passes and confirming campus presence."
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Officer Profile & Stats Bar */}
        <div className="glass-panel-glow p-6 rounded-3xl border border-[#dc2626]/50 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1a0000] border-2 border-[#dc2626] flex items-center justify-center text-[#dc2626] shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white font-mono tracking-tight">GATE SCANNER TERMINAL</h2>
                  <Badge variant="green">ACTIVE OFFICER</Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  OPERATOR: <span className="text-white font-bold">{participantProfile?.fullName || user?.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {recentCheckIns.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportSessionCSV} className="font-mono text-xs">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export Log ({recentCheckIns.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={isLoadingStats}
                className="font-mono text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingStats ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={logout} className="font-mono text-xs">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Live Gate Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Total Registered</span>
              <span className="text-2xl font-black text-white font-mono">{totalParticipants}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1a0000]/60 border border-green-500/40 space-y-1">
              <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest block">Venue Checked In</span>
              <span className="text-2xl font-black text-green-400 font-mono">{checkedInCount}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Remaining Gate</span>
              <span className="text-2xl font-black text-slate-300 font-mono">{remainingCount}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#dc2626]/50 space-y-1">
              <span className="text-[10px] font-mono text-[#dc2626] uppercase tracking-widest block">Campus Turnout</span>
              <span className="text-2xl font-black text-white font-mono">{checkInPercent}%</span>
            </div>
          </div>
        </div>

        {/* QR Scanner Module */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#dc2626]" />
                GATE SCANNER &amp; VERIFICATION TERMINAL
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetScanner}
                  className="p-1.5 rounded-lg bg-[#0a0c10] border border-slate-800 hover:border-slate-500 text-slate-400 hover:text-white transition-colors"
                  title="Reset Terminal"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <Badge variant="red">TERMINAL ACTIVE</Badge>
              </div>
            </div>

            {/* Verification State Alerts */}
            {resultState === 'VALID' && activeParticipant && (
              <div className="p-5 rounded-2xl bg-[#060e08] border-2 border-green-500 text-green-400 space-y-2 animate-bounce">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-green-400" />
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest block">
                      SUCCESS — VENUE GATE CHECK-IN RECORDED
                    </span>
                    <p className="text-sm font-mono text-white font-bold">
                      {activeParticipant.fullName as string} ({activeParticipant.participantId as string})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {resultState === 'ALREADY_CHECKED_IN' && activeParticipant && (
              <div className="p-5 rounded-2xl bg-[#1a0e02] border-2 border-amber-500/80 text-amber-400 space-y-2">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-6 h-6 shrink-0 text-amber-400" />
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest block">
                      ⚠ ALREADY CHECKED IN
                    </span>
                    <p className="text-sm font-mono text-white font-bold">
                      {activeParticipant.fullName as string} ({activeParticipant.participantId as string})
                    </p>
                    <p className="text-xs text-amber-300 font-mono mt-1">
                      Initial Gate Check-In confirmed at{' '}
                      <strong className="text-white">
                        {new Date(
                          (activeParticipant.venueCheckInTimestamp as string) || Date.now()
                        ).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </strong>
                      . Original timestamp is preserved and locked.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(resultState === 'NOT_FOUND' || resultState === 'INVALID_QR' || resultState === 'DATABASE_ERROR') && (
              <div className="p-5 rounded-2xl bg-[#1a0000] border-2 border-[#dc2626] text-[#dc2626] space-y-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 shrink-0 text-[#dc2626]" />
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest block">
                      GATE VERIFICATION REJECTED — {resultState}
                    </span>
                    <p className="text-xs text-white font-mono mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-4 rounded-2xl bg-[#1a0808] border border-[#dc2626] text-xs font-mono text-rose-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  <AlertTriangle className="w-4 h-4 text-[#dc2626]" /> Camera Access Notice:
                </div>
                <p>{cameraError}</p>
              </div>
            )}

            {/* Live Camera View Area — always in DOM, shown/hidden via CSS so ref is always valid */}
            <div
              className={`relative rounded-2xl overflow-hidden border-2 border-[#dc2626] bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center transition-all duration-300 ${
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

              {/* Viewfinder Overlay with Corner Reticles */}
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

            {/* Input Form */}
            <form onSubmit={handleScanSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Scan Digital Pass QR / Enter Token or Participant ID
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#dc2626]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. QR-TARAS26-89420194 or TARAS26-89420194"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-[#0a0c10] border border-[#dc2626]/50 rounded-2xl text-sm font-mono text-white focus:outline-none focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  variant="glow"
                  size="md"
                  type="submit"
                  disabled={isScanning}
                  className="w-full sm:flex-1 justify-center font-mono py-3"
                >
                  {isScanning ? 'Verifying Credentials…' : 'Execute Venue Gate Check-In'}
                </Button>

                {!isCameraActive ? (
                  <Button
                    variant="outline"
                    size="md"
                    type="button"
                    onClick={() => startCamera()}
                    className="w-full sm:w-auto font-mono text-xs"
                  >
                    <Camera className="w-4 h-4 mr-1.5" /> Start Camera
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

            {/* Verified Participant Identity Card */}
            {activeParticipant && (
              <div className="p-6 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">VERIFIED PARTICIPANT PROFILE</span>
                  <Badge variant="green">CAMPUS PRESENT</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block">Full Name:</span>
                    <span className="font-bold text-white text-sm">{activeParticipant.fullName as string}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Participant ID:</span>
                    <span className="font-bold text-[#dc2626] text-sm">{activeParticipant.participantId as string}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Institution / College:</span>
                    <span className="text-slate-200">{activeParticipant.college as string || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Department &amp; Year:</span>
                    <span className="text-slate-200">
                      {activeParticipant.department as string || 'ECE'} — Year {activeParticipant.year as string || 'III'} ({activeParticipant.section as string || 'A'})
                    </span>
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-slate-800/80">
                    <span className="text-slate-500 block mb-1">Registered Symposium Events:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {((activeParticipant.registeredEvents as string[]) || []).map((evId) => (
                        <Badge key={evId} variant="outline" className="text-[10px]">
                          {evId}
                        </Badge>
                      ))}
                      {((activeParticipant.registeredEvents as string[]) || []).length === 0 && (
                        <span className="text-slate-500 italic">No event registrations found</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Gate Activity Log */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#dc2626]" />
              RECENT GATE CHECK-INS
            </h3>

            {recentCheckIns.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-700" />
                <p>No check-ins recorded in this session yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((item) => (
                  <div key={item.id + item.time} className="p-3 rounded-xl bg-[#0a0c10] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">{item.fullName}</span>
                      <span className="text-[10px] font-mono text-green-400">{item.time}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400">{item.participantId} — {item.college}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
