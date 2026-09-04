import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { TARASEvent } from '../../types/event';
import { Users, PlusCircle, LogIn, CheckCircle2, AlertCircle, Copy } from 'lucide-react';

interface TeamRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TARASEvent;
}

export const TeamRegistrationModal: React.FC<TeamRegistrationModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { createTeam, requestJoinTeam } = useAuth();

  const [mode, setMode] = useState<'CHOICE' | 'CREATE' | 'JOIN' | 'SUCCESS'>('CHOICE');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [createdTeamCode, setCreatedTeamCode] = useState('');
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const team = await createTeam(
        teamName,
        event.minTeamSize || 2,
        event.minTeamSize,
        event.maxTeamSize
      );
      setCreatedTeamCode(team.teamCode);
      setIsRequestSent(false);
      setMode('SUCCESS');
    } catch (err: any) {
      console.error('[TARAS 2K26] Team creation error:', err);
      setErrorMessage(err.message || 'Failed to create team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const req = await requestJoinTeam(teamCode);
      setCreatedTeamCode(req.teamCode);
      setIsRequestSent(true);
      setMode('SUCCESS');
    } catch (err: any) {
      console.error('[TARAS 2K26] Team join error:', err);
      setErrorMessage(err.message || 'Failed to submit join request. Verify code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setMode('CHOICE');
        setErrorMessage(null);
        onClose();
      }}
      title={`Team Registration — ${event.name}`}
    >
      <div className="space-y-5">
        {/* Header Requirement Banner */}
        <div className="p-3.5 rounded-xl bg-[#1a0000]/80 border border-[#b91c1c]/40 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300">Team Size Constraint:</span>
          <span className="text-[#b91c1c] font-bold">
            {event.minTeamSize} to {event.maxTeamSize} Members
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Choice Mode */}
        {mode === 'CHOICE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <button
              onClick={() => setMode('CREATE')}
              className="p-6 rounded-2xl bg-[#0a0c10] border border-slate-800 hover:border-[#b91c1c] transition-all text-center space-y-3 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1a0000] border border-[#b91c1c]/40 text-[#b91c1c] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-mono">Create New Team</h4>
                <p className="text-xs text-slate-400 mt-1 font-light">
                  Form a new team as Team Leader and receive a shareable 6-character team code.
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode('JOIN')}
              className="p-6 rounded-2xl bg-[#0a0c10] border border-slate-800 hover:border-[#b91c1c] transition-all text-center space-y-3 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1a0000] border border-[#b91c1c]/40 text-[#b91c1c] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-mono">Join Existing Team</h4>
                <p className="text-xs text-slate-400 mt-1 font-light">
                  Enter the 6-character Team Code provided by your Team Leader.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Create Mode */}
        {mode === 'CREATE' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Team Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CyberWeavers Alpha"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setMode('CHOICE')}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                &larr; Back
              </button>
              <Button variant="glow" size="md" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Team…' : 'Confirm & Create Team'}
              </Button>
            </div>
          </form>
        )}

        {/* Join Mode */}
        {mode === 'JOIN' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Enter Team Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TR-89A4"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white font-mono uppercase tracking-wider focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setMode('CHOICE')}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                &larr; Back
              </button>
              <Button variant="glow" size="md" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Joining Team…' : 'Join Team'}
              </Button>
            </div>
          </form>
        )}

        {/* Success Mode */}
        {mode === 'SUCCESS' && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-[#b91c1c] mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white font-mono">
              {isRequestSent ? '⏳ JOIN REQUEST SUBMITTED' : 'TEAM CREATED SUCCESSFULLY'}
            </h3>
            {isRequestSent ? (
              <p className="text-xs text-slate-300 font-light max-w-sm mx-auto leading-relaxed">
                Your request to join team <strong>{createdTeamCode}</strong> has been sent to the Team Captain. You will be added as a confirmed member as soon as the captain approves your request.
              </p>
            ) : (
              <p className="text-xs text-slate-300 font-light">
                You are registered as Captain for <strong>{event.name}</strong>. Share your Team Code with team members:
              </p>
            )}

            {!isRequestSent && (
              <div className="p-4 rounded-xl bg-[#0a0c10] border border-[#b91c1c]/60 inline-flex items-center gap-3">
                <span className="text-xl font-black text-white font-mono tracking-widest">{createdTeamCode}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(createdTeamCode)}
                  className="p-1.5 rounded bg-[#1a0000] text-[#b91c1c] hover:text-white transition-colors"
                  title="Copy Team Code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="pt-4 flex justify-center">
              <Button variant="glow" size="md" onClick={onClose}>
                Go to My Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
