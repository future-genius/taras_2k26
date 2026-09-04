/**
 * TARAS 2K26 — Registration Wizard Modal
 *
 * FIXED WORKFLOW:
 * 1. Step 1 (Participation): Show team info + calculated fee. On "Continue":
 *    → createEventRegistration() writes to Firestore FIRST (atomic transaction)
 *    → If fee = 0 (team already has verified payment): skip to Step 3 (Confirmed)
 *    → If fee > 0: navigate to Step 2 (Payment)
 *
 * 2. Step 2 (Payment): UPI QR + UTR + Screenshot upload → submitPaymentProof()
 *
 * 3. Step 3 (Submitted): Payment under review confirmation
 *    Or if ₹0: instant confirmation
 *
 * FEE MODEL:
 * - First event registration: teamMemberCount × ₹150 (Firestore-sourced)
 * - Subsequent events (same team, verified payment exists): ₹0
 * - NEVER sourced from client state, URL params, or localStorage
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPaymentConfig } from '../../services/paymentService';
import {
  savePaymentProofSubmissionToFirestore,
  resubmitPaymentProofToFirestore,
} from '../../services/paymentProofStorageService';
import {
  PaymentProofUploader,
  type PaymentProofUploaderRef,
  type UploadState,
} from './PaymentProofUploader';
import { createEventRegistration, calculateEventFee } from '../../services/eventRegistrationService';
import type { TARASEvent } from '../../types/event';
import type { EventTeam } from '../../types/team';
import type { RegistrationPaymentConfig } from '../../types/registrationConfig';
import type { EventRegistration } from '../../types/registration';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Upload,
  Lock,
  ArrowRight,
  ArrowLeft,
  Users,
  CheckSquare,
  Info,
  Zap,
} from 'lucide-react';

interface RegistrationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TARASEvent;
  existingRegistration?: EventRegistration | null;
  userTeams?: EventTeam[];
}

export const RegistrationWizardModal: React.FC<RegistrationWizardModalProps> = ({
  isOpen,
  onClose,
  event,
  existingRegistration,
  userTeams = [],
}) => {
  const { user, participantProfile } = useAuth();
  const navigate = useNavigate();

  // Current UID (prefer authoritative Firebase Auth UID)
  const currentUid = user?.uid || participantProfile?.uid || '';

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(existingRegistration ? 2 : 1);
  const [paymentConfig, setPaymentConfig] = useState<RegistrationPaymentConfig | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Selected team ID state if participant has multiple teams
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Registration result state
  const [createdReg, setCreatedReg] = useState<EventRegistration | null>(existingRegistration || null);
  const [feeInfo, setFeeInfo] = useState<{ fee: number; isFirstPayment: boolean } | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  // Payment proof state
  const [utrInput, setUtrInput] = useState(existingRegistration?.utrNumber || '');
  const uploaderRef = useRef<PaymentProofUploaderRef>(null);
  const [uploaderState, setUploaderState] = useState<UploadState>('idle');

  // Form feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived values
  const isTeamEvent = event.maxTeamSize > 1;

  // Filter user's teams
  const myTeams = isTeamEvent
    ? userTeams.filter(
        (t) =>
          t.memberUids?.includes(currentUid) ||
          (participantProfile?.uid && t.memberUids?.includes(participantProfile.uid))
      )
    : [];

  // Pick team: explicitly selected, OR prioritize team where user is captain, OR first team
  const eligibleTeam = isTeamEvent
    ? (selectedTeamId ? myTeams.find((t) => t.teamId === selectedTeamId) : null) ||
      myTeams.find(
        (t) =>
          t.leaderUid === currentUid ||
          (participantProfile?.uid && t.leaderUid === participantProfile.uid)
      ) ||
      myTeams[0] ||
      null
    : null;

  const isLeader = eligibleTeam
    ? eligibleTeam.leaderUid === currentUid ||
      (participantProfile?.uid && eligibleTeam.leaderUid === participantProfile.uid) ||
      (eligibleTeam.members?.some((m) => m.isLeader && (m.uid === currentUid || m.uid === participantProfile?.uid)))
    : false;

  // Effective fee for display
  const displayFee = createdReg?.calculatedFee ?? feeInfo?.fee ?? null;
  const isZeroFee = displayFee === 0;

  // UPI payment URI
  const regIdForUpi = createdReg?.registrationId || 'TARAS2K26';
  const upiUri = paymentConfig
    ? `upi://pay?pa=${paymentConfig.upiId}&pn=${encodeURIComponent(paymentConfig.payeeName)}&am=${displayFee}&cu=INR&tn=${encodeURIComponent(regIdForUpi)}`
    : `upi://pay?pa=taras2k26@upi&pn=TARAS2K26&am=${displayFee || 0}&cu=INR`;

  useEffect(() => {
    if (!isOpen) return;
    getPaymentConfig().then(setPaymentConfig).catch(() => null);

    if (existingRegistration) {
      setStep(2);
      setCreatedReg(existingRegistration);
      setUtrInput(existingRegistration.utrNumber || '');
      return;
    }

    // Reset for fresh open
    setStep(1);
    setErrorMsg(null);
    setCreatedReg(null);

    // Pre-fetch fee estimate so user sees it before clicking Continue
    const fetchFeeEstimate = async () => {
      if (!eligibleTeam) return;
      setFeeLoading(true);
      try {
        const info = await calculateEventFee(eligibleTeam.teamId, eligibleTeam.memberCount);
        setFeeInfo(info);
      } catch {
        // Non-fatal — actual fee is determined at createEventRegistration time
      } finally {
        setFeeLoading(false);
      }
    };

    fetchFeeEstimate();
  }, [isOpen, existingRegistration, eligibleTeam?.teamId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Continue to Payment (THE CRITICAL FIX)
  // Registration document is written to Firestore FIRST before navigating.
  // ─────────────────────────────────────────────────────────────────────────────

  const handleStep1Continue = async () => {
    if (!participantProfile) {
      navigate('/participant/login');
      return;
    }

    // Team event validations
    if (isTeamEvent) {
      if (!eligibleTeam) {
        setErrorMsg(
          'You need to create or join a team before registering for this team event. Go to Team Hub to set up your squad first.'
        );
        return;
      }

      if (!isLeader) {
        const leaderName = eligibleTeam.members.find((m) => m.isLeader)?.fullName || 'Team Leader';
        setErrorMsg(
          `Only the team captain (${leaderName}) can register the team for events and complete payment.`
        );
        return;
      }

      if (eligibleTeam.members.length < eligibleTeam.minTeamSize) {
        setErrorMsg(
          `Team size requirement not met. Minimum ${eligibleTeam.minTeamSize} members required, but only ${eligibleTeam.members.length} have joined. Share your team code for members to join.`
        );
        return;
      }
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const category = (
        event.category === 'NON-TECHNICAL' ? 'NON_TECHNICAL' : event.category
      ) as EventRegistration['category'];

      // ── CRITICAL: Write registration to Firestore BEFORE any navigation ──
      const registration = await createEventRegistration({
        uid: currentUid,
        participantId: participantProfile.participantId,
        eventId: event.id,
        eventName: event.name,
        eventCategory: category,
        isTeamEvent,
        team: eligibleTeam || undefined,
      });

      setCreatedReg(registration);

      // Route based on fee
      if (registration.calculatedFee === 0) {
        // ₹0 — team already has verified payment → instantly confirmed
        setStep(3);
      } else {
        // Has fee → show payment page
        setStep(2);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: Payment proof submission
  // ─────────────────────────────────────────────────────────────────────────────

  const handleCopyUpi = () => {
    if (!paymentConfig) return;
    navigator.clipboard.writeText(paymentConfig.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUtr = utrInput.trim();
    if (!trimmedUtr) {
      setErrorMsg('UTR / Transaction ID is required.');
      return;
    }
    if (!createdReg?.registrationId) {
      setErrorMsg('Registration not found. Please close and try again.');
      return;
    }
    if (!uploaderRef.current?.isReady) {
      setErrorMsg('Payment screenshot proof is required. Please select an image.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const regId = createdReg.registrationId;

      // 1. Upload pre-optimized screenshot (with real-time progress)
      const uploadResult = await uploaderRef.current.upload();

      // 2. Atomically persist metadata & transition status to PAYMENT_VERIFICATION_PENDING in Firestore
      if (existingRegistration?.paymentStatus === 'REJECTED') {
        await resubmitPaymentProofToFirestore({
          registrationId: regId,
          utrNumber: trimmedUtr,
          proofMetadata: uploadResult,
        });
      } else {
        await savePaymentProofSubmissionToFirestore({
          registrationId: regId,
          utrNumber: trimmedUtr,
          proofMetadata: uploadResult,
        });
      }

      setStep(3);
    } catch (err: any) {
      console.error('Payment submission failed:', err);
      setErrorMsg(
        err.message ||
          'Upload failed. Your registration is still saved. Please retry the payment proof upload.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  const stepCount = isZeroFee ? 2 : 2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`TARAS 2K26 REGISTRATION — STEP ${step} OF ${stepCount}`}
    >
      <div className="space-y-6 font-mono text-xs">
        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-[#b91c1c] text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              1
            </span>
            <span className={step === 1 ? 'text-white font-bold' : 'text-slate-500'}>PARTICIPATION</span>
          </div>

          <div className="w-12 h-0.5 bg-white/10" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-[#b91c1c] text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isZeroFee ? '✓' : '2'}
            </span>
            <span className={step >= 2 ? 'text-white font-bold' : 'text-slate-500'}>
              {isZeroFee ? 'CONFIRMED' : 'PAYMENT'}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-white flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{errorMsg}</span>
              {isTeamEvent && !eligibleTeam && (
                <Link
                  to="/participant/dashboard#my-squads-section"
                  onClick={onClose}
                  className="block text-amber-400 font-bold underline mt-1"
                >
                  [ GO TO TEAM HUB ]
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 1: PARTICIPATION ── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Event Summary */}
            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] text-slate-400 uppercase">Event</span>
                <Badge variant="red">{event.category}</Badge>
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-white">{event.name}</h4>
                <p className="text-slate-400 text-[11px]">{event.shortDescription}</p>
              </div>
              {/* Fee Display */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-slate-400">Registration Fee:</span>
                <div className="text-right">
                  {feeLoading ? (
                    <span className="text-slate-500 text-xs">Calculating…</span>
                  ) : feeInfo !== null ? (
                    <div>
                      <span className={`text-xl font-extrabold ${feeInfo.fee === 0 ? 'text-green-400' : 'text-[#b91c1c]'}`}>
                        {feeInfo.fee === 0 ? '₹0' : `₹${feeInfo.fee}`}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {feeInfo.fee === 0
                          ? 'Free — team already paid'
                          : `₹150 × ${eligibleTeam?.memberCount || '?'} members`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base font-extrabold text-slate-400">₹150/person</span>
                  )}
                </div>
              </div>
            </div>

            {/* Team / Individual info card */}
            {isTeamEvent ? (
              <div className="p-4 rounded-2xl bg-[#0a0c10] border border-[#b91c1c]/40 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] text-[#b91c1c] uppercase font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> SQUAD REGISTRATION
                  </span>
                  <Badge variant={eligibleTeam ? 'green' : 'amber'}>
                    {eligibleTeam ? 'TEAM FOUND ✓' : 'NO TEAM'}
                  </Badge>
                </div>

                {eligibleTeam ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Squad Name:</span>
                      <span className="font-bold text-white text-sm">{eligibleTeam.teamName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Team Captain:</span>
                      <span className="text-amber-400 font-bold">
                        {eligibleTeam.members.find((m) => m.isLeader)?.fullName || participantProfile?.fullName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Members Joined:</span>
                      <span className="text-white font-bold">
                        {eligibleTeam.members.length} / {eligibleTeam.memberCount} declared
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Declared Count:</span>
                      <span className="text-white font-bold">{eligibleTeam.memberCount} members</span>
                    </div>

                    {myTeams.length > 1 && (
                      <div className="pt-2 border-t border-white/10 space-y-1">
                        <label className="text-[10px] text-slate-400 block font-mono">
                          SELECT SQUAD TO REGISTER:
                        </label>
                        <select
                          value={eligibleTeam.teamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                          className="w-full bg-[#141820] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#b91c1c]"
                        >
                          {myTeams.map((t) => (
                            <option key={t.teamId} value={t.teamId}>
                              {t.teamName} ({t.teamCode}) — {t.leaderUid === currentUid ? '★ Captain' : 'Member'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {!isLeader && (
                      <div className="p-3 rounded-xl bg-[#1a0000] border border-amber-500/50 text-amber-300 text-[11px] space-y-1">
                        <strong className="block text-white">LEADER REGISTRATION ONLY</strong>
                        <p>Only the team captain can complete event registration and payment.</p>
                      </div>
                    )}

                    {eligibleTeam.members.length < eligibleTeam.minTeamSize && (
                      <div className="p-3 rounded-xl bg-[#1a0a00] border border-orange-500/40 text-orange-300 text-[11px]">
                        <strong className="block">Team not ready.</strong>
                        Minimum {eligibleTeam.minTeamSize} members required. Share join code:{' '}
                        <span className="text-white font-bold">{eligibleTeam.teamCode}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#1a0000] text-slate-300 space-y-3">
                    <p className="text-[11px]">
                      You have not created or joined a squad yet. Create a team first in Team Hub, then come back to register.
                    </p>
                    <Link
                      to="/participant/dashboard#my-squads-section"
                      onClick={onClose}
                      className="inline-block px-3 py-1.5 rounded-xl bg-[#b91c1c] text-white font-bold uppercase text-[10px] hover:bg-[#991b1b] transition-colors"
                    >
                      GO TO TEAM HUB →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              /* Individual Event */
              <div className="p-4 rounded-2xl bg-[#0a0c10] border border-white/10 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">PARTICIPANT CONFIRMATION</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Participant Name:</span>
                  <span className="font-bold text-white">{participantProfile?.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">College:</span>
                  <span className="text-slate-300">{participantProfile?.college}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Registration Fee:</span>
                  <span className="text-[#b91c1c] font-bold">₹150</span>
                </div>
              </div>
            )}

            {/* Info note */}
            <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span className="text-[10px] text-slate-400">
                Clicking "Continue to Payment" will create your registration record in our system first, then take you to the payment page. The ₹0 fee applies to subsequent events after your first verified payment.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <Button variant="outline" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="glow"
                size="md"
                type="button"
                onClick={handleStep1Continue}
                disabled={isSubmitting || (isTeamEvent && (!eligibleTeam || !isLeader || eligibleTeam.members.length < eligibleTeam.minTeamSize))}
                className="font-bold font-mono"
              >
                {isSubmitting ? 'Creating Registration…' : 'CONTINUE TO PAYMENT'}{' '}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PAYMENT ── */}
        {step === 2 && createdReg && !isZeroFee && (
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            {/* Fee Summary */}
            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-[#b91c1c]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Amount to Pay</span>
                <span className="text-2xl font-black text-white">₹{createdReg.calculatedFee}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Registration ID: <strong className="text-[#b91c1c]">{createdReg.registrationId}</strong>
                </span>
                {createdReg.teamMemberCount && (
                  <span className="text-[10px] text-slate-500 block">
                    ₹150 × {createdReg.teamMemberCount} members
                  </span>
                )}
              </div>

              {paymentConfig && (
                <div className="flex items-center gap-2 bg-[#1a0000] px-3 py-2 rounded-xl border border-[#b91c1c]/40 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">TARAS Official UPI:</span>
                    <span className="font-bold text-white font-mono">{paymentConfig.upiId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1.5 rounded-lg bg-[#0a0c10] text-[#b91c1c] hover:text-white"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* UPI QR */}
            <div className="p-6 rounded-2xl bg-[#06080c] border border-white/10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="p-3 bg-white rounded-2xl shadow-xl shadow-red-950/20 shrink-0">
                <QRCodeSVG value={upiUri} size={150} level="M" />
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-300">
                <span className="text-amber-400 font-bold block flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" /> OFFICIAL TARAS UPI QR
                </span>
                <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                  Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI banking app.
                </p>
                <div className="p-2 rounded-xl bg-[#1a0000] border border-[#b91c1c]/40 text-[10px] text-white">
                  <strong>Payee:</strong> {paymentConfig?.payeeName || 'TARAS 2K26 Official'}
                </div>
              </div>
            </div>

            {/* Payment Proof Fields */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                  UTR / Transaction Reference ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 628391746281 — 12-digit UPI Ref No."
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  disabled={isSubmitting || uploaderState === 'uploading'}
                  className="w-full px-3.5 py-3 bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#b91c1c] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                  Payment Screenshot Proof <span className="text-red-500">*</span>
                </label>
                <PaymentProofUploader
                  ref={uploaderRef}
                  registrationId={createdReg.registrationId}
                  existingScreenshotUrl={existingRegistration?.paymentScreenshotUrl}
                  onStateChange={setUploaderState}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting || uploaderState === 'uploading'}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                variant="glow"
                size="md"
                type="submit"
                disabled={isSubmitting || uploaderState === 'uploading' || uploaderState === 'compressing'}
                className="font-bold font-mono py-3"
              >
                {isSubmitting || uploaderState === 'uploading'
                  ? 'Submitting Proof…'
                  : 'SUBMIT PAYMENT FOR VERIFICATION'}
              </Button>
            </div>
          </form>
        )}

        {/* ── STEP 3: CONFIRMED / SUBMITTED ── */}
        {step === 3 && (
          <div
            className={`p-6 rounded-3xl border text-center space-y-5 animate-fadeIn ${
              isZeroFee
                ? 'bg-emerald-950/30 border-green-500/50'
                : 'bg-[#0a0c10] border-amber-500/50'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${
                isZeroFee
                  ? 'bg-emerald-900/60 border border-green-500 text-green-400 shadow-emerald-950/40'
                  : 'bg-amber-950/60 border border-amber-500 text-amber-400 shadow-amber-950/40'
              }`}
            >
              {isZeroFee ? <Zap className="w-7 h-7" /> : <CheckSquare className="w-7 h-7" />}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">
                {isZeroFee ? 'REGISTRATION CONFIRMED ✓' : 'PAYMENT SUBMITTED ✓'}
              </h3>
              <p className={`text-xs font-bold ${isZeroFee ? 'text-green-400' : 'text-amber-400'}`}>
                {isZeroFee
                  ? 'Status: CONFIRMED — No payment required'
                  : 'Status: PENDING REGISTRATION TEAM REVIEW'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#06080c] border border-white/10 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Registration ID:</span>
                <span className="font-bold text-[#b91c1c]">{createdReg?.registrationId || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Event:</span>
                <span className="text-white font-bold">{event.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className={`font-bold ${isZeroFee ? 'text-green-400' : 'text-white'}`}>
                  {isZeroFee ? '₹0 (Already Paid)' : `₹${createdReg?.calculatedFee}`}
                </span>
              </div>
              {!isZeroFee && utrInput && (
                <div className="flex justify-between">
                  <span className="text-slate-400">UTR / Ref:</span>
                  <span className="text-slate-200">{utrInput}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Digital Pass:</span>
                <span className={`font-bold flex items-center gap-1 ${isZeroFee ? 'text-green-400' : 'text-amber-400'}`}>
                  {isZeroFee ? (
                    <><ShieldCheck className="w-3 h-3" /> ACTIVE</>
                  ) : (
                    <><Lock className="w-3 h-3" /> LOCKED UNTIL VERIFIED</>
                  )}
                </span>
              </div>
            </div>

            {!isZeroFee && (
              <p className="text-[11px] text-slate-400 font-light">
                Your payment proof is under manual review by the TARAS Registration Team. Once verified, your Digital Pass and Event QR will be activated automatically.
              </p>
            )}

            {isZeroFee && (
              <div className="p-3 rounded-xl bg-emerald-900/20 border border-green-500/30 text-[11px] text-green-300 font-mono">
                Your team's previous payment has been verified. This event registration is <strong>free of charge</strong>. Your Digital Pass is now active for this event.
              </div>
            )}

            <Button
              variant="glow"
              size="md"
              type="button"
              onClick={() => {
                onClose();
                navigate('/participant/dashboard');
              }}
              className="w-full justify-center font-bold"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> RETURN TO DASHBOARD
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
