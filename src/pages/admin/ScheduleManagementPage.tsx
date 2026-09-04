import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_TIMELINE } from '../../data/schedule';
import { Clock, PlusCircle, Edit2, Trash2, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';

interface ScheduleEntry {
  id: string;
  time: string;
  title: string;
  category: string;
  description: string;
  venue: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
}

export const ScheduleManagementPage: React.FC = () => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<ScheduleEntry>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getCollection('schedules');
      if (data.length > 0) {
        setScheduleItems(data as unknown as ScheduleEntry[]);
      } else {
        // Seed from MOCK_TIMELINE
        const seeded: ScheduleEntry[] = MOCK_TIMELINE.map((item) => ({
          id: item.id,
          time: item.time,
          title: item.title,
          category: item.category,
          description: item.description,
          venue: item.venue || 'Main Quadrangle',
          status: item.status,
        }));
        setScheduleItems(seeded);
        for (const s of seeded) {
          await db.setDoc('schedules', s.id, s as unknown as Record<string, unknown>);
        }
      }
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setError(err.message || 'Failed to load schedules from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormData({
      id: `sched-${Date.now()}`,
      time: '10:00 AM - 11:30 AM',
      title: '',
      category: 'TECHNICAL',
      description: '',
      venue: 'Mini Hall 1',
      status: 'UPCOMING',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ScheduleEntry) => {
    setIsEditMode(true);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete schedule item "${id}"?`)) return;
    try {
      await db.deleteDoc('schedules', id);
      setScheduleItems(scheduleItems.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete schedule item');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.title) return;
    setIsSubmitting(true);
    try {
      await db.setDoc('schedules', formData.id, formData as unknown as Record<string, unknown>);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsModalOpen(false);
        fetchSchedule();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to save schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="TIMELINE & SLOTS"
        title="SCHEDULE MANAGEMENT"
        subtitle="Manage symposium timeline slots, round start/end windows, venue allocations, and live state progression."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-mono">TIMELINE SLOTS</h3>
            <p className="text-xs text-slate-400 font-mono">Active Schedule Items: {scheduleItems.length}</p>
          </div>

          <Button
            variant="glow"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenCreate}
            className="font-mono text-xs"
          >
            Add Schedule Slot
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Loading Symposium Schedule…" />
        ) : (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto shadow-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1a0000] text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Time Window</th>
                  <th className="px-6 py-3.5">Session / Event</th>
                  <th className="px-6 py-3.5">Venue</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scheduleItems.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#b91c1c]">{s.time}</td>
                    <td className="px-6 py-4 text-white font-bold">
                      <div>{s.title}</div>
                      <span className="text-[10px] text-slate-400 font-light block">{s.description}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#b91c1c]" /> {s.venue}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="red" size="sm">{s.category}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.status === 'LIVE' ? 'red' : 'slate'} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit2 className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenEdit(s)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-[#b91c1c]" />}
                        onClick={() => handleDelete(s.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? 'Edit Schedule Slot' : 'Create Timeline Entry'}
        >
          <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
            {saveSuccess && (
              <div className="p-3 bg-green-950 border border-green-500 text-green-400 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Timeline Entry Saved in Firestore
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time Range</label>
                <input
                  type="text"
                  required
                  placeholder="09:30 AM - 11:00 AM"
                  value={formData.time || ''}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                <select
                  value={formData.status || 'UPCOMING'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
                >
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="LIVE">LIVE (In Progress)</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Session Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Inaugural Address & Keynote"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Venue</label>
              <input
                type="text"
                required
                placeholder="Auditorium / Mini Hall"
                value={formData.venue || ''}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Brief session details…"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="glow" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save Timeline Slot'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
