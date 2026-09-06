import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_EVENTS } from '../../data/events';
import {
  Calendar,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Clock,
  Users,
} from 'lucide-react';

interface EventItem {
  id: string;
  name: string;
  category: string;
  venue: string;
  time?: string;
  capacity: number;
  registrationOpen: boolean;
  theme?: string;
  roundsCount?: number;
}

export const EventManagementPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<EventItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const customEvents = await db.getCollection('events');
      if (customEvents.length > 0) {
        setEvents(customEvents as unknown as EventItem[]);
      } else {
        // Seed from MOCK_EVENTS if Firestore events collection is empty
        const initialList: EventItem[] = MOCK_EVENTS.map((e) => ({
          id: e.id,
          name: e.name,
          category: e.category,
          venue: e.venue,
          time: e.rounds[0]?.time || '09:30 AM',
          capacity: 100,
          registrationOpen: true,
          theme: e.theme,
          roundsCount: e.rounds.length,
        }));
        setEvents(initialList);
        // Persist initial seed to Firestore so admin changes persist
        for (const item of initialList) {
          await db.setDoc('events', item.id, item as unknown as Record<string, unknown>);
        }
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to load events from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleToggleRegistration = async (ev: EventItem) => {
    const updatedStatus = !ev.registrationOpen;
    try {
      await db.updateDoc('events', ev.id, { registrationOpen: updatedStatus });
      setEvents(events.map((e) => (e.id === ev.id ? { ...e, registrationOpen: updatedStatus } : e)));
    } catch (err: any) {
      alert(err.message || 'Failed to update registration status');
    }
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormData({
      id: `taras-0${events.length + 1}`,
      name: '',
      category: 'TECHNICAL',
      venue: 'ECE Department Labs',
      time: '09:30 AM - 12:30 PM',
      capacity: 100,
      registrationOpen: true,
      theme: 'Technical Innovation',
      roundsCount: 2,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev: EventItem) => {
    setIsEditMode(true);
    setFormData(ev);
    setIsModalOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm(`Are you sure you want to delete event "${eventId}"?`)) return;
    try {
      await db.deleteDoc('events', eventId);
      setEvents(events.filter((e) => e.id !== eventId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) return;
    setIsSubmitting(true);
    try {
      await db.setDoc('events', formData.id, formData as unknown as Record<string, unknown>);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsModalOpen(false);
        fetchEvents();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="eventsHub"
        badgeText="TRACK MANAGEMENT"
        title="EVENT CONFIGURATION"
        subtitle="Create, configure, open/close registrations, and adjust workstation capacities for all symposium tracks."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white font-mono">ALL SYMPOSIUM TRACKS</h3>
            <p className="text-xs text-slate-400 font-mono">Live Firestore Managed Events: {events.length}</p>
          </div>

          <Button
            variant="glow"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenCreate}
            className="font-mono text-xs"
          >
            Create New Event
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Fetching Event Configurations…" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-[#b91c1c]/50 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="red" size="sm">{ev.category}</Badge>
                    <span className="text-[10px] font-mono text-[#b91c1c] font-bold">{ev.id}</span>
                  </div>

                  <h4 className="text-lg font-bold text-white font-mono">{ev.name}</h4>
                  <p className="text-xs text-slate-400 italic font-mono">"{ev.theme}"</p>

                  <div className="space-y-1 text-xs font-mono text-slate-300 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#b91c1c]" /> {ev.venue}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#b91c1c]" /> {ev.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#b91c1c]" /> Max Capacity: {ev.capacity} Workstations
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Registration Status</span>
                    <button
                      onClick={() => handleToggleRegistration(ev)}
                      className="flex items-center gap-1 text-xs font-mono font-bold"
                    >
                      {ev.registrationOpen ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <ToggleRight className="w-5 h-5 text-green-400" /> OPEN
                        </span>
                      ) : (
                        <span className="text-[#b91c1c] flex items-center gap-1">
                          <ToggleLeft className="w-5 h-5 text-[#b91c1c]" /> CLOSED
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenEdit(ev)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-[#b91c1c]" />}
                      onClick={() => handleDelete(ev.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? `Edit Event — ${formData.name}` : 'Create New Symposium Event'}
        >
          <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
            {saveSuccess && (
              <div className="p-3 bg-green-950 border border-green-500 text-green-400 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Event Record Saved in Firestore
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Event ID</label>
                <input
                  type="text"
                  required
                  disabled={isEditMode}
                  value={formData.id || ''}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                <select
                  value={formData.category || 'TECHNICAL'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
                >
                  <option value="TECHNICAL">TECHNICAL</option>
                  <option value="NON-TECHNICAL">NON-TECHNICAL</option>
                  <option value="WORKSHOP">WORKSHOP</option>
                  <option value="HACKATHON">HACKATHON</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Event Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Paper-X-Verse 2026"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Theme / Tagline</label>
              <input
                type="text"
                placeholder="National Level Technical Paper Presentation"
                value={formData.theme || ''}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Venue Location</label>
                <input
                  type="text"
                  required
                  value={formData.venue || ''}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Workstation Capacity</label>
                <input
                  type="number"
                  required
                  value={formData.capacity || 100}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="glow" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save Event'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
