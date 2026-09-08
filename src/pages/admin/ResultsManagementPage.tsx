import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  db,
  runAtomicPublishResult,
  runAtomicReopenScorecard,
  runAtomicIssueCertificate,
} from '../../config/firebase';
import type { Scorecard, EventResult, CertificateRecord } from '../../types/eventDay';
import { MOCK_EVENTS } from '../../data/events';
import { computeDeterministicRanking } from '../../services/rankingEngine';
import { evaluateResultsReadiness } from '../../services/analyticsService';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Trophy,
  Medal,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  RefreshCw,
  FileSpreadsheet,
  FileCheck,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  Users,
} from 'lucide-react';

export const ResultsManagementPage: React.FC = () => {
  const { user, assignedEventIds = [], role } = useAuth();

  const availableEvents = MOCK_EVENTS.filter((e) => {
    if (role === 'super_admin' || role === 'admin' || role === 'PRESIDENT') return true;
    if (assignedEventIds && assignedEventIds.length > 0) return assignedEventIds.includes(e.id);
    return true;
  });

  const [selectedEventId, setSelectedEventId] = useState<string>(availableEvents[0]?.id || MOCK_EVENTS[0].id);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [publishedResults, setPublishedResults] = useState<EventResult[]>([]);
  const [issuedCerts, setIssuedCerts] = useState<CertificateRecord[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [participantsMap, setParticipantsMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [winnerTargetId, setWinnerTargetId] = useState('');
  const [runnerUpTargetId, setRunnerUpTargetId] = useState('');
  const [specialMentionTargetId, setSpecialMentionTargetId] = useState('');

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isIssuingCerts, setIsIssuingCerts] = useState(false);

  const currentEvent = availableEvents.find((e) => e.id === selectedEventId) || availableEvents[0] || MOCK_EVENTS[0];

  const fetchData = async () => {
    setIsLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const [scores, resDocs, certsDocs, regs, parts] = await Promise.all([
        db.queryWhere('scorecards', 'eventId', selectedEventId),
        db.getCollection('results'),
        db.queryWhere('certificate_records', 'eventId', selectedEventId),
        db.queryWhere('registrations', 'eventId', selectedEventId),
        db.getCollection('participants'),
      ]);

      setScorecards(scores as unknown as Scorecard[]);
      setPublishedResults(resDocs as unknown as EventResult[]);
      setIssuedCerts(certsDocs as unknown as CertificateRecord[]);
      setRegistrations(regs);

      const pMap: Record<string, any> = {};
      parts.forEach((p: any) => {
        pMap[p.id || p.uid] = p;
      });
      setParticipantsMap(pMap);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEventId]);

  // Compute deterministic ranking sorted by totalScore DESC
  const deterministicRankings = computeDeterministicRanking({
    event: currentEvent,
    scorecards,
    participantsMetadata: Object.fromEntries(
      Object.entries(participantsMap).map(([uid, p]) => [
        uid,
        { fullName: p.fullName || 'Participant', college: p.college || 'Institution', participantId: p.participantId },
      ])
    ),
  });

  // Evaluate Live Results Publication Readiness (Phase 11 Pre-Flight Quality Check)
  const readiness = evaluateResultsReadiness(
    selectedEventId,
    registrations,
    scorecards as unknown as Record<string, unknown>[],
    publishedResults as unknown as Record<string, unknown>[]
  );

  // Handle Official Results Publication
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (deterministicRankings.length === 0) {
      setActionError('Cannot publish results without evaluated scorecards.');
      return;
    }

    setIsPublishing(true);
    setActionError(null);
    setActionSuccess(null);

    const winnerItem = deterministicRankings.find((r) => r.targetId === winnerTargetId) || deterministicRankings[0];
    const runnerUpItem =
      deterministicRankings.find((r) => r.targetId === runnerUpTargetId) || deterministicRankings[1] || deterministicRankings[0];
    const specialMentionItem = deterministicRankings.find((r) => r.targetId === specialMentionTargetId);

    try {
      await runAtomicPublishResult(
        {
          resultId: `RES-${currentEvent.id}`,
          eventId: currentEvent.id,
          eventName: currentEvent.name,
          category: currentEvent.category,
          winner: {
            targetId: winnerItem.targetId,
            name: winnerItem.name,
            college: winnerItem.college,
            score: winnerItem.totalScore,
            teamCode: winnerItem.teamCode,
            members: winnerItem.teamMembers,
          },
          runnerUp: {
            targetId: runnerUpItem.targetId,
            name: runnerUpItem.name,
            college: runnerUpItem.college,
            score: runnerUpItem.totalScore,
            teamCode: runnerUpItem.teamCode,
            members: runnerUpItem.teamMembers,
          },
          specialMention: specialMentionItem
            ? {
                targetId: specialMentionItem.targetId,
                name: specialMentionItem.name,
                college: specialMentionItem.college,
                score: specialMentionItem.totalScore,
                teamCode: specialMentionItem.teamCode,
                members: specialMentionItem.teamMembers,
              }
            : undefined,
          rankings: deterministicRankings,
          status: 'PUBLISHED',
        },
        user.uid
      );

      setActionSuccess(`Official results for "${currentEvent.name}" published! Live on public /results page.`);
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to publish results.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Scorecard Unlock/Reopen
  const handleReopen = async (scorecardId: string) => {
    if (!user) return;
    try {
      await runAtomicReopenScorecard(scorecardId, user.uid);
      setActionSuccess('Scorecard unlocked and reopened for judge revisions.');
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Reopen failed.');
    }
  };

  // Handle Batch Certificate Issuance for Track
  const handleBatchIssueCertificates = async () => {
    if (!user) return;
    setIsIssuingCerts(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      let count = 0;
      // 1. Issue Merit Cert for Winner
      if (deterministicRankings[0]) {
        await runAtomicIssueCertificate(
          deterministicRankings[0].targetId,
          currentEvent.id,
          currentEvent.name,
          '1st Place Winner',
          'MERIT',
          user.uid
        );
        count++;
      }

      // 2. Issue Merit Cert for Runner Up
      if (deterministicRankings[1]) {
        await runAtomicIssueCertificate(
          deterministicRankings[1].targetId,
          currentEvent.id,
          currentEvent.name,
          '2nd Place Runner Up',
          'MERIT',
          user.uid
        );
        count++;
      }

      // 3. Issue Participation Cert for attendees with PRESENT attendance
      for (const reg of registrations) {
        if (reg.eventAttendance === 'PRESENT' && reg.uid !== deterministicRankings[0]?.targetId && reg.uid !== deterministicRankings[1]?.targetId) {
          await runAtomicIssueCertificate(
            reg.uid,
            currentEvent.id,
            currentEvent.name,
            'Symposium Participant',
            'PARTICIPATION',
            user.uid
          );
          count++;
        }
      }

      setActionSuccess(`Successfully generated and issued ${count} authentic certificate records for ${currentEvent.name}! Verifiable on /verify-certificate.`);
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to issue certificates.');
    } finally {
      setIsIssuingCerts(false);
    }
  };

  const existingResult = publishedResults.find((r) => r.eventId === selectedEventId);

  return (
    <div className="space-y-8 pb-24">
      <AdminNav />

      <VisualAtmosphere
        environmentKey="adminDashboard"
        badgeText="SYMPOSIUM RESULTS & CERTIFICATES ENGINE"
        title="RESULTS PUBLICATION & PODIUM CONTROL"
        subtitle="Compute deterministic rankings, review submitted scorecards, manage winner declarations, and issue certificates."
        height="compact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Track Selector Bar */}
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              Select Event Track:
            </span>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="text-xs font-mono">
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {availableEvents.map((ev) => {
              const hasPublished = publishedResults.some((r) => r.eventId === ev.id && r.status === 'PUBLISHED');
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    currentEvent.id === ev.id
                      ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
                      : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Trophy className={`w-3.5 h-3.5 ${hasPublished ? 'text-amber-400' : 'text-slate-500'}`} />
                  {ev.name}
                  {hasPublished && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-green-500/60 text-green-400 text-xs font-mono font-bold flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-[#b91c1c] text-xs font-mono font-bold flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* ── Main Operations Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Scorecards Review & Deterministic Ranking Engine */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deterministic Ranking Matrix */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/40 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    DETERMINISTIC RANKINGS — {currentEvent.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Calculated by total score descending with deterministic tie-breaking.
                  </p>
                </div>
                <Badge variant={existingResult?.status === 'PUBLISHED' ? 'green' : 'outline'}>
                  {existingResult?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'}
                </Badge>
              </div>

              {deterministicRankings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  No evaluated scorecards found for this event track.
                </div>
              ) : (
                <div className="space-y-3">
                  {deterministicRankings.map((item) => (
                    <div
                      key={item.targetId}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                        item.rank === 1
                          ? 'bg-[#1a0000] border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.2)]'
                          : item.rank === 2
                          ? 'bg-[#0e1017] border-slate-700'
                          : 'bg-[#0a0c10] border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
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
                          <div className="font-bold text-white text-xs font-mono flex items-center gap-2">
                            {item.name}
                            <Badge variant={item.rank === 1 ? 'crimson' : 'outline'}>
                              {item.achievement || 'FINALIST'}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.college} {item.teamMembers ? `• Members: ${item.teamMembers.join(', ')}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-white font-mono">{item.totalScore}</div>
                        <div className="text-[9px] text-slate-500 font-mono">Total / 100</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scorecards Inspection & Reopening */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#b91c1c]" />
                SUBMITTED SCORECARDS AUDIT & UNLOCK CONSOLE
              </h3>

              {scorecards.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-mono">
                  No submitted scorecards to review.
                </div>
              ) : (
                <div className="space-y-3">
                  {scorecards.map((sc) => (
                    <div
                      key={sc.scorecardId}
                      className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs font-mono">{sc.targetName}</span>
                          <Badge variant={sc.status === 'SUBMITTED' ? 'crimson' : 'outline'}>
                            {sc.status}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Evaluated by Judge: {sc.judgeName} • Total Score: <strong className="text-white">{sc.totalScore}/100</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {Object.entries(sc.criteria || {})
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' | ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {sc.status === 'SUBMITTED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReopen(sc.scorecardId)}
                            className="text-[10px] font-mono"
                          >
                            <Unlock className="w-3.5 h-3.5 mr-1" />
                            Unlock / Reopen
                          </Button>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-400 font-bold">REOPENED</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Publication & Certificate Issuance */}
          <div className="space-y-6">
            {/* Pre-Flight Results Readiness Card */}
            <div
              className={`p-6 rounded-3xl border space-y-4 ${
                readiness.isReady
                  ? 'bg-[#060e08] border-green-500/50'
                  : 'bg-[#120808] border-amber-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {readiness.isReady ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  )}
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    RESULTS READINESS CHECK
                  </h3>
                </div>
                <Badge variant={readiness.isReady ? 'green' : 'amber'} size="sm">
                  {readiness.isReady ? 'READY TO PUBLISH ✓' : 'NOT READY'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2.5 rounded-xl bg-[#0a0c10] border border-slate-800">
                  <span className="text-slate-500 block">Scorecards:</span>
                  <span className="text-white font-bold">
                    {readiness.scorecardsSubmitted}/{readiness.scorecardsRequired} Submitted
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0a0c10] border border-slate-800">
                  <span className="text-slate-500 block">Attendance:</span>
                  <span className={readiness.attendanceComplete ? 'text-green-400 font-bold' : 'text-amber-400'}>
                    {readiness.attendanceComplete ? 'Complete ✓' : `${readiness.incompleteAttendanceCount} Unrecorded`}
                  </span>
                </div>
              </div>

              {!readiness.isReady && readiness.blockers.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#1a0000] border border-[#dc2626]/40 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#dc2626] uppercase block">
                    Publication Blockers:
                  </span>
                  <ul className="space-y-1 text-[11px] font-mono text-slate-300">
                    {readiness.blockers.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#dc2626]">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Official Publication Card */}
            <div className="glass-panel-glow p-6 rounded-3xl border border-[#b91c1c]/50 space-y-4">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Send className="w-4 h-4 text-[#b91c1c]" />
                PUBLISH OFFICIAL PODIUM
              </h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Publishing locks this track's official standings, updates event state to COMPLETED, and exposes declared winners on the public <strong className="text-white">/results</strong> page.
              </p>

              <form onSubmit={handlePublish} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                    1st Place Winner Override (Optional)
                  </label>
                  <select
                    value={winnerTargetId}
                    onChange={(e) => setWinnerTargetId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
                  >
                    <option value="">-- Auto: Highest Deterministic Score --</option>
                    {deterministicRankings.map((r) => (
                      <option key={r.targetId} value={r.targetId}>
                        {r.name} (Score: {r.totalScore})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                    2nd Place Runner Up Override (Optional)
                  </label>
                  <select
                    value={runnerUpTargetId}
                    onChange={(e) => setRunnerUpTargetId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none"
                  >
                    <option value="">-- Auto: 2nd Deterministic Score --</option>
                    {deterministicRankings.map((r) => (
                      <option key={r.targetId} value={r.targetId}>
                        {r.name} (Score: {r.totalScore})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="glow"
                  size="md"
                  type="submit"
                  disabled={isPublishing || deterministicRankings.length === 0}
                  className="w-full justify-center font-mono py-3 text-xs font-bold"
                >
                  {isPublishing ? 'Publishing to Live Podium…' : 'Publish Official Event Results'}
                </Button>
              </form>
            </div>

            {/* Certificate Pipeline Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-green-400" />
                  CERTIFICATE PIPELINE
                </h3>
                <Badge variant="green">{issuedCerts.length} Issued</Badge>
              </div>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Generate authentic, verifiable certificates with cryptographic verification codes for winners and verified participants.
              </p>

              <Button
                variant="outline"
                size="md"
                onClick={handleBatchIssueCertificates}
                disabled={isIssuingCerts || deterministicRankings.length === 0}
                className="w-full justify-center font-mono py-3 text-xs font-bold border-green-500/40 text-green-400 hover:bg-green-500/10"
              >
                {isIssuingCerts ? 'Issuing Certificates…' : 'Issue Verifiable Certificates'}
              </Button>

              {issuedCerts.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                    Recent Track Certificates:
                  </span>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {issuedCerts.map((cert) => (
                      <div
                        key={cert.certId}
                        className="p-2 rounded-lg bg-[#0a0c10] border border-slate-800/80 flex items-center justify-between text-[10px] font-mono"
                      >
                        <span className="font-bold text-white truncate max-w-[140px]">{cert.fullName}</span>
                        <span className="text-green-400">{cert.achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
