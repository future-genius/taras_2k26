import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../config/firebase';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ParticipantProfile } from '../../types/participant';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Shield,
  Save,
  PlusCircle,
  Phone,
  Mail,
  Building,
} from 'lucide-react';

export const ParticipantsPage: React.FC = () => {
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<ParticipantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [checkInFilter, setCheckInFilter] = useState('ALL');

  // Selected Participant for View/Edit
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantProfile | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ParticipantProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Pagination State
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const fetchParticipants = async (snapToUse: any = null) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (yearFilter !== 'ALL') {
        res = await db.queryWherePaginated('participants', 'year', yearFilter, 50, snapToUse);
      } else if (roleFilter !== 'ALL') {
        res = await db.queryWherePaginated('participants', 'role', roleFilter, 50, snapToUse);
      } else {
        res = await db.getPaginatedCollection('participants', 50, snapToUse);
      }

      const list = res.docs as unknown as ParticipantProfile[];
      setParticipants(list);
      setFilteredParticipants(list);
      setHasMore(res.hasMore);

      if (res.lastSnapshot) {
        if (!snapshots[currentPageIndex]) {
          setSnapshots((prev) => {
            const copy = [...prev];
            copy[currentPageIndex] = res.lastSnapshot;
            return copy;
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching participants:', err);
      setError(err.message || 'Failed to load participants from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPageIndex(0);
    setSnapshots([]);
    fetchParticipants(null);
  }, [yearFilter, roleFilter, sectionFilter]);

  const handleNextPage = () => {
    const currentSnap = snapshots[currentPageIndex];
    if (currentSnap && hasMore) {
      const nextIdx = currentPageIndex + 1;
      setCurrentPageIndex(nextIdx);
      fetchParticipants(currentSnap);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      const prevIdx = currentPageIndex - 1;
      setCurrentPageIndex(prevIdx);
      const prevSnap = prevIdx > 0 ? snapshots[prevIdx - 1] : null;
      fetchParticipants(prevSnap);
    }
  };

  // Filter & Search Logic
  useEffect(() => {
    let result = [...participants];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.fullName?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.registrationNumber?.toLowerCase().includes(q) ||
          p.participantId?.toLowerCase().includes(q)
      );
    }

    if (yearFilter !== 'ALL') {
      result = result.filter((p) => p.year === yearFilter);
    }

    if (sectionFilter !== 'ALL') {
      result = result.filter((p) => (p.section || 'A').toUpperCase() === sectionFilter);
    }

    if (roleFilter !== 'ALL') {
      result = result.filter((p) => (p.role || 'participant').toLowerCase() === roleFilter.toLowerCase());
    }

    if (checkInFilter !== 'ALL') {
      const isCheckedIn = checkInFilter === 'CHECKED_IN';
      result = result.filter((p) => (p.venueCheckIn || p.venueCheckInStatus === 'CHECKED_IN') === isCheckedIn);
    }

    setFilteredParticipants(result);
  }, [searchQuery, yearFilter, sectionFilter, roleFilter, checkInFilter, participants]);

  const handleEditOpen = (p: ParticipantProfile) => {
    setSelectedParticipant(p);
    setEditForm({
      fullName: p.fullName,
      phone: p.phone,
      college: p.college,
      department: p.department || 'ECE',
      year: p.year || 'III',
      section: p.section || 'A',
      registrationNumber: p.registrationNumber || '',
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    setIsSaving(true);
    try {
      await db.updateDoc('participants', selectedParticipant.uid, editForm as Record<string, unknown>);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditOpen(false);
        fetchParticipants();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to update participant');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="ADMIN DIRECTORY"
        title="PARTICIPANT DIRECTORY"
        subtitle="Search, filter, inspect, and manage all verified TARAS 2K26 participants and security identities."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Actions Bar & Filters */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
              <input
                type="text"
                placeholder="Search by Name, Reg No, Participant ID, or Email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10] border border-[#b91c1c]/40 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <Link to="/admin/participants/new" className="shrink-0 w-full md:w-auto">
              <Button variant="glow" size="sm" icon={<PlusCircle className="w-4 h-4" />} className="w-full justify-center font-mono">
                Add Participant
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0c10] border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none"
              >
                <option value="ALL">All Years</option>
                <option value="I">1st Year (I)</option>
                <option value="II">2nd Year (II)</option>
                <option value="III">3rd Year (III)</option>
                <option value="IV">4th Year (IV)</option>
                <option value="PG">PG</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Section</label>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0c10] border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none"
              >
                <option value="ALL">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0c10] border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="participant">Participant</option>
                <option value="coordinator">Coordinator</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Check-In</label>
              <select
                value={checkInFilter}
                onChange={(e) => setCheckInFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0c10] border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="CHECKED_IN">Checked-In</option>
                <option value="NOT_CHECKED_IN">Not Checked-In</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Directory Table */}
        {loading ? (
          <LoadingSpinner label="Loading Participant Directory…" />
        ) : filteredParticipants.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3 border border-white/10">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white font-mono">NO PARTICIPANTS MATCH CRITERIA</h3>
            <p className="text-xs text-slate-400 font-light">Adjust search query or filter parameters.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto shadow-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1a0000] text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Participant</th>
                  <th className="px-5 py-3.5">Reg Number</th>
                  <th className="px-5 py-3.5">Dept / Year / Sec</th>
                  <th className="px-5 py-3.5">Email & Phone</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Venue Presence</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredParticipants.map((p) => {
                  const isChecked = p.venueCheckIn || p.venueCheckInStatus === 'CHECKED_IN';
                  return (
                    <tr key={p.uid || p.participantId} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-white">
                        <div>{p.fullName}</div>
                        <span className="text-[10px] font-mono text-[#b91c1c]">{p.participantId}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-300 font-bold">{p.registrationNumber || 'N/A'}</td>
                      <td className="px-5 py-4 text-slate-400">
                        {p.department || 'ECE'} • {p.year || 'III'} Year • Sec {p.section || 'A'}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        <div>{p.email}</div>
                        <div className="text-[10px] text-slate-500">{p.phone}</div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="red" size="sm">{p.role || 'participant'}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={isChecked ? 'red' : 'slate'} size="sm">
                          {isChecked ? 'CHECKED-IN' : 'PENDING'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedParticipant(p);
                            setIsViewOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-[#0a0c10] border border-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="View Participant Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditOpen(p)}
                          className="p-1.5 rounded-lg bg-[#1a0000] border border-[#b91c1c]/40 text-[#b91c1c] hover:text-white transition-colors"
                          title="Edit Participant"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0a0c10] border-t border-white/10 font-mono text-xs">
              <span className="text-slate-400">
                Page <strong className="text-white">{currentPageIndex + 1}</strong> (50 items per page)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPageIndex === 0 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore || loading}
                >
                  Next Page
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {selectedParticipant && (
          <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Participant Details">
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#1a0000] border border-[#b91c1c]/60 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{selectedParticipant.fullName}</h4>
                  <span className="text-xs text-[#b91c1c] font-bold">{selectedParticipant.participantId}</span>
                </div>
                <Badge variant="red">{selectedParticipant.role}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div className="p-3 bg-[#0a0c10] rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">College</span>
                  <span className="text-white font-bold">{selectedParticipant.college}</span>
                </div>
                <div className="p-3 bg-[#0a0c10] rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Reg Number</span>
                  <span className="text-white font-bold">{selectedParticipant.registrationNumber || 'N/A'}</span>
                </div>
                <div className="p-3 bg-[#0a0c10] rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Email</span>
                  <span className="text-white truncate block">{selectedParticipant.email}</span>
                </div>
                <div className="p-3 bg-[#0a0c10] rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Phone</span>
                  <span className="text-white">{selectedParticipant.phone}</span>
                </div>
              </div>

              <div className="p-3 bg-[#0a0c10] rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Registered Track IDs</span>
                <div className="flex flex-wrap gap-1">
                  {selectedParticipant.registeredEvents?.length > 0 ? (
                    selectedParticipant.registeredEvents.map((e) => (
                      <span key={e} className="px-2 py-0.5 rounded bg-[#1a0000] text-[#b91c1c] text-[10px]">
                        {e}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-[10px]">None registered</span>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Modal */}
        {selectedParticipant && (
          <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Participant Record">
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
              {saveSuccess && (
                <div className="p-3 bg-green-950 border border-green-500 text-green-400 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Updated in Firestore
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName || ''}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reg No</label>
                  <input
                    type="text"
                    value={editForm.registrationNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dept</label>
                  <input
                    type="text"
                    value={editForm.department || 'ECE'}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Year</label>
                  <select
                    value={editForm.year || 'III'}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
                  >
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="PG">PG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Section</label>
                  <input
                    type="text"
                    value={editForm.section || 'A'}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button variant="glow" size="sm" type="submit" disabled={isSaving} icon={<Save className="w-3.5 h-3.5" />}>
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};
