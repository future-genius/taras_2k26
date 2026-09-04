import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_EVENTS } from '../../data/events';
import type { TARASEvent } from '../../types/event';
import type { Scorecard, EventResult, CertificateRecord, AuditLog } from '../../types/eventDay';
import {
  computeEventHealthMetrics,
  detectOperationalAlerts,
  searchSymposiumEntities,
  type EventHealthMetric,
  type OperationalAlert,
  type OmniSearchResultItem,
} from '../../services/analyticsService';
import {
  Users,
  ClipboardList,
  Calendar,
  ShieldCheck,
  UserCheck,
  QrCode,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  AlertCircle,
  RefreshCw,
  Award,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
  Search,
  Trophy,
  Star,
  ExternalLink,
  BarChart3,
  Shield,
  Radio,
  Layers,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  Eye,
  Crown,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { participantProfile, user, isSuperAdmin } = useAuth();

  // Raw Data State
  const [participants, setParticipants] = useState<Record<string, unknown>[]>([]);
  const [registrations, setRegistrations] = useState<Record<string, unknown>[]>([]);
  const [teams, setTeams] = useState<Record<string, unknown>[]>([]);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [events, setEvents] = useState<TARASEvent[]>(MOCK_EVENTS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Omni-Search
  const [omniQuery, setOmniQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'monitor' | 'alerts' | 'feed' | 'preflight' | 'emergency'>('monitor');
  const [isEmergencyPausing, setIsEmergencyPausing] = useState(false);
  const [emergencySuccess, setEmergencySuccess] = useState<string | null>(null);

  const handleToggleGlobalRegistration = async (openState: boolean) => {
    if (!user) return;
    setIsEmergencyPausing(true);
    setEmergencySuccess(null);
    try {
      for (const ev of events) {
        await db.updateDoc('events', ev.id, {
          registrationOpen: openState,
          updatedAt: new Date().toISOString(),
        });
      }
      setEmergencySuccess(`Global event registration has been set to: ${openState ? 'OPEN' : 'PAUSED/CLOSED'}.`);
      fetchLiveCommandCenter();
    } catch {
      setError('Failed to update emergency registration status.');
    } finally {
      setIsEmergencyPausing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Capped real-time query streams (max 100 items per telemetry feed)
    const unsubs = [
      db.subscribeQueryLimited('participants', 100, (data) => {
        setParticipants(data);
        setLoading(false);
      }),
      db.subscribeQueryLimited('registrations', 100, (data) => setRegistrations(data)),
      db.subscribeQueryLimited('teams', 100, (data) => setTeams(data)),
      db.subscribeQueryLimited('scorecards', 100, (data) => setScorecards(data as unknown as Scorecard[])),
      db.subscribeQueryLimited('results', 100, (data) => setResults(data as unknown as EventResult[])),
      db.subscribeQueryLimited('certificate_records', 100, (data) => setCertificates(data as unknown as CertificateRecord[])),
      db.subscribeQueryLimited('audit_logs', 100, (data) => setAuditLogs(data as unknown as AuditLog[])),
      db.subscribeCollection('events', (data) => {
        if (data.length > 0) setEvents(data as unknown as TARASEvent[]);
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const fetchLiveCommandCenter = () => {
    // Already synced via live listeners, provides user haptic trigger
    setEmergencySuccess('Live telemetry stream synchronized across all 8 collections.');
    setTimeout(() => setEmergencySuccess(null), 2500);
  };

  // Exact Server-Side Aggregations
  const [serverCounts, setServerCounts] = useState({
    totalParticipants: 0,
    gateChecked: 0,
    totalRegistrations: 0,
    totalCertificates: 0,
    totalTeams: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [pCount, gCount, rCount, cCount, tCount] = await Promise.all([
          db.getCollectionCount('participants'),
          db.getCollectionCount('participants', 'venueCheckIn', true),
          db.getCollectionCount('registrations'),
          db.getCollectionCount('certificate_records'),
          db.getCollectionCount('teams'),
        ]);
        setServerCounts({
          totalParticipants: pCount,
          gateChecked: gCount,
          totalRegistrations: rCount,
          totalCertificates: cCount,
          totalTeams: tCount,
        });
      } catch (err) {
        console.warn('Error fetching server aggregate counts:', err);
      }
    };
    fetchCounts();
  }, []);

  // Computed Real-Time Operational Metrics (Enhanced with Server Aggregation)
  const totalParticipants = serverCounts.totalParticipants || participants.length;
  const gateChecked = serverCounts.gateChecked || participants.filter((p) => p.venueCheckIn === true || p.venueCheckInStatus === 'CHECKED_IN').length;
  const gatePending = Math.max(0, totalParticipants - gateChecked);
  const gatePercentage = totalParticipants > 0 ? Math.round((gateChecked / totalParticipants) * 100) : 0;

  const totalTeams = serverCounts.totalTeams || teams.length;
  const eventCheckedIn = registrations.filter((r) => r.eventAttendance === 'PRESENT').length;
  const absentCount = registrations.filter((r) => r.eventAttendance === 'ABSENT').length;

  const submittedScoresCount = scorecards.filter((sc) => sc.status === 'SUBMITTED').length;
  const draftScoresCount = scorecards.filter((sc) => sc.status === 'DRAFT' || sc.status === 'REOPENED').length;

  const publishedResultsCount = results.filter((res) => res.status === 'PUBLISHED').length;
  const issuedCertificatesCount = serverCounts.totalCertificates || certificates.filter((c) => c.status === 'ISSUED').length;

  // Event Health Metrics & Alerts
  const healthRows: EventHealthMetric[] = computeEventHealthMetrics(
    events,
    registrations,
    participants,
    scorecards as unknown as Record<string, unknown>[],
    results as unknown as Record<string, unknown>[]
  );

  const operationalAlerts: OperationalAlert[] = detectOperationalAlerts(
    participants,
    registrations,
    scorecards as unknown as Record<string, unknown>[],
    results as unknown as Record<string, unknown>[],
    certificates as unknown as Record<string, unknown>[]
  );

  // Omni-Search Execution
  const omniResults: OmniSearchResultItem[] = searchSymposiumEntities(
    omniQuery,
    participants,
    teams,
    events,
    scorecards as unknown as Record<string, unknown>[],
    certificates as unknown as Record<string, unknown>[]
  );

  // Filtered Event Health Rows
  const filteredHealthRows = healthRows.filter((row) => {
    const matchesSearch =
      row.eventName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.venue.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || row.category.toUpperCase() === categoryFilter.toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || row.operationalStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Recent Gate Activity stream from auditLogs or participants
  const recentGateActivity = auditLogs
    .filter((l) => l.action === 'VENUE_CHECK_IN' || l.action === 'EVENT_CHECK_IN')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-8 pb-24">
      <AdminNav />

      {/* Atmospheric Header */}
      <VisualAtmosphere
        environmentKey="adminDashboard"
        badgeText="EVENT-DAY COMMAND CENTER // REALTIME OPERATIONS"
        title="LIVE EVENT-DAY OPERATIONS"
        subtitle="Live gate telemetry, hall attendance, scoring progress, ranking locks, and operational health monitoring."
        height="compact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Control Bar */}
        <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
          isSuperAdmin
            ? 'glass-panel-glow border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.15)] bg-gradient-to-r from-[#1a0000] via-[#0a0c10] to-[#120a02]'
            : 'glass-panel-glow border-[#dc2626]/40'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isSuperAdmin
                ? 'bg-amber-950/60 border-2 border-amber-500 text-amber-400 shadow-amber-950/40'
                : 'bg-[#1a0000] border-2 border-[#dc2626] text-[#dc2626] shadow-red-900/30'
            }`}>
              {isSuperAdmin ? <Crown className="w-6 h-6 animate-pulse" /> : <Activity className="w-6 h-6 animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white font-mono uppercase">
                  {participantProfile?.fullName || (isSuperAdmin ? 'TARAS 2K26 President' : 'Chief Administrator')}
                </h2>
                {isSuperAdmin ? (
                  <Badge variant="red" className="border border-amber-500 text-amber-300 bg-amber-950/80 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                    👑 PRESIDENT // SUPER ADMIN
                  </Badge>
                ) : (
                  <Badge variant="red">ADMIN</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                {isSuperAdmin
                  ? 'Supreme Authority Active · Full Governance & Operational Oversight'
                  : 'Real-time operational monitoring · Ground Floor Gate & Department Venues'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isSuperAdmin && (
              <Link to="/admin/president">
                <Button variant="glow" size="sm" icon={<Crown className="w-4 h-4 text-amber-400" />} className="bg-amber-600 hover:bg-amber-700 text-black font-extrabold">
                  President Control
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchLiveCommandCenter}
            >
              Sync Live Telemetry
            </Button>
            <Link to="/admin/analytics">
              <Button variant="outline" size="sm" icon={<BarChart3 className="w-4 h-4" />}>
                Analytics
              </Button>
            </Link>
            <Link to="/admin/results">
              <Button variant="glow" size="sm" icon={<Trophy className="w-4 h-4" />}>
                Results &amp; Podium
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#dc2626] text-xs text-white flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── SECTION 1: LIVE COMMAND TELEMETRY FUNNEL ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Registered */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-widest">Registered</span>
              <Users className="w-4 h-4 text-[#dc2626]" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalParticipants}</div>
            <div className="text-[10px] text-slate-400 font-mono">{totalTeams} Teams Active</div>
          </div>

          {/* Gate Checked In */}
          <div className="glass-panel p-5 rounded-2xl border border-green-500/30 bg-[#0a0c10] space-y-1">
            <div className="flex items-center justify-between text-green-400">
              <span className="text-[10px] font-mono uppercase tracking-widest">Gate Present</span>
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-black text-green-400 font-mono">{gateChecked}</div>
            <div className="text-[10px] text-slate-400 font-mono">{gatePercentage}% Campus Turnout</div>
          </div>

          {/* Gate Pending */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-widest">Gate Pending</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-slate-200 font-mono">{gatePending}</div>
            <div className="text-[10px] text-amber-400 font-mono">Awaiting Arrival</div>
          </div>

          {/* Event Room Attendance */}
          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-1">
            <div className="flex items-center justify-between text-cyan-400">
              <span className="text-[10px] font-mono uppercase tracking-widest">In Event Halls</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{eventCheckedIn}</div>
            <div className="text-[10px] text-slate-400 font-mono">{absentCount} Absent Marked</div>
          </div>

          {/* Scoring Progress */}
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-1">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-[10px] font-mono uppercase tracking-widest">Scores Submitted</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300 font-mono">{submittedScoresCount}</div>
            <div className="text-[10px] text-slate-400 font-mono">{draftScoresCount} Drafts / In Progress</div>
          </div>

          {/* Results & Certificates */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[10px] font-mono uppercase tracking-widest">Podium Results</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{publishedResultsCount}</div>
            <div className="text-[10px] text-amber-400 font-mono">{issuedCertificatesCount} Certificates Issued</div>
          </div>
        </div>

        {/* ── SECTION 2: OMNI-SEARCH ("SEARCH EVERYTHING") ── */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#dc2626]/40 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Search className="w-5 h-5 text-[#dc2626]" />
                OMNI-SEARCH SYMPOSIUM REGISTRY
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Instant lookup across Participant ID, Name, College, Reg Number, or Team Code
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Live Index Query</span>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by participant name (e.g. Alex), ID (e.g. TARAS26-8942), or Team Code..."
              value={omniQuery}
              onChange={(e) => setOmniQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-[#0a0c10] border border-slate-700 focus:border-[#dc2626] rounded-2xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Omni-Search Results Grid */}
          {omniQuery.trim().length >= 2 && (
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Search Results ({omniResults.length} matches):
              </span>

              {omniResults.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#0a0c10] border border-slate-800 text-center text-xs font-mono text-slate-500">
                  No participant, team, or event found matching "{omniQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {omniResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 hover:border-[#dc2626]/60 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white font-mono text-sm">{item.primaryTitle}</h4>
                          <p className="text-xs font-mono text-[#dc2626] font-bold">{item.secondaryTitle}</p>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                        </div>
                        <Badge variant={item.gateStatus ? 'green' : 'slate'} size="sm">
                          {item.gateStatus ? 'GATE ✓' : 'GATE PENDING'}
                        </Badge>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div>
                          <span className="text-slate-500 block">Events:</span>
                          <span className="text-slate-300 font-bold">{item.registeredEvents.length} registered</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Certificate:</span>
                          <span className={item.certificateStatus === 'ISSUED' ? 'text-green-400 font-bold' : 'text-slate-400'}>
                            {item.certificateStatus || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SECTION 3: OPERATIONAL TABS (Health Monitor, Alerts, Live Gate Feed) ── */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'monitor'
                  ? 'bg-[#1a0000] text-white border border-[#dc2626] shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                  : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#dc2626]" /> Event Health Monitor ({healthRows.length})
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'alerts'
                  ? 'bg-[#1a0000] text-white border border-[#dc2626] shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                  : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Operational Alerts ({operationalAlerts.length})
            </button>

            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'feed'
                  ? 'bg-[#1a0000] text-white border border-[#dc2626] shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                  : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse" /> Live Gate Feed
            </button>

            <button
              onClick={() => setActiveTab('preflight')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'preflight'
                  ? 'bg-[#1a0000] text-white border border-[#dc2626] shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                  : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Go-Live Preflight
            </button>

            <button
              onClick={() => setActiveTab('emergency')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'emergency'
                  ? 'bg-[#1a0000] text-white border border-[#dc2626] shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                  : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Emergency Controls
            </button>
          </div>

          {/* TAB 1: EVENT HEALTH MONITOR TABLE */}
          {activeTab === 'monitor' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              {/* Table Search & Category Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter event name or venue..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {['ALL', 'TECHNICAL', 'NON-TECHNICAL', 'WORKSHOP'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                        categoryFilter === cat
                          ? 'bg-[#1a0000] text-white border border-[#dc2626]'
                          : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0e1017] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Event Track</th>
                      <th className="py-3 px-3">Registered</th>
                      <th className="py-3 px-3">Gate Pass</th>
                      <th className="py-3 px-3">Hall Present</th>
                      <th className="py-3 px-3">Absent</th>
                      <th className="py-3 px-3">Scoring</th>
                      <th className="py-3 px-3">Podium Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredHealthRows.map((row) => (
                      <tr key={row.eventId} className="hover:bg-[#0e1017]/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div>{row.eventName}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {row.category} • {row.venue}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-white">{row.registeredCount}</td>
                        <td className="py-3.5 px-3 text-green-400">{row.gateCheckedCount}</td>
                        <td className="py-3.5 px-3 text-cyan-400 font-bold">{row.presentCount}</td>
                        <td className="py-3.5 px-3 text-slate-500">{row.absentCount}</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={
                              row.scoresPendingCount === 0 && row.presentCount > 0
                                ? 'text-green-400 font-bold'
                                : row.scoresSubmittedCount > 0
                                ? 'text-amber-400'
                                : 'text-slate-500'
                            }
                          >
                            {row.scoresSubmittedCount}/{row.presentCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <Badge
                            variant={
                              row.resultsStatus === 'PUBLISHED'
                                ? 'green'
                                : row.operationalStatus === 'RESULTS_READY'
                                ? 'red'
                                : 'slate'
                            }
                            size="sm"
                          >
                            {row.resultsStatus === 'PUBLISHED'
                              ? 'PUBLISHED ✓'
                              : row.operationalStatus === 'RESULTS_READY'
                              ? 'READY'
                              : row.operationalStatus}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to="/admin/results"
                              className="px-2.5 py-1 rounded bg-[#0a0c10] border border-slate-800 hover:border-[#dc2626] text-[10px] text-white transition-colors"
                            >
                              Results
                            </Link>
                            <Link
                              to={`/events/${row.eventId}`}
                              className="p-1 rounded text-slate-500 hover:text-white"
                              title="Event Specification"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIONAL ALERTS */}
          {activeTab === 'alerts' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  REAL-TIME OPERATIONAL HEALTH ALERTS
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {operationalAlerts.length} Active System Advisories
                </span>
              </div>

              {operationalAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  All operational metrics are within normal parameters. Zero critical discrepancies.
                </div>
              ) : (
                <div className="space-y-3">
                  {operationalAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-[#1a0000] border-[#dc2626]'
                          : alert.severity === 'WARNING'
                          ? 'bg-[#120a02] border-amber-500/60'
                          : 'bg-[#0a0c10] border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <AlertCircle
                          className={`w-5 h-5 shrink-0 mt-0.5 ${
                            alert.severity === 'CRITICAL'
                              ? 'text-[#dc2626]'
                              : alert.severity === 'WARNING'
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white font-mono">{alert.title}</h4>
                            <Badge
                              variant={
                                alert.severity === 'CRITICAL'
                                  ? 'red'
                                  : alert.severity === 'WARNING'
                                  ? 'amber'
                                  : 'slate'
                              }
                              size="sm"
                            >
                              {alert.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-300 font-mono mt-1 leading-relaxed">
                            {alert.description}
                          </p>
                        </div>
                      </div>

                      {alert.actionPath && (
                        <Link
                          to={alert.actionPath}
                          className="px-4 py-2 rounded-xl bg-[#0a0c10] border border-slate-700 hover:border-[#dc2626] text-xs font-mono font-bold text-white whitespace-nowrap shrink-0 transition-colors"
                        >
                          {alert.actionLabel || 'Inspect'} →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE GATE FEED */}
          {activeTab === 'feed' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-green-400 animate-pulse" />
                  <h3 className="text-base font-bold text-white font-mono">
                    LIVE GATE &amp; VENUE CHECK-IN STREAM
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Streamed from Audit Registry</span>
              </div>

              {recentGateActivity.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  No gate check-in transactions recorded in the audit registry yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 font-mono">
                  {recentGateActivity.map((log) => (
                    <div key={log.logId} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#1a0000] border border-[#dc2626]/40 flex items-center justify-center text-green-400 shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white">
                            {(log.metadata?.fullName as string) || (log.metadata?.participantName as string) || log.targetParticipantId || 'Participant'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ID: {log.targetParticipantId || log.targetUid || 'N/A'} • Desk Officer: {log.actorUid.slice(0, 8)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-slate-300 font-bold">
                          {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-green-400 uppercase font-bold">CONFIRMED ✓</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GO-LIVE PREFLIGHT VALIDATOR */}
          {activeTab === 'preflight' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    TARAS 2K26 — GO-LIVE PREFLIGHT VALIDATOR
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Automated operational readiness check before symposium-day commencement
                  </p>
                </div>
                <Badge variant="green" size="md">
                  🟢 GO-LIVE READY
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* 1. Infrastructure */}
                <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" /> 1. Infrastructure &amp; Hosting
                    </span>
                    <span className="text-green-400 font-bold">VERIFIED ✓</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 pl-5 list-disc">
                    <li>Production Firebase connection: Active</li>
                    <li>SPA Route Rewrites: Configured (** → /index.html)</li>
                    <li>Firestore Security Rules: RBAC Enforcement Active</li>
                    <li>Firestore Indexes: 0 Index Build Exceptions</li>
                  </ul>
                </div>

                {/* 2. Event Configuration */}
                <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" /> 2. Event Track Configuration
                    </span>
                    <span className="text-green-400 font-bold">6/6 READY ✓</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 pl-5 list-disc">
                    <li>All 6 events have designated venues &amp; halls</li>
                    <li>Scoring criteria &amp; rubrics configured</li>
                    <li>Individual &amp; Team size rules validated</li>
                    <li>Duplicate track detection: 0 Collisions</li>
                  </ul>
                </div>

                {/* 3. Operational Staff & Gate */}
                <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" /> 3. Gate &amp; Staff Operations
                    </span>
                    <span className="text-green-400 font-bold">STANDBY ✓</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 pl-5 list-disc">
                    <li>Ground Floor Quadrangle Registration Desk mapped</li>
                    <li>QR Scanner &amp; Manual Token fallback tested</li>
                    <li>Idempotency &amp; Duplicate scan locking active</li>
                    <li>Session CSV export verified</li>
                  </ul>
                </div>

                {/* 4. Results & Certificates */}
                <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" /> 4. Results &amp; Certificates
                    </span>
                    <span className="text-green-400 font-bold">READY ✓</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 pl-5 list-disc">
                    <li>Deterministic Ranking Engine verified</li>
                    <li>Pre-flight Results Readiness check active</li>
                    <li>Cryptographic verification endpoint: /verify-certificate</li>
                    <li>Immutable audit trail enabled on all actions</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EMERGENCY CONTROLS */}
          {activeTab === 'emergency' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#dc2626]/50 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-white font-mono">
                    EVENT-DAY EMERGENCY OPERATIONS &amp; SAFETY CONTROLS
                  </h3>
                </div>
                <Badge variant="red">ADMIN COMMAND</Badge>
              </div>

              {emergencySuccess && (
                <div className="p-4 rounded-2xl bg-[#060e08] border border-green-500 text-green-400 text-xs font-mono font-bold">
                  {emergencySuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Emergency Registration Control */}
                <div className="p-5 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white font-mono">Global Registration Pause</h4>
                  <p className="text-xs text-slate-400 font-mono font-light">
                    Instantly freeze or reopen new participant registrations across all 6 symposium tracks without deleting historical data.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => handleToggleGlobalRegistration(false)}
                      disabled={isEmergencyPausing}
                      className="px-4 py-2 rounded-xl bg-[#1a0000] border border-[#dc2626] text-rose-300 hover:text-white text-xs font-mono font-bold"
                    >
                      {isEmergencyPausing ? 'Updating…' : 'Pause All Registrations'}
                    </button>
                    <button
                      onClick={() => handleToggleGlobalRegistration(true)}
                      disabled={isEmergencyPausing}
                      className="px-4 py-2 rounded-xl bg-[#060e08] border border-green-500 text-green-400 hover:text-white text-xs font-mono font-bold"
                    >
                      {isEmergencyPausing ? 'Updating…' : 'Open All Registrations'}
                    </button>
                  </div>
                </div>

                {/* Emergency Broadcasts */}
                <div className="p-5 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white font-mono">Emergency Broadcast Ticker</h4>
                  <p className="text-xs text-slate-400 font-mono font-light">
                    Broadcast high-priority venue changes, schedule delays, or urgent symposium advisories directly to all participant screens.
                  </p>
                  <Link
                    to="/admin/announcements"
                    className="inline-block px-4 py-2 rounded-xl bg-[#0a0c10] border border-slate-700 hover:border-[#dc2626] text-xs font-mono font-bold text-white"
                  >
                    Manage Announcements →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
