import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ParticipantProfile } from '../../types/participant';
import { ShieldCheck, UserPlus, Mail, AlertCircle, CheckCircle2, UserX } from 'lucide-react';

export const StaffManagementPage: React.FC = () => {
  const [staffList, setStaffList] = useState<ParticipantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Staff Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await db.getCollection('participants');
      const staffMembers = (allUsers as unknown as ParticipantProfile[]).filter(
        (p) => (p.role || '').toLowerCase() === 'staff' || (p.role || '').toUpperCase() === 'REGISTRATION_TEAM'
      );
      setStaffList(staffMembers);
    } catch (err: any) {
      console.error('Error fetching staff list:', err);
      setError(err.message || 'Failed to load staff list from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const participantId = `STAFF-${randomDigits}`;
      const uid = `staff-${Date.now()}`;
      const now = new Date().toISOString();

      const newStaff: ParticipantProfile = {
        uid,
        participantId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        college: 'SRM Valliammai Engineering College',
        department: 'ECE',
        year: 'IV',
        section: 'A',
        role: 'staff',
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

      await db.setDoc('participants', uid, newStaff as unknown as Record<string, unknown>);
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setIsAddOpen(false);
        setFullName('');
        setEmail('');
        setPhone('');
        fetchStaff();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to create staff record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="STAFF & DESK OPERATORS"
        title="STAFF MANAGEMENT"
        subtitle="Manage registration desk scanners and ground-floor verification officers with check-in privileges."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white font-mono">REGISTRATION DESK OPERATORS</h3>
            <p className="text-xs text-slate-400 font-mono">Total Active Staff: {staffList.length}</p>
          </div>

          <Button
            variant="glow"
            size="sm"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddOpen(true)}
            className="font-mono text-xs"
          >
            Provision Staff Member
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Fetching Staff Registry…" />
        ) : staffList.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/10">
            <ShieldCheck className="w-12 h-12 text-[#b91c1c] mx-auto" />
            <h3 className="text-base font-bold text-white font-mono">NO STAFF USERS CONFIGURED</h3>
            <p className="text-xs text-slate-400 font-light max-w-md mx-auto">
              Provision registration desk personnel with QR scanning access for campus check-ins.
            </p>
            <Button variant="glow" size="sm" onClick={() => setIsAddOpen(true)}>
              Provision First Staff
            </Button>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto shadow-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1a0000] text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Staff Officer</th>
                  <th className="px-6 py-3.5">Staff ID</th>
                  <th className="px-6 py-3.5">Email & Phone</th>
                  <th className="px-6 py-3.5">Assigned Desk</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staffList.map((s) => (
                  <tr key={s.uid} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{s.fullName}</td>
                    <td className="px-6 py-4 text-[#b91c1c] font-bold">{s.participantId}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <div>{s.email}</div>
                      <div className="text-[10px] text-slate-500">{s.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">Ground Floor Quadrangle</td>
                    <td className="px-6 py-4">
                      <Badge variant="red" size="sm">ACTIVE SCANNER</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Provision Modal */}
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Provision New Staff Account">
          <form onSubmit={handleAddStaff} className="space-y-4 font-mono text-xs">
            {addSuccess && (
              <div className="p-3 bg-green-950 border border-green-500 text-green-400 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Staff Member Provisioned in Firestore
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="staff.desk@valliammai.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Phone</label>
              <input
                type="tel"
                required
                placeholder="+91 98401 23456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button variant="glow" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Provisioning…' : 'Save Staff Member'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
