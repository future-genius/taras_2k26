import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { ArrowLeft, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ParticipantProfile } from '../../types/participant';

export const AddParticipantPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('SRM Valliammai Engineering College');
  const [department, setDepartment] = useState('ECE');
  const [year, setYear] = useState<'I' | 'II' | 'III' | 'IV' | 'PG'>('III');
  const [section, setSection] = useState('A');
  const [registrationNumber, setRegistrationNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Check duplicate email
      const existingUsers = await db.queryWhere('participants', 'email', email.trim().toLowerCase());
      if (existingUsers.length > 0) {
        throw new Error(`A participant with email "${email}" already exists.`);
      }

      // Check duplicate registration number if provided
      if (registrationNumber.trim()) {
        const existingRegNo = await db.queryWhere('participants', 'registrationNumber', registrationNumber.trim());
        if (existingRegNo.length > 0) {
          throw new Error(`A participant with registration number "${registrationNumber}" already exists.`);
        }
      }

      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const participantId = `TARAS26-${randomDigits}`;
      const qrToken = `QR-${participantId}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const uid = `admin-created-${Date.now()}`;
      const now = new Date().toISOString();

      const newProfile: ParticipantProfile = {
        uid,
        participantId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        college: college.trim(),
        department: department.trim(),
        year,
        section: section.trim().toUpperCase(),
        registrationNumber: registrationNumber.trim(),
        role: 'participant', // Strict participant default
        assignedEventIds: [],
        qrToken,
        venueCheckIn: false,
        venueCheckInStatus: 'NOT_CHECKED_IN',
        registeredEvents: [],
        teamIds: [],
        attendanceStatus: {},
        shortlistStatus: {},
        certificateStatus: 'PENDING',
        createdAt: now,
        updatedAt: now,
      };

      await db.setDoc('participants', uid, newProfile as unknown as Record<string, unknown>);

      setCreatedId(participantId);
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/participants');
      }, 2000);
    } catch (err: any) {
      console.error('Error adding participant:', err);
      setError(err.message || 'Failed to add participant record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="ADMIN PROVISIONING"
        title="ADD PARTICIPANT"
        subtitle="Manually register and issue verified symposium identities with generated QR tokens directly in Firestore."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link to="/admin/participants" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Participant Directory
        </Link>

        <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/40 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1a0000] border border-[#b91c1c]/60 flex items-center justify-center text-[#b91c1c]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">NEW PARTICIPANT PROVISIONING</h3>
              <p className="text-xs text-slate-400 font-mono">Role strictly defaulted to PARTICIPANT</p>
            </div>
          </div>

          {success && (
            <div className="p-4 rounded-xl bg-green-950/80 border border-green-500 text-green-400 text-xs font-mono flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <strong>Participant Created Successfully:</strong> {createdId}
                <div className="text-[10px] text-green-300">Redirecting to directory…</div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="participant@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98401 23456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">College / Institution *</label>
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registration Number</label>
                <input
                  type="text"
                  placeholder="312221106001"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white uppercase focus:outline-none focus:border-[#b91c1c]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#b91c1c]"
                >
                  <option value="I">1st Year (I)</option>
                  <option value="II">2nd Year (II)</option>
                  <option value="III">3rd Year (III)</option>
                  <option value="IV">4th Year (IV)</option>
                  <option value="PG">PG</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Section</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-white uppercase focus:outline-none focus:border-[#b91c1c]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="glow" size="md" type="submit" disabled={isSubmitting} icon={<UserPlus className="w-4 h-4" />}>
                {isSubmitting ? 'Creating Identity…' : 'Create & Issue Pass'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
