import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_ANNOUNCEMENTS } from '../../data/announcements';
import {
  Radio,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  category: string;
  authorRole: string;
  timestamp: string;
}

export const AnnouncementManagementPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<AnnouncementItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getCollection('announcements');
      if (data.length > 0) {
        setAnnouncements(data as unknown as AnnouncementItem[]);
      } else {
        // Seed from MOCK_ANNOUNCEMENTS
        const seeded: AnnouncementItem[] = MOCK_ANNOUNCEMENTS.map((a) => ({
          id: a.id,
          title: a.title,
          message: a.message,
          priority: (a.priority || 'NORMAL') as any,
          category: a.category || 'GENERAL',
          authorRole: a.authorRole || 'TARAS Executive Committee',
          timestamp: a.timestamp,
        }));
        setAnnouncements(seeded);
        for (const item of seeded) {
          await db.setDoc('announcements', item.id, item as unknown as Record<string, unknown>);
        }
      }
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      setError(err.message || 'Failed to load announcements from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormData({
      id: `ann-${Date.now()}`,
      title: '',
      message: '',
      priority: 'HIGH',
      category: 'GENERAL',
      authorRole: 'TARAS President & Executive Committee',
      timestamp: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: AnnouncementItem) => {
    setIsEditMode(true);
    setFormData(a);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete announcement "${id}"?`)) return;
    try {
      await db.deleteDoc('announcements', id);
      setAnnouncements(announcements.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.title || !formData.message) return;
    setIsSubmitting(true);
    try {
      await db.setDoc('announcements', formData.id, {
        ...formData,
        timestamp: new Date().toISOString(),
      } as Record<string, unknown>);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsModalOpen(false);
        fetchAnnouncements();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="DISPATCH CONSOLE"
        title="LIVE ANNOUNCEMENTS"
        subtitle="Broadcast Spider-Sense notifications, round updates, schedule shifts, and emergency alerts to participants."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-mono">BROADCAST BULLETINS</h3>
            <p className="text-xs text-slate-400 font-mono">Live Dispatches: {announcements.length}</p>
          </div>

          <Button
            variant="glow"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenCreate}
            className="font-mono text-xs"
          >
            Create Broadcast
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Fetching Live Announcements…" />
        ) : announcements.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/10">
            <Radio className="w-12 h-12 text-[#b91c1c] mx-auto" />
            <h3 className="text-base font-bold text-white font-mono">NO ANNOUNCEMENTS DISPATCHED</h3>
            <p className="text-xs text-slate-400 font-light max-w-md mx-auto">
              Broadcast critical venue shifts, masterclass updates, and round timings to all registered participants.
            </p>
            <Button variant="glow" size="sm" onClick={handleOpenCreate}>
              Create First Broadcast
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-[#b91c1c]/50 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={a.priority === 'HIGH' ? 'red' : 'slate'} size="sm">
                      {a.priority} PRIORITY
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white font-mono">{a.title}</h4>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">{a.message}</p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#b91c1c]">{a.authorRole}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenEdit(a)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-[#b91c1c]" />}
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? 'Edit Broadcast Bulletin' : 'Dispatch New Announcement'}
        >
          <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
            {saveSuccess && (
              <div className="p-3 bg-green-950 border border-green-500 text-green-400 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Announcement Dispatched to Firestore
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority Level</label>
              <select
                value={formData.priority || 'HIGH'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none"
              >
                <option value="HIGH">HIGH (Urgent Alert)</option>
                <option value="NORMAL">NORMAL (General Bulletin)</option>
                <option value="LOW">LOW (Informational)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Headline Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Paper-X-Verse Round 2 Commencing at Mini Hall 1"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Broadcast Content</label>
              <textarea
                required
                rows={4}
                placeholder="Details of the announcement…"
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="glow" size="sm" type="submit" disabled={isSubmitting} icon={<Send className="w-3.5 h-3.5" />}>
                {isSubmitting ? 'Dispatching…' : 'Dispatch Broadcast'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
