import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_EVENTS } from '../../data/events';
import type { ParticipantProfile } from '../../types/participant';
import { UserCheck, UserPlus, AlertCircle, CheckCircle2, Edit3, Shield } from 'lucide-react';

export const CoordinatorManagementPage: React.FC = () => {
  const [coordinators, setCoordinators] = useState<ParticipantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment Modal
  const [selectedCoord, setSelectedCoord] = useState<ParticipantProfile | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add Coordinator Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const fetchCoordinators = async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await db.getCollection('participants');
      const list = (allUsers as unknown as ParticipantProfile[]).filter(
        (p) => (p.role || '').toLowerCase() === 'coordinator' || (p.role || '').toUpperCase() === 'EVENT_HEAD'
      );
      setCoordinators(list);
    } catch (err: any) {
      console.error('Error fetching coordinator list:', err);
      setError(err.message || 'Failed to load coordinators from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const handleOpenAssign = (c: ParticipantProfile) => {
    setSelectedCoord(c);
    setSelectedEvents(c.assignedEventIds || []);
    setIsAssignOpen(true);
  };

  const toggleEventSelection = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(selectedEvents.filter((id) => id !== eventId));
    } else {
      setSelectedEvents([...selectedEvents, eventId]);
    }
  };

  const handleSaveAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoord) return;
    setIsSaving(true);
    try {
      await db.updateDoc('participants', selectedCoord.uid, {
        assignedEventIds: selectedEvents,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsAssignOpen(false);
        fetchCoordinators();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to save event assignments');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const participantId = `COORD-${randomDigits}`;
      const uid = `coord-${Date.now()}`;
      const now = new Date().toISOString();

      const newCoord: ParticipantProfile = {
        uid,
        participantId,
        fullName: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim(),
        college: 'SRM Valliammai Engineering College',
        department: 'ECE',
        year: 'IV',
        section: 'A',
        role: 'coordinator',
        assignedEventIds: [],
        qrToken: `QR-${participantId}`,
        venueCheckIn: true,
        venueCheckInStatus: 'CHECKED_IN',
        registeredEvents: [],
        teamIds: [],
        attendanceStatus: {},
        shortlistStatus: {},
        certificateStatus: 'READY',
        createdAt: now,
        updatedAt: now,
      };

      await db.setDoc('participants', uid, newCoord as unknown as Record<string, unknown>);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsAddOpen(false);
        setNewFullName('');
        setNewEmail('');
        setNewPhone('');
        fetchCoordinators();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to add coordinator');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="EVENT HEADS & COORDINATORS"
        title="COORDINATOR MANAGEMENT"
        subtitle="Assign competition tracks, configure event scoring authorization, and monitor coordinator assignments."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white font-mono">TRACK COORDINATORS DIRECTORY</h3>
            <p className="text-xs text-slate-400 font-mono">Total Active Coordinators: {coordinators.length}</p>
          </div>

          <Button
            variant="glow"
            size="sm"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddOpen(true)}
            className="font-mono text-xs"
          >
            Add Coordinator
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Loading Coordinator Registry…" />
        ) : coordinators.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/10">
            <UserCheck className="w-12 h-12 text-[#b91c1c] mx-auto" />
            <h3 className="text-base font-bold text-white font-mono">NO COORDINATORS APPOINTED</h3>
            <p className="text-xs text-slate-400 font-light max-w-md mx-auto">
              Appoint student event heads and assign them to competition tracks for scoring and attendance marking.
            </p>
            <Button variant="glow" size="sm" onClick={() => setIsAddOpen(true)}>
              Appoint First Coordinator
            </Button>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto shadow-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1a0000] text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Coordinator</th>
                  <th className="px-6 py-3.5">Email & Phone</th>
                  <th className="px-6 py-3.5">Assigned Track(s)</th>
                  <th className="px-6 py-3.5">Total Tracks</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {coordinators.map((c) => {
                  const assignedCount = c.assignedEventIds?.length || 0;
                  return (
                    <tr key={c.uid} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">
                        <div>{c.fullName}</div>
                        <span className="text-[10px] font-mono text-[#b91c1c]">{c.participantId}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div>{c.email}</div>
                        <div className="text-[10px] text-slate-500">{c.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {assignedCount > 0 ? (
                            c.assignedEventIds?.map((evId) => (
                              <span key={evId} className="px-2 py-0.5 rounded bg-[#1a0000] text-[#b91c1c] text-[10px] border border-[#b91c1c]/40">
                                {evId}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic text-[10px]">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{assignedCount}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit3 className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenAssign(c)}
                          className="text-xs font-mono"
                        >
                          Assign Tracks
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Assign Tracks Modal */}
        {selectedCoord && (
          <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title={`Assign Tracks — ${selectedCoord.fullName}`}>
            <form onSubmit={handleSaveAssignments} className="space-y-4 font-mono text-xs">
              {saveSuccess && (
                <div className="p-3 bg-green-950 border border-green-500 text-green-400 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Assignments Updated in Firestore
                </div>
              )}

              <p className="text-slate-300 text-xs font-light">
                Select the competition tracks this coordinator is authorized to score and manage attendance for:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {MOCK_EVENTS.map((ev) => {
                  const isChecked = selectedEvents.includes(ev.id);
                  return (
                    <label
                      key={ev.id}
                      onClick={() => toggleEventSelection(ev.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#1a0000] border-[#b91c1c] text-white'
                          : 'bg-[#0a0c10] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-white">{ev.name}</span>
                        <span className="text-[10px] text-slate-500">{ev.category} • ID: {ev.id}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="accent-[#b91c1c] w-4 h-4"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsAssignOpen(false)}>
                  Cancel
                </Button>
                <Button variant="glow" size="sm" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save Assignments'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Add Coordinator Modal */}
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Appoint New Track Coordinator">
          <form onSubmit={handleAddCoordinator} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Siddharth V"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="coord.event@valliammai.edu.in"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Phone</label>
              <input
                type="tel"
                required
                placeholder="+91 97908 11223"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button variant="glow" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Appointing…' : 'Appoint Coordinator'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
