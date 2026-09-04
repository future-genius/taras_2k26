import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import type { EventRegistration } from '../../types/registration';
import { Button } from '../../components/common/Button';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ShieldCheck, Printer, Maximize2, X, AlertCircle, Lock, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

// ── Print Portal: injects a clean isolated pass into <body> for printing ──────
const PrintPortal: React.FC<{ profile: NonNullable<ReturnType<typeof useAuth>['participantProfile']> }> = ({
  profile,
}) => {
  const el = document.body;
  return createPortal(
    <div id="taras-print-only-pass">
      <div className="taras-print-pass-card">
        {/* Header */}
        <div className="taras-print-header">
          <div className="taras-print-logo">T</div>
          <div>
            <div className="taras-print-title">TARAS 2K26 — DIGITAL PASS</div>
            <div className="taras-print-subtitle">TECHNICAL SYMPOSIUM IDENTITY</div>
          </div>
          <div className="taras-print-status">{profile.venueCheckIn ? 'CHECKED-IN' : 'CONFIRMED'}</div>
        </div>

        {/* Body */}
        <div className="taras-print-body">
          {/* QR Code */}
          <div className="taras-print-qr-container">
            <QRCodeSVG
              value={profile.qrToken}
              size={160}
              level="H"
              marginSize={2}
            />
            <div className="taras-print-qr-label">SCAN AT REGISTRATION DESK</div>
          </div>

          {/* Participant Details */}
          <div className="taras-print-details">
            <div className="taras-print-field">
              <span className="taras-print-label">PARTICIPANT NAME</span>
              <span className="taras-print-value-lg">{profile.fullName}</span>
            </div>
            <div className="taras-print-field">
              <span className="taras-print-label">PARTICIPANT ID</span>
              <span className="taras-print-value-red">{profile.participantId}</span>
            </div>
            <div className="taras-print-field">
              <span className="taras-print-label">INSTITUTION</span>
              <span className="taras-print-value">{profile.college}</span>
            </div>
            <div className="taras-print-field-row">
              <div>
                <span className="taras-print-label">DEPT</span>
                <span className="taras-print-value">{profile.department}</span>
              </div>
              <div>
                <span className="taras-print-label">YR / SEC</span>
                <span className="taras-print-value">{profile.year} / {profile.section}</span>
              </div>
            </div>
            <div className="taras-print-field">
              <span className="taras-print-label">REGISTERED EVENTS ({profile.registeredEvents?.length ?? 0})</span>
              <div className="taras-print-events">
                {profile.registeredEvents?.length > 0
                  ? profile.registeredEvents.map((evt, i) => (
                      <span key={i} className="taras-print-event-chip">{evt}</span>
                    ))
                  : <span className="taras-print-value">—</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="taras-print-footer">
          <span>SYMPOSIUM DATE: 26.09.2026</span>
          <span>✦ TARAS UNIVERSE // VALID PASS</span>
        </div>
      </div>
    </div>,
    el
  );
};

export const DigitalPassPage: React.FC = () => {
  const { participantProfile, loading } = useAuth();
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(true);

  useEffect(() => {
    if (!participantProfile?.uid) return;
    const fetchRegs = async () => {
      setLoadingRegs(true);
      try {
        const regsRef = collection(firestore, 'registrations');
        const q = query(regsRef, where('uid', '==', participantProfile.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => d.data() as EventRegistration);
        setRegistrations(list);
      } catch (err) {
        console.warn('Error fetching user registrations for pass status:', err);
      } finally {
        setLoadingRegs(false);
      }
    };
    fetchRegs();
  }, [participantProfile?.uid]);

  if (loading || loadingRegs) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <LoadingSpinner label="Loading Digital Pass & Verification Status…" />
      </div>
    );
  }

  if (!participantProfile) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 glass-panel rounded-3xl border border-[#b91c1c] text-center space-y-4 font-mono">
        <AlertCircle className="w-10 h-10 text-[#b91c1c] mx-auto" />
        <h3 className="text-lg font-bold text-white uppercase">Unable to Load Digital Pass</h3>
        <p className="text-xs text-slate-300">
          Your participant profile could not be loaded. Please contact the TARAS administration team.
        </p>
      </div>
    );
  }

  // Check payment verification status across registrations
  const verifiedRegs = registrations.filter(
    (r) => r.paymentStatus === 'VERIFIED' || r.status === 'CONFIRMED'
  );
  const pendingRegs = registrations.filter(
    (r) => r.paymentStatus === 'PENDING' || r.status === 'PAYMENT_VERIFICATION_PENDING'
  );
  const rejectedRegs = registrations.filter(
    (r) => r.paymentStatus === 'REJECTED' || r.status === 'REJECTED'
  );

  const isPassUnlocked = verifiedRegs.length > 0;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      const cleanup = () => {
        setIsPrinting(false);
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      setTimeout(() => {
        setIsPrinting(false);
      }, 5000);
    }, 100);
  };

  return (
    <>
      {isPrinting && <PrintPortal profile={participantProfile} />}

      <div className="taras-digital-pass-page space-y-10 pb-20 font-mono">
        <VisualAtmosphere
          environmentKey="participantDashboard"
          badgeText="DIGITAL ENTRY PASS"
          title="MY SYMPOSIUM PASS & QR"
          subtitle="Official TARAS 2K26 Digital Pass. Only verified event registrations unlock an active scannable pass."
          height="compact"
        />

        <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-6">
          {/* ── PASS LOCKED STATE ── */}
          {!isPassUnlocked ? (
            <div className="glass-panel p-8 sm:p-10 rounded-3xl border-2 border-amber-500/60 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-3xl bg-[#1a0f00] border-2 border-amber-500 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-950/40">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  SECURITY STATE: RESTRICTED
                </span>
                <h3 className="text-2xl font-black text-white uppercase">DIGITAL TARAS PASS LOCKED</h3>
                <p className="text-xs text-slate-300 font-light leading-relaxed max-w-md mx-auto">
                  {rejectedRegs.length > 0
                    ? 'Your payment submission was rejected by the Registration Team. Please review the reason and resubmit corrected proof to unlock your Digital Pass.'
                    : pendingRegs.length > 0
                    ? 'Your payment proof has been submitted and is currently under manual review by the TARAS Registration Team.'
                    : 'You have not registered for any TARAS events yet. Register for an event and complete payment to unlock your Digital Pass.'}
                </p>
              </div>

              {/* Status Badge */}
              <div className="p-4 rounded-2xl bg-[#06080c] border border-white/10 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Verification Status:</span>
                  <span className="text-amber-400 font-bold">
                    {rejectedRegs.length > 0
                      ? 'PAYMENT REJECTED'
                      : pendingRegs.length > 0
                      ? 'PENDING MANUAL REVIEW'
                      : 'NO REGISTRATION'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Digital Pass State:</span>
                  <span className="text-red-400 font-bold">LOCKED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Event-Day QR Code:</span>
                  <span className="text-slate-500 font-bold">INACTIVE</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {registrations.length > 0 ? (
                  <Link to="/participant/my-events" className="w-full sm:w-auto">
                    <Button variant="glow" size="md" className="w-full justify-center font-bold">
                      View / Resubmit Payment Proof <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/events" className="w-full sm:w-auto">
                    <Button variant="glow" size="md" className="w-full justify-center font-bold">
                      Explore Events &amp; Register <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* ── PASS UNLOCKED STATE ── */
            <>
              {/* Pass Actions Bar */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Maximize2 className="w-4 h-4" />}
                  onClick={() => setIsEnlarged(true)}
                  className="font-mono text-xs"
                >
                  Enlarge QR Code
                </Button>

                <Button
                  variant="glow"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={handlePrint}
                  className="font-mono text-xs"
                  disabled={isPrinting}
                >
                  {isPrinting ? 'Preparing…' : 'Print Digital Pass'}
                </Button>
              </div>

              {/* Screen Digital Pass Card */}
              <div className="relative w-full max-w-md mx-auto rounded-2xl bg-[#0a0c10]/95 border border-[#b91c1c]/40 p-6 shadow-[0_12px_40px_rgba(185,28,28,0.3)] backdrop-blur-2xl overflow-hidden">
                <div className="absolute inset-0 bg-web-grid opacity-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#b91c1c]/10 rounded-full blur-3xl pointer-events-none" />

                {/* Pass Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1a0000] border border-[#b91c1c]/60 flex items-center justify-center font-extrabold text-[#b91c1c] text-sm">
                      T
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold tracking-wider text-white">TARAS 2K26 PASS</h3>
                      <p className="text-[10px] text-slate-400 uppercase">Technical Symposium Identity</p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{participantProfile.venueCheckIn ? 'CHECKED-IN' : 'VERIFIED ACTIVE'}</span>
                  </div>
                </div>

                {/* QR + Info */}
                <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center relative z-10">
                  {/* Real QR Code */}
                  <div className="p-3 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center shrink-0 border-2 border-[#b91c1c]">
                    <div className="p-1.5 bg-white rounded flex items-center justify-center">
                      <QRCodeSVG
                        value={participantProfile.qrToken}
                        size={112}
                        level="H"
                        marginSize={2}
                        aria-label={`Secure QR Code for ${participantProfile.participantId}`}
                      />
                    </div>
                    <span className="mt-1 text-[8px] font-bold text-black uppercase tracking-tighter">
                      ACTIVE EVENT-DAY QR
                    </span>
                  </div>

                  {/* Info Column */}
                  <div className="sm:col-span-2 space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Participant Name</span>
                      <h4 className="text-base font-extrabold text-white leading-tight">{participantProfile.fullName}</h4>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Participant ID</span>
                      <p className="text-xs font-bold text-[#b91c1c]">{participantProfile.participantId}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Institution</span>
                      <p className="text-xs text-slate-300 truncate">{participantProfile.college}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <div>
                        <span className="text-slate-400 uppercase">Dept: </span>
                        <span className="text-white font-bold">{participantProfile.department}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase">Yr/Sec: </span>
                        <span className="text-white font-bold">{participantProfile.year} / {participantProfile.section}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registered Events */}
                <div className="space-y-3 pt-3 border-t border-white/10 relative z-10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Venue Zone:</span>
                    <span className="font-bold text-white">MAIN AUDITORIUM</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block mb-1.5">
                      Confirmed Event Tracks ({verifiedRegs.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {verifiedRegs.map((r, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          {r.eventName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pass Footer */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 relative z-10">
                  <span>SYMPOSIUM DATE: 26.09.2026</span>
                  <span className="text-[#b91c1c] font-bold">TARAS UNIVERSE // SECURED</span>
                </div>
              </div>

              {/* Instructions Card */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2 text-xs text-slate-300 font-light">
                <div className="flex items-center gap-2 text-white font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#b91c1c]" /> Venue Entry Instructions:
                </div>
                <p>1. Keep this active pass open on your mobile device or print it using the Print button.</p>
                <p>2. At the Ground Floor Quadrangle Desk, present your QR code to the gate scanner.</p>
                <p>
                  3. Upon scanning, your <strong className="text-[#b91c1c]">venueCheckIn</strong> status updates in real time to{' '}
                  <strong className="text-white">CHECKED_IN</strong>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Enlarged QR Modal */}
        {isEnlarged && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0a0c10] border border-[#b91c1c] p-8 rounded-3xl max-w-sm w-full text-center space-y-6 relative shadow-[0_0_50px_rgba(185,28,28,0.5)]">
              <button
                onClick={() => setIsEnlarged(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
                aria-label="Close enlarged QR modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-widest block">
                  HIGH-CONTRAST GATE SCANNER MODE
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">{participantProfile.fullName}</h3>
                <p className="text-xs text-[#b91c1c] font-bold">{participantProfile.participantId}</p>
              </div>
              <div className="p-6 bg-white rounded-2xl border-4 border-[#b91c1c] inline-block shadow-2xl">
                <QRCodeSVG
                  value={participantProfile.qrToken}
                  size={200}
                  level="H"
                  marginSize={2}
                  aria-label={`High contrast QR code for ${participantProfile.participantId}`}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Hold device steady facing the TARAS gate scanner
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
