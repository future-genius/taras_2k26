/**
 * TARAS 2K26 — Registration Wizard Modal
 *
 * WORKFLOW:
 * 1. Step 1 (Participation): Show team/participant info & registration fee.
 *    - Internal Students: Allowed ONLY for Paper Presentation (taras-01), ₹0 fee (Free).
 *    - External Students / Paid registrations: Fixed ₹200 fee.
 *    - Max 3 events total per participant/team.
 * 2. Step 2 (Bank Transfer Payment):
 *    - Official City Union Bank details display.
 *    - UTR / Transaction ID input + Screenshot upload (under 1 MB).
 * 3. Step 3 (Confirmed / Pending Review): Confirmation screen.
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
import { createEventRegistration, getParticipantRegistrations } from '../../services/eventRegistrationService';
import { isInternalStudent } from '../../utils/college';
import type { TARASEvent } from '../../types/event';
import type { EventTeam } from '../../types/team';
import type { RegistrationPaymentConfig } from '../../types/registrationConfig';
import type { EventRegistration } from '../../types/registration';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  ShieldCheck,
  Building2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
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

  const currentUid = user?.uid || participantProfile?.uid || '';
  const isInternal = isInternalStudent(participantProfile?.college);
  const isPaperPresentation = event.id === 'taras-01';

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(existingRegistration ? 2 : 1);
  const [paymentConfig, setPaymentConfig] = useState<RegistrationPaymentConfig | null>(null);
  const [copiedBankInfo, setCopiedBankInfo] = useState(false);

  // Selected team ID state if participant has multiple teams
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Registration result state
  const [createdReg, setCreatedReg] = useState<EventRegistration | null>(existingRegistration || null);
  const [registeredEventCount, setRegisteredEventCount] = useState<number>(0);

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

  // Fee calculation
  const calculatedFee = (isInternal && isPaperPresentation) ? 0 : 200;
  const isZeroFee = (createdReg?.calculatedFee ?? calculatedFee) === 0;

  useEffect(() => {
    if (!isOpen) return;
    getPaymentConfig().then(setPaymentConfig).catch(() => null);

    if (currentUid) {
      getParticipantRegistrations(currentUid).then((regs) => {
        const active = regs.filter((r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED');
        setRegisteredEventCount(active.length);
      }).catch(() => null);
    }

    if (existingRegistration) {
      setStep(2);
      setCreatedReg(existingRegistration);
      setUtrInput(existingRegistration.utrNumber || '');
      return;
    }

    setStep(1);
    setErrorMsg(null);
    setCreatedReg(null);
  }, [isOpen, existingRegistration, currentUid]);

  const handleStep1Continue = async () => {
    if (!participantProfile) {
      navigate('/participant/login');
      return;
    }

    if (isInternal && !isPaperPresentation) {
      setErrorMsg('Internal college students are allowed to register ONLY for the Paper Presentation event.');
      return;
    }

    if (registeredEventCount >= 3) {
      setErrorMsg('Maximum limit of 3 registered events reached. You cannot register for more than 3 events.');
      return;
    }

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
          `Team size requirement not met. Minimum ${eligibleTeam.minTeamSize} members required, but only ${eligibleTeam.members.length} have joined.`
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

      if (registration.calculatedFee === 0) {
        setStep(3);
      } else {
        setStep(2);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyBankDetails = () => {
    const text = `Account Name: VALLIAMMAI ENGINEERING COLLEGE\nBank: City Union Bank Ltd\nAccount No: 117109000031450\nIFSC: CIUB0000117\nBranch: TAMBARAM BRANCH (EXTN COUNTER)`;
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 2500);
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

      const uploadResult = await uploaderRef.current.upload();

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
          'Submission failed. Your registration is saved. Please retry uploading the screenshot.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepCount = isZeroFee ? 2 : 2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`TARAS 2K26 REGISTRATION — STEP ${step} OF ${stepCount}`}
    >
      <div className="space-y-6 font-mono text-xs">
        {/* Step Indicator */}
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
              {isZeroFee ? 'CONFIRMED' : 'BANK PAYMENT'}
            </span>
          </div>
        </div>

        {/* Internal Student Restricted Banner */}
        {isInternal && !isPaperPresentation && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/60 text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white">INTERNAL STUDENT ELIGIBILITY NOTICE</strong>
              Internal college students (VEC / SRM VEC) are allowed to register <strong>ONLY for the Paper Presentation event</strong> (Paper-X-Verse). Registration for this non-paper event is restricted.
            </div>
          </div>
        )}

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
                  {isInternal && isPaperPresentation ? (
                    <div>
                      <span className="text-xl font-extrabold text-green-400">FREE (₹0)</span>
                      <span className="text-[10px] text-slate-400 block">Internal College Paper Presentation</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xl font-extrabold text-[#b91c1c]">₹200</span>
                      <span className="text-[10px] text-slate-400 block">Fixed Event Fee</span>
                    </div>
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
              </div>
            )}

            {/* 3-Event Limit Info */}
            <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span className="text-[10px] text-slate-400">
                Registered Events Limit: <strong>{registeredEventCount} / 3</strong> max events allowed per participant.
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
                disabled={
                  isSubmitting ||
                  (isInternal && !isPaperPresentation) ||
                  registeredEventCount >= 3 ||
                  (isTeamEvent && (!eligibleTeam || !isLeader || eligibleTeam.members.length < eligibleTeam.minTeamSize))
                }
                className="font-bold font-mono"
              >
                {isSubmitting ? 'Creating Registration…' : isZeroFee ? 'CONFIRM FREE REGISTRATION' : 'CONTINUE TO PAYMENT'}{' '}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: BANK TRANSFER PAYMENT ── */}
        {step === 2 && createdReg && !isZeroFee && (
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            {/* Amount Banner */}
            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-[#b91c1c]/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Registration Fee</span>
                <span className="text-2xl font-black text-white">₹200</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Registration ID</span>
                <strong className="text-[#b91c1c] text-sm">{createdReg.registrationId}</strong>
              </div>
            </div>

            {/* Official Bank Account Details Card */}
            <div className="p-4.5 rounded-2xl bg-[#06080c] border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-amber-400 font-bold text-xs uppercase flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> OFFICIAL BANK TRANSFER DETAILS
                </span>
                <button
                  type="button"
                  onClick={handleCopyBankDetails}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 flex items-center gap-1 text-[10px] transition-colors"
                >
                  {copiedBankInfo ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedBankInfo ? 'COPIED!' : 'COPY DETAILS'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">ACCOUNT NAME</span>
                  <strong className="text-white">VALLIAMMAI ENGINEERING COLLEGE</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">BANK NAME</span>
                  <strong className="text-white">City Union Bank Ltd</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ACCOUNT NUMBER</span>
                  <strong className="text-amber-400 font-mono text-sm">117109000031450</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">IFSC CODE</span>
                  <strong className="text-amber-400 font-mono text-sm">CIUB0000117</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">BRANCH</span>
                  <span className="text-slate-200">TAMBARAM BRANCH (EXTN COUNTER)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">MICR CODE</span>
                  <span className="text-slate-200 font-mono">600054011</span>
                </div>
              </div>
            </div>

            {/* Proof Inputs */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                  12-DIGIT TRANSACTION ID / UTR NUMBER <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter 12-digit Bank / UTR Reference Number"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  disabled={isSubmitting || uploaderState === 'uploading'}
                  className="w-full px-3.5 py-3 bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#b91c1c] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                  PAYMENT RECEIPT SCREENSHOT (UNDER 1 MB) <span className="text-red-500">*</span>
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
                  ? 'Status: CONFIRMED — Free Internal Registration'
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
                  {isZeroFee ? '₹0 (Free Internal Student)' : '₹200'}
                </span>
              </div>
              {!isZeroFee && utrInput && (
                <div className="flex justify-between">
                  <span className="text-slate-400">UTR / Ref:</span>
                  <span className="text-slate-200 font-mono">{utrInput}</span>
                </div>
              )}
            </div>

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
