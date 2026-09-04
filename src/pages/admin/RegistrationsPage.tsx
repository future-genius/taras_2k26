import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_EVENTS } from '../../data/events';
import type { EventRegistration } from '../../types/registration';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
} from 'lucide-react';

export const RegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [filteredRegs, setFilteredRegs] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getCollection('registrations');
      const list = data as unknown as EventRegistration[];
      setRegistrations(list);
      setFilteredRegs(list);
    } catch (err: any) {
      console.error('Error fetching registrations:', err);
      setError(err.message || 'Failed to load registrations from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    let result = [...registrations];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.eventName?.toLowerCase().includes(q) ||
          r.participantId?.toLowerCase().includes(q) ||
          r.registrationId?.toLowerCase().includes(q) ||
          r.teamId?.toLowerCase().includes(q)
      );
    }

    if (eventFilter !== 'ALL') {
      result = result.filter((r) => r.eventId === eventFilter);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (typeFilter !== 'ALL') {
      const isTeam = typeFilter === 'TEAM';
      result = result.filter((r) => r.isTeamEvent === isTeam);
    }

    setFilteredRegs(result);
  }, [searchQuery, eventFilter, statusFilter, typeFilter, registrations]);

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="TRACK REGISTRATIONS"
        title="REGISTRATION AUDITING"
        subtitle="Live registry of all competition entries, verified team rosters, attendance eligibility, and shortlist flags."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Filter Controls */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
              <input
                type="text"
                placeholder="Search by Event Name, Participant ID, or Registration ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10] border border-[#b91c1c]/40 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c]"
              />
            </div>
            <div className="text-xs font-mono text-slate-400 shrink-0">
              Total Found: <strong className="text-white">{filteredRegs.length}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Event Track</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0c10] border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none"
              >
                <option value="ALL">All Tracks</option>
                {MOCK_EVENTS.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Entry Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0c10] border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="SOLO">Solo Entries</option>
                <option value="TEAM">Team Entries</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Registration Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0c10] border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="WAITLISTED">WAITLISTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Fetching Live Registrations Registry…" />
        ) : filteredRegs.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3 border border-white/10">
            <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white font-mono">NO REGISTRATIONS FOUND</h3>
            <p className="text-xs text-slate-400 font-light">Try adjusting your filter criteria.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto shadow-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1a0000] text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Registration ID</th>
                  <th className="px-5 py-3.5">Participant ID</th>
                  <th className="px-5 py-3.5">Event Track</th>
                  <th className="px-5 py-3.5">Entry Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Attendance</th>
                  <th className="px-5 py-3.5">Registered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRegs.map((r) => (
                  <tr key={r.registrationId} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">
                      <div>{r.registrationId}</div>
                    </td>
                    <td className="px-5 py-4 text-[#b91c1c] font-bold">{r.participantId}</td>
                    <td className="px-5 py-4 text-slate-200">
                      <div className="font-bold">{r.eventName}</div>
                      <span className="text-[10px] text-slate-500">{r.eventId}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {r.isTeamEvent ? (
                        <span className="px-2 py-0.5 rounded bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/40 text-[10px]">
                          TEAM ({r.teamId || 'Forming'})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">SOLO</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="red" size="sm">{r.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      <Badge variant={r.eventAttendance === 'PRESENT' ? 'red' : 'slate'} size="sm">
                        {r.eventAttendance || 'NOT_MARKED'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(r.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
