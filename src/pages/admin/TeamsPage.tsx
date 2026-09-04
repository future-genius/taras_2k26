import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { EventTeam } from '../../types/team';
import { Flag, Users, Eye, AlertCircle, Shield } from 'lucide-react';

export const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState('ALL');

  const [selectedTeam, setSelectedTeam] = useState<EventTeam | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getCollection('teams');
      setTeams(data as unknown as EventTeam[]);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      setError(err.message || 'Failed to load teams from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter((t) => {
    const matchesEvent = selectedEventFilter === 'ALL' || t.eventId === selectedEventFilter;
    const matchesSearch =
      t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teamCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.eventName && t.eventName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.leaderParticipantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.members?.some((m) => m.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesEvent && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="SQUADS & TEAM ROSTERS"
        title="TEAM DIRECTORY"
        subtitle="Audit formed squads, inspect team codes, member distribution, and competition readiness."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white font-mono">ACTIVE SQUADS & TEAMS</h3>
            <p className="text-xs text-slate-400 font-mono">Showing {filteredTeams.length} of {teams.length} Formed Teams</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search squad name, code, leader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#b91c1c] w-full sm:w-64"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Loading Team Rosters from Firestore…" />
        ) : filteredTeams.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/10">
            <Flag className="w-12 h-12 text-[#b91c1c] mx-auto" />
            <h3 className="text-base font-bold text-white font-mono">NO MATCHING TEAMS FOUND</h3>
            <p className="text-xs text-slate-400 font-light max-w-md mx-auto">
              No squads match your search criteria. Try clearing search query or event filters.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto shadow-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1a0000] text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Team Name</th>
                  <th className="px-6 py-3.5">Team Code</th>
                  <th className="px-6 py-3.5">Event Track</th>
                  <th className="px-6 py-3.5">Leader ID</th>
                  <th className="px-6 py-3.5">Members</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTeams.map((t) => (
                  <tr key={t.teamId} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{t.teamName}</td>
                    <td className="px-6 py-4 text-[#b91c1c] font-bold">{t.teamCode}</td>
                    <td className="px-6 py-4 text-slate-300">{t.eventName}</td>
                    <td className="px-6 py-4 text-slate-400">{t.leaderParticipantId}</td>
                    <td className="px-6 py-4 font-bold text-white">
                      {t.members?.length || 1} / {t.maxTeamSize || 4}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="red" size="sm">{t.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTeam(t);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-[#0a0c10] border border-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Team Details Modal */}
        {selectedTeam && (
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Squad Roster — ${selectedTeam.teamName}`}>
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-[#1a0000] rounded-xl border border-[#b91c1c]/60 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{selectedTeam.teamName}</h4>
                  <span className="text-xs text-[#b91c1c] font-bold">Code: {selectedTeam.teamCode}</span>
                </div>
                <Badge variant="red">{selectedTeam.status}</Badge>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Team Members Roster</span>
                <div className="space-y-2">
                  {selectedTeam.members?.map((m, idx) => (
                    <div key={m.uid || idx} className="p-3 bg-[#0a0c10] rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold flex items-center gap-1.5">
                          {m.fullName} {m.isLeader && <Badge variant="crimson" size="sm">LEADER</Badge>}
                        </div>
                        <span className="text-[10px] text-slate-500">{m.participantId} • {m.college}</span>
                      </div>
                      <span className="text-[10px] text-[#b91c1c] font-mono">{m.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};
