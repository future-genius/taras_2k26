import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { User, Phone, Building, ShieldCheck, QrCode, Save, CheckCircle2, LogOut } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { participantProfile, updateParticipantProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(participantProfile?.fullName || '');
  const [phone, setPhone] = useState(participantProfile?.phone || '');
  const [college, setCollege] = useState(participantProfile?.college || '');
  const [department, setDepartment] = useState(participantProfile?.department || 'ECE');
  const [year, setYear] = useState<'I' | 'II' | 'III' | 'IV' | 'PG'>(participantProfile?.year || 'III');
  const [section, setSection] = useState(participantProfile?.section || 'A');
  const [registrationNumber, setRegistrationNumber] = useState(participantProfile?.registrationNumber || '');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!participantProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await updateParticipantProfile({
        fullName,
        phone,
        college,
        department,
        year,
        section,
        registrationNumber,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      // Handled in context
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="PARTICIPANT PROFILE"
        title="MY PROFILE & IDENTITY"
        subtitle="Manage your editable contact details and view permanent TARAS 2K26 system identifiers."
        height="compact"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Permanent System Identifier Banner */}
        <div className="glass-panel-glow p-6 rounded-2xl border border-[#b91c1c]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1a0000] border border-[#b91c1c]/60 flex items-center justify-center text-[#b91c1c] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">PERMANENT PARTICIPANT ID</span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-mono">{participantProfile.participantId}</h2>
              <span className="text-xs text-slate-400 font-mono">Status: {participantProfile.venueCheckIn ? 'VENUE CHECKED-IN' : 'NOT CHECKED-IN'}</span>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-lg bg-[#0a0c10] border border-slate-800 text-xs font-mono text-[#b91c1c] flex items-center gap-1.5">
            <QrCode className="w-4 h-4" />
            <span>QR TOKEN VERIFIED</span>
          </div>
        </div>

        {/* Editable Profile Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white font-mono">EDIT PROFILE INFORMATION</h3>
            {savedSuccess && (
              <span className="text-xs font-mono text-[#b91c1c] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Profile Updated
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Readonly Identifier Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                  Participant ID (System Generated • Non-editable)
                </label>
                <input
                  type="text"
                  disabled
                  value={participantProfile.participantId}
                  className="w-full px-4 py-2.5 bg-black/50 border border-slate-800 rounded-xl text-sm font-mono text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                  Email Address (Primary Account • Non-editable)
                </label>
                <input
                  type="text"
                  disabled
                  value={participantProfile.email}
                  className="w-full px-4 py-2.5 bg-black/50 border border-slate-800 rounded-xl text-sm font-mono text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Editable Fields */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white focus:outline-none focus:border-[#b91c1c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  College / Institution
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white focus:outline-none focus:border-[#b91c1c]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-xs text-white uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-[#0a0c10] border border-[#b91c1c]/40 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="I">1st Year (I)</option>
                  <option value="II">2nd Year (II)</option>
                  <option value="III">3rd Year (III)</option>
                  <option value="IV">4th Year (IV)</option>
                  <option value="PG">PG Scholar</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Section
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-xs text-white uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Registration No
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-white/10">
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={logout}
                className="text-xs font-mono text-red-400 border-red-900/60 hover:bg-red-950/40"
                icon={<LogOut className="w-4 h-4 text-red-500" />}
              >
                Sign Out / Logout
              </Button>
              <Button
                variant="glow"
                size="md"
                type="submit"
                disabled={isSaving}
                icon={<Save className="w-4 h-4" />}
              >
                {isSaving ? 'Saving Changes…' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
