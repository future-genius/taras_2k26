import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Shield, Mail, Lock, User, Phone, Building, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('ECE');
  const [year, setYear] = useState<'I' | 'II' | 'III' | 'IV' | 'PG'>('III');
  const [section, setSection] = useState('A');
  const [registrationNumber, setRegistrationNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await register(email, password, {
        fullName,
        phone,
        college,
        department,
        year,
        section,
        registrationNumber,
      });
      navigate('/participant/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="SYMPOSIUM IDENTITY CREATION"
        title="PARTICIPANT REGISTRATION"
        subtitle="Create your TARAS 2K26 participant profile to generate your unique ID and scannable QR pass."
        height="compact"
      />

      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="glass-panel-glow p-6 sm:p-8 rounded-2xl border border-[#b91c1c]/40 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1a0000] border border-[#b91c1c]/60 flex items-center justify-center text-[#b91c1c] font-extrabold font-mono text-lg">
              T
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white font-mono">CREATE PARTICIPANT ACCOUNT</h3>
              <p className="text-xs text-slate-400 font-mono">TARAS 2K26 SYMPOSIUM ECOSYSTEM</p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#1a0000]/80 border border-[#b91c1c] text-xs text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Parker"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                  <input
                    type="email"
                    required
                    placeholder="alex@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98401 23456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors"
                />
              </div>
            </div>

            {/* College */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                College / Institution Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. SRM Valliammai Engineering College"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors"
                />
              </div>
            </div>

            {/* Dept, Year, Section, Reg No */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Dept
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
                  Reg No
                </label>
                <input
                  type="text"
                  placeholder="3122..."
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <Button
              variant="glow"
              size="md"
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center mt-4"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? 'Creating Profile & Unique QR…' : 'Complete Registration'}
            </Button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
            Already have a participant account?{' '}
            <Link to="/participant/login" className="font-bold text-[#b91c1c] hover:underline font-mono">
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
