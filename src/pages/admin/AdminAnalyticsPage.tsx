import React, { useMemo } from 'react';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import {
  computeAttendanceFunnel,
  computeCategoryDistribution,
  computeCollegeBreakdown,
  computeScorecardSummary,
  computeCertificatePipeline,
  computePerEventAttendance,
} from '../../services/analyticsService';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  Building2,
  Activity,
  BarChart3,
  PieChart,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// ─── Mini Bar Component ────────────────────────────────────────────────────────
const MiniBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
  sublabel?: string;
}> = ({ label, value, max, color, sublabel }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-slate-300 truncate max-w-[70%]">{label}</span>
        <span className="font-bold text-white">
          {value} <span className="text-slate-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {sublabel && (
        <p className="text-[9px] font-mono text-slate-500">{sublabel}</p>
      )}
    </div>
  );
};

// ─── Funnel Step Component ─────────────────────────────────────────────────────
const FunnelStep: React.FC<{
  step: number;
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}> = ({ step, label, value, total, color, icon }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const width = 100 - (step - 1) * 12;
  return (
    <div
      className="mx-auto rounded-2xl p-4 flex items-center justify-between gap-4 border border-slate-800/60"
      style={{
        width: `${width}%`,
        backgroundColor: `${color}12`,
        borderColor: `${color}30`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
        <div>
          <div
            className="text-xs font-mono font-bold uppercase tracking-wider"
            style={{ color }}
          >
            Step {step}: {label}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {value} participants — {pct}% of total registered
          </div>
        </div>
      </div>
      <div className="text-2xl font-black font-mono text-white">{value}</div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  accent?: string;
}> = ({ label, value, sublabel, icon, accent = '#b91c1c' }) => (
  <div
    className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3"
    style={{ borderColor: `${accent}25` }}
  >
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
        {label}
      </span>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${accent}20`, color: accent }}
      >
        {icon}
      </div>
    </div>
    <div className="text-3xl font-black text-white font-mono">{value}</div>
    {sublabel && (
      <p className="text-[10px] font-mono text-slate-400">{sublabel}</p>
    )}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AdminAnalyticsPage: React.FC = () => {
  const { data: participants, loading: loadP } = useFirestoreCollection('participants');
  const { data: registrations, loading: loadR } = useFirestoreCollection('registrations');
  const { data: scorecards, loading: loadS } = useFirestoreCollection('scorecards');
  const { data: certificates, loading: loadC } = useFirestoreCollection('certificate_records');
  const { data: results, loading: loadRe } = useFirestoreCollection('results');

  const isLoading = loadP || loadR || loadS || loadC || loadRe;

  const funnel = useMemo(
    () => computeAttendanceFunnel(participants, registrations),
    [participants, registrations]
  );

  const categoryDist = useMemo(
    () => computeCategoryDistribution(registrations),
    [registrations]
  );

  const collegeBreakdown = useMemo(
    () => computeCollegeBreakdown(participants, 10),
    [participants]
  );

  const scorecardStats = useMemo(
    () => computeScorecardSummary(scorecards),
    [scorecards]
  );

  const certPipeline = useMemo(
    () => computeCertificatePipeline(certificates),
    [certificates]
  );

  const perEventAttendance = useMemo(
    () => computePerEventAttendance(registrations),
    [registrations]
  );

  const publishedResultsCount = results.filter(
    (r) => (r as any).status === 'PUBLISHED'
  ).length;

  // Category colors
  const CATEGORY_COLORS: Record<string, string> = {
    TECHNICAL: '#b91c1c',
    'NON-TECHNICAL': '#0891b2',
    WORKSHOP: '#d97706',
    UNKNOWN: '#475569',
  };

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="PHASE 9 // LIVE ANALYTICS ENGINE"
        title="SYMPOSIUM ANALYTICS"
        subtitle="Real-time cross-collection intelligence: attendance funnels, category distribution, college breakdown, scoring rates, and certificate pipeline."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Live Data Badge */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}
            />
            {isLoading ? 'Syncing live data…' : 'Live Firestore — Real-time updates active'}
          </div>
          <span>|</span>
          <span>{participants.length} participants · {registrations.length} registrations · {scorecards.length} scorecards</span>
        </div>

        {isLoading && <LoadingSpinner label="Aggregating live symposium data…" />}

        {!isLoading && (
          <>
            {/* ── Executive Summary KPIs ── */}
            <div>
              <h2 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">
                Executive Summary
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard
                  label="Total Participants"
                  value={funnel.totalRegistered}
                  sublabel="Across all tracks"
                  icon={<Users className="w-4 h-4" />}
                  accent="#b91c1c"
                />
                <StatCard
                  label="Gate Check-Ins"
                  value={funnel.venueCheckedIn}
                  sublabel={`${funnel.venueCheckInRate}% turnout`}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  accent="#22c55e"
                />
                <StatCard
                  label="Event Present"
                  value={funnel.eventCheckedIn}
                  sublabel={`${funnel.eventCheckInRate}% of arrivals`}
                  icon={<Activity className="w-4 h-4" />}
                  accent="#0891b2"
                />
                <StatCard
                  label="Scorecards"
                  value={scorecardStats.totalScorecards}
                  sublabel={`${scorecardStats.submissionRate}% submitted`}
                  icon={<BarChart3 className="w-4 h-4" />}
                  accent="#d97706"
                />
                <StatCard
                  label="Results Published"
                  value={publishedResultsCount}
                  sublabel="Live on /results"
                  icon={<TrendingUp className="w-4 h-4" />}
                  accent="#a855f7"
                />
                <StatCard
                  label="Certificates Issued"
                  value={certPipeline.issued}
                  sublabel={`${certPipeline.issuanceRate}% issue rate`}
                  icon={<Award className="w-4 h-4" />}
                  accent="#f59e0b"
                />
              </div>
            </div>

            {/* ── Attendance Funnel ── */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <TrendingUp className="w-5 h-5 text-[#b91c1c]" />
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    ATTENDANCE FUNNEL
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    End-to-end participant journey from registration to event hall
                  </p>
                </div>
              </div>
              <div className="space-y-3 flex flex-col items-center">
                <FunnelStep
                  step={1}
                  label="Registered"
                  value={funnel.totalRegistered}
                  total={funnel.totalRegistered}
                  color="#b91c1c"
                  icon={<Users className="w-4 h-4" />}
                />
                <div className="w-px h-4 bg-slate-700" />
                <FunnelStep
                  step={2}
                  label="Gate Checked-In"
                  value={funnel.venueCheckedIn}
                  total={funnel.totalRegistered}
                  color="#22c55e"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                />
                <div className="w-px h-4 bg-slate-700" />
                <FunnelStep
                  step={3}
                  label="Event Hall Present"
                  value={funnel.eventCheckedIn}
                  total={funnel.totalRegistered}
                  color="#0891b2"
                  icon={<Activity className="w-4 h-4" />}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                <div className="text-center">
                  <div className="text-xl font-black text-white font-mono">
                    {funnel.venueCheckInRate}%
                  </div>
                  <div className="text-[10px] font-mono text-green-400">Gate Arrival Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-white font-mono">
                    {funnel.eventCheckInRate}%
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400">Hall Entry Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-white font-mono">
                    {funnel.absentCount}
                  </div>
                  <div className="text-[10px] font-mono text-rose-400">Absent / No-Show</div>
                </div>
              </div>
            </div>

            {/* ── Two Column: Category + Scorecard ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <PieChart className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-mono">
                    REGISTRATION BY CATEGORY
                  </h3>
                </div>
                {categoryDist.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs font-mono py-8">
                    No registration data available.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categoryDist.map((item) => (
                      <MiniBar
                        key={item.category}
                        label={item.category}
                        value={item.count}
                        max={registrations.length}
                        color={CATEGORY_COLORS[item.category] || '#64748b'}
                        sublabel={`${item.percentage}% of all registrations`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Scorecard Metrics */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white font-mono">
                    SCORING ANALYTICS
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: 'Submitted',
                      value: scorecardStats.submittedCount,
                      color: '#22c55e',
                    },
                    {
                      label: 'Reopened',
                      value: scorecardStats.reopenedCount,
                      color: '#f59e0b',
                    },
                    {
                      label: 'Draft / Pending',
                      value: scorecardStats.draftCount,
                      color: '#64748b',
                    },
                    {
                      label: 'Submission Rate',
                      value: `${scorecardStats.submissionRate}%`,
                      color: '#b91c1c',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-xl bg-[#0a0c10] border border-slate-800 space-y-1"
                    >
                      <div
                        className="text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: item.color }}
                      >
                        {item.label}
                      </div>
                      <div className="text-xl font-black text-white font-mono">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-black text-white font-mono">
                      {scorecardStats.highestScore}
                    </div>
                    <div className="text-[10px] font-mono text-green-400">Highest</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-white font-mono">
                      {scorecardStats.averageScore}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400">Average</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-white font-mono">
                      {scorecardStats.lowestScore}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">Lowest</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── College Breakdown ── */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Building2 className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    TOP INSTITUTIONS — PARTICIPANT DISTRIBUTION
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Top 10 colleges by participant count
                  </p>
                </div>
              </div>
              {collegeBreakdown.length === 0 ? (
                <div className="text-center text-slate-500 text-xs font-mono py-8">
                  No college data available.
                </div>
              ) : (
                <div className="space-y-3">
                  {collegeBreakdown.map((item, i) => (
                    <div
                      key={item.college}
                      className="flex items-center gap-4"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#1a0000] border border-[#b91c1c]/40 flex items-center justify-center text-[10px] font-mono font-bold text-[#b91c1c] shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <MiniBar
                          label={item.college}
                          value={item.count}
                          max={collegeBreakdown[0].count}
                          color="#a855f7"
                          sublabel={`${item.checkedInCount} gate checked-in`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Certificate Pipeline ── */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  CERTIFICATE PIPELINE STATUS
                </h3>
                <Badge variant="outline">{certPipeline.total} Total</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Issued', value: certPipeline.issued, color: '#22c55e' },
                  { label: 'Pending', value: certPipeline.pending, color: '#d97706' },
                  { label: 'Revoked', value: certPipeline.revoked, color: '#b91c1c' },
                  { label: 'Issue Rate', value: `${certPipeline.issuanceRate}%`, color: '#0891b2' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 text-center space-y-1"
                  >
                    <div
                      className="text-[10px] font-mono uppercase tracking-wider"
                      style={{ color: item.color }}
                    >
                      {item.label}
                    </div>
                    <div className="text-2xl font-black text-white font-mono">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(certPipeline.byType).length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    By Certificate Type:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(certPipeline.byType).map(([type, count]) => (
                      <div
                        key={type}
                        className="px-3 py-1 rounded-xl bg-[#0a0c10] border border-slate-800 text-[10px] font-mono text-slate-300"
                      >
                        {type}: <strong className="text-white">{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Per-Event Attendance Matrix ── */}
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  PER-EVENT ATTENDANCE MATRIX
                </h3>
                <Badge variant="outline">{perEventAttendance.length} Tracks</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0a0c10] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4">Event Track</th>
                      <th className="p-4 text-center">Registered</th>
                      <th className="p-4 text-center">Present</th>
                      <th className="p-4 text-center">Absent</th>
                      <th className="p-4 text-center">Not Marked</th>
                      <th className="p-4 text-center">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-[#06080c]">
                    {perEventAttendance.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-slate-500 font-mono"
                        >
                          No event registrations yet.
                        </td>
                      </tr>
                    ) : (
                      perEventAttendance.map((row) => (
                        <tr
                          key={row.eventId}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-bold text-white">{row.eventName}</div>
                            <div className="text-[10px] text-[#b91c1c]">{row.eventId}</div>
                          </td>
                          <td className="p-4 text-center font-bold text-white">
                            {row.registeredCount}
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded font-bold bg-green-500/20 text-green-400">
                              {row.presentCount}
                            </span>
                          </td>
                          <td className="p-4 text-center text-rose-400">
                            {row.absentCount}
                          </td>
                          <td className="p-4 text-center text-slate-500">
                            {row.notMarkedCount}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cyan-400 rounded-full"
                                  style={{ width: `${row.attendanceRate}%` }}
                                />
                              </div>
                              <span className="font-bold text-cyan-400">
                                {row.attendanceRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
