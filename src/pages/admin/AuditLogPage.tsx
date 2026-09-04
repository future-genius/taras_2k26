import React, { useState, useMemo } from 'react';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import {
  Shield,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Award,
  QrCode,
  Star,
  Lock,
  Unlock,
  UserCheck,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

// ─── Audit Action Meta ─────────────────────────────────────────────────────────
const ACTION_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  VENUE_CHECK_IN: {
    label: 'Gate Check-In',
    color: '#22c55e',
    icon: <QrCode className="w-3.5 h-3.5" />,
  },
  EVENT_CHECK_IN: {
    label: 'Event Check-In',
    color: '#0891b2',
    icon: <UserCheck className="w-3.5 h-3.5" />,
  },
  ATTENDANCE_UPDATED: {
    label: 'Attendance Updated',
    color: '#d97706',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  SCORE_SUBMITTED: {
    label: 'Score Submitted',
    color: '#a855f7',
    icon: <Star className="w-3.5 h-3.5" />,
  },
  SCORE_REOPENED: {
    label: 'Score Reopened',
    color: '#f59e0b',
    icon: <Unlock className="w-3.5 h-3.5" />,
  },
  SHORTLIST_UPDATED: {
    label: 'Shortlist Updated',
    color: '#14b8a6',
    icon: <Shield className="w-3.5 h-3.5" />,
  },
  RESULT_CREATED: {
    label: 'Result Created',
    color: '#6366f1',
    icon: <FileCheck className="w-3.5 h-3.5" />,
  },
  RESULT_PUBLISHED: {
    label: 'Result Published',
    color: '#b91c1c',
    icon: <Award className="w-3.5 h-3.5" />,
  },
  CERTIFICATE_ISSUED: {
    label: 'Certificate Issued',
    color: '#22c55e',
    icon: <FileCheck className="w-3.5 h-3.5" />,
  },
  CERTIFICATE_REVOKED: {
    label: 'Certificate Revoked',
    color: '#ef4444',
    icon: <Lock className="w-3.5 h-3.5" />,
  },
};

const PAGE_SIZE = 25;

export const AuditLogPage: React.FC = () => {
  const { data: auditLogs, loading } = useFirestoreCollection('audit_logs', {
    orderByField: 'timestamp',
    orderByDirection: 'desc',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return auditLogs.filter((log) => {
      const action = (log.action as string) || '';
      const actorUid = (log.actorUid as string) || '';
      const targetUid = (log.targetUid as string) || '';
      const eventId = (log.eventId as string) || '';

      const matchesSearch =
        q === '' ||
        action.toLowerCase().includes(q) ||
        actorUid.toLowerCase().includes(q) ||
        targetUid.toLowerCase().includes(q) ||
        eventId.toLowerCase().includes(q);

      const matchesAction = actionFilter === 'ALL' || action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchQuery, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredLogs.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Reset page on filter change
  const handleSearch = (v: string) => {
    setSearchQuery(v);
    setCurrentPage(1);
  };
  const handleActionFilter = (v: string) => {
    setActionFilter(v);
    setCurrentPage(1);
  };

  // CSV Export
  const exportAuditCSV = () => {
    const headers = [
      'Log ID',
      'Action',
      'Actor UID',
      'Actor Role',
      'Target UID',
      'Event ID',
      'Timestamp',
      'Metadata',
    ];
    const rows = filteredLogs.map((log) => [
      (log.id as string) || '',
      (log.action as string) || '',
      (log.actorUid as string) || '',
      (log.actorRole as string) || '',
      (log.targetUid as string) || '',
      (log.eventId as string) || '',
      log.timestamp
        ? typeof log.timestamp === 'object' && 'toDate' in (log.timestamp as any)
          ? (log.timestamp as any).toDate().toISOString()
          : String(log.timestamp)
        : '',
      JSON.stringify(log.metadata || {}),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((r) =>
          r.map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `TARAS_2K26_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (ts: unknown): string => {
    if (!ts) return 'N/A';
    try {
      if (typeof ts === 'object' && ts !== null && 'toDate' in (ts as any)) {
        return (ts as any).toDate().toLocaleString('en-IN');
      }
      return new Date(ts as string).toLocaleString('en-IN');
    } catch {
      return String(ts);
    }
  };

  const uniqueActions = Array.from(
    new Set(auditLogs.map((l) => (l.action as string) || ''))
  ).filter(Boolean);

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="PHASE 9 // IMMUTABLE AUDIT TRAIL"
        title="AUDIT LOG VIEWER"
        subtitle="Immutable, chronological record of all gate check-ins, event check-ins, scoring, shortlisting, result publication, and certificate operations."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Controls Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search actor UID, target UID, event ID, action…"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10] border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#b91c1c]"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => handleActionFilter(e.target.value)}
            className="px-3 py-2.5 bg-[#0a0c10] border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {ACTION_META[action]?.label || action}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={exportAuditCSV}
            className="font-mono text-xs whitespace-nowrap"
          >
            Export CSV
          </Button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap">
          <span>
            Total: <strong className="text-white">{auditLogs.length}</strong> log entries
          </span>
          <span>
            Filtered: <strong className="text-white">{filteredLogs.length}</strong>
          </span>
          <span>
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            <span
              className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}
            />
            {loading ? 'Loading…' : 'Live — real-time updates'}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading audit trail…" />
        ) : (
          <>
            {/* Log Table */}
            <div className="overflow-x-auto rounded-3xl border border-slate-800 glass-panel">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0a0c10] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">Action</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Target</th>
                    <th className="p-4">Event</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#06080c]">
                  {paginated.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-10 text-center text-slate-500 font-mono"
                      >
                        No audit log entries matched.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((log, i) => {
                      const action = (log.action as string) || '';
                      const meta = ACTION_META[action] || {
                        label: action,
                        color: '#64748b',
                        icon: <Shield className="w-3.5 h-3.5" />,
                      };
                      const metadata = log.metadata as Record<string, unknown> | undefined;

                      return (
                        <tr
                          key={(log.id as string) || i}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4">
                            <div
                              className="flex items-center gap-2 px-2.5 py-1 rounded-lg w-fit border"
                              style={{
                                backgroundColor: `${meta.color}15`,
                                borderColor: `${meta.color}30`,
                                color: meta.color,
                              }}
                            >
                              {meta.icon}
                              <span className="font-bold text-[10px] uppercase tracking-wider">
                                {meta.label}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-white font-bold truncate max-w-[120px]">
                              {(log.actorUid as string) || '—'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {(log.actorRole as string) || '—'}
                            </div>
                          </td>
                          <td className="p-4 text-slate-300 truncate max-w-[120px]">
                            {(log.targetUid as string) ||
                              (log.targetParticipantId as string) ||
                              '—'}
                          </td>
                          <td className="p-4 text-slate-400 truncate max-w-[100px]">
                            {(log.eventId as string) || '—'}
                          </td>
                          <td className="p-4 text-slate-300 whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="p-4 max-w-[200px]">
                            {metadata && Object.keys(metadata).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(metadata)
                                  .slice(0, 3)
                                  .map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400 font-mono"
                                    >
                                      {k}:{' '}
                                      <span className="text-slate-200">
                                        {String(v).slice(0, 20)}
                                      </span>
                                    </span>
                                  ))}
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-mono text-slate-500">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filteredLogs.length)} of{' '}
                {filteredLogs.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-2 rounded-xl bg-[#0a0c10] border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-300 px-2">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-2 rounded-xl bg-[#0a0c10] border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
