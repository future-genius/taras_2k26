import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_EVENTS } from '../../data/events';
import type { ParticipantProfile } from '../../types/participant';
import type { EventRegistration } from '../../types/registration';
import type { Scorecard, EventResult, CertificateRecord } from '../../types/eventDay';
import {
  FileSpreadsheet,
  Download,
  Users,
  ClipboardList,
  Calendar,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Star,
  Trophy,
  Award,
  Activity,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, rRes, sRes, resData, certRes] = await Promise.all([
        db.getPaginatedCollection('participants', 200),
        db.getPaginatedCollection('registrations', 200),
        db.getPaginatedCollection('scorecards', 200),
        db.getCollection('results'),
        db.getPaginatedCollection('certificate_records', 200),
      ]);
      setParticipants(pRes.docs as unknown as ParticipantProfile[]);
      setRegistrations(rRes.docs as unknown as EventRegistration[]);
      setScorecards(sRes.docs as unknown as Scorecard[]);
      setResults(resData as unknown as EventResult[]);
      setCertificates(certRes.docs as unknown as CertificateRecord[]);
    } catch (err: any) {
      console.error('Error fetching data for reports:', err);
      setError(err.message || 'Failed to fetch datasets for reporting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper: Download CSV File
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${(val || '').replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Participant Report CSV
  const exportParticipantReport = () => {
    const headers = ['Participant ID', 'Full Name', 'Register Number', 'Department', 'Year', 'Section', 'Email', 'Phone', 'Role', 'Check-In Status'];
    const rows = participants.map((p) => [
      p.participantId,
      p.fullName,
      p.registrationNumber || 'N/A',
      p.department || 'ECE',
      p.year || 'III',
      p.section || 'A',
      p.email,
      p.phone || 'N/A',
      p.role || 'participant',
      p.venueCheckIn || p.venueCheckInStatus === 'CHECKED_IN' ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
    ]);
    downloadCSV(`TARAS_2K26_Participants_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // 2. Registration Report CSV
  const exportRegistrationReport = () => {
    const headers = ['Registration ID', 'Participant ID', 'Event ID', 'Event Name', 'Category', 'Type', 'Team ID', 'Status', 'Attendance', 'Registered Date'];
    const rows = registrations.map((r) => [
      r.registrationId,
      r.participantId,
      r.eventId,
      r.eventName,
      r.category,
      r.isTeamEvent ? 'TEAM' : 'SOLO',
      r.teamId || 'N/A',
      r.status,
      r.eventAttendance || 'NOT_MARKED',
      r.registeredAt,
    ]);
    downloadCSV(`TARAS_2K26_Registrations_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // 3. Event Summary Report CSV
  const exportEventReport = () => {
    const headers = ['Event ID', 'Event Name', 'Category', 'Venue', 'Total Registrations', 'Capacity', 'Remaining Slots', 'Status'];
    const eventCounts: Record<string, number> = {};
    registrations.forEach((r) => {
      eventCounts[r.eventId] = (eventCounts[r.eventId] || 0) + 1;
    });

    const rows = MOCK_EVENTS.map((ev) => {
      const regCount = eventCounts[ev.id] || 0;
      const capacity = 100;
      const remaining = Math.max(0, capacity - regCount);
      return [ev.id, ev.name, ev.category, ev.venue, String(regCount), String(capacity), String(remaining), remaining > 0 ? 'OPEN' : 'FULL'];
    });
    downloadCSV(`TARAS_2K26_Event_Summary_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // 5. Scorecard Summary Report CSV
  const exportScorecardReport = () => {
    const headers = ['Scorecard ID', 'Event ID', 'Event Name', 'Target ID', 'Target Name', 'Is Team', 'Judge UID', 'Judge Name', 'Total Score', 'Status', 'Submitted At', 'Criteria JSON'];
    const rows = scorecards.map((sc) => [
      sc.scorecardId,
      sc.eventId,
      sc.eventName,
      sc.targetId,
      sc.targetName,
      sc.isTeam ? 'TEAM' : 'SOLO',
      sc.judgeUid,
      sc.judgeName,
      String(sc.totalScore),
      sc.status,
      sc.submittedAt || 'N/A',
      JSON.stringify(sc.criteria || {}),
    ]);
    downloadCSV(`TARAS_2K26_Scorecards_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // 6. Results & Winners Report CSV
  const exportResultsReport = () => {
    const headers = ['Result ID', 'Event ID', 'Event Name', 'Category', 'Winner Name', 'Winner College', 'Winner Score', 'Runner Up Name', 'Runner Up Score', 'Status', 'Published At', 'Total Rankings'];
    const rows = results.map((res) => [
      res.resultId,
      res.eventId,
      res.eventName,
      res.category,
      res.winner.name,
      res.winner.college,
      String(res.winner.score),
      res.runnerUp.name,
      String(res.runnerUp.score),
      res.status,
      res.publishedAt || 'N/A',
      String(res.rankings?.length || 0),
    ]);
    downloadCSV(`TARAS_2K26_Results_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // 7. Certificate Records Report CSV
  const exportCertificateReport = () => {
    const headers = ['Cert ID', 'Participant ID', 'Full Name', 'College', 'Event ID', 'Event Name', 'Achievement', 'Certificate Type', 'Status', 'Issue Date', 'Verification Code', 'Verification URL'];
    const rows = certificates.map((cert) => [
      cert.certId,
      cert.participantId,
      cert.fullName,
      cert.college,
      cert.eventId || 'N/A',
      cert.eventName || 'N/A',
      cert.achievement,
      cert.certificateType,
      cert.status,
      cert.issueDate,
      cert.verificationCode,
      cert.verificationUrl,
    ]);
    downloadCSV(`TARAS_2K26_Certificates_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // 8. Per-Event Attendance Report CSV
  const exportPerEventAttendance = () => {
    const headers = ['Registration ID', 'Event ID', 'Event Name', 'Participant ID', 'UID', 'Category', 'Is Team', 'Attendance Status', 'Shortlist Status', 'Registered At'];
    const rows = registrations.map((r) => [
      r.registrationId,
      r.eventId,
      r.eventName,
      r.participantId,
      r.uid,
      r.category,
      r.isTeamEvent ? 'TEAM' : 'SOLO',
      r.eventAttendance || 'NOT_MARKED',
      r.shortlistStatus || 'NOT_EVALUATED',
      r.registeredAt,
    ]);
    downloadCSV(`TARAS_2K26_Event_Attendance_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // 4. Venue Check-In Report CSV
  const exportCheckInReport = () => {
    const headers = ['Participant ID', 'Full Name', 'Register Number', 'College', 'Department', 'Check-In Status', 'Check-In Timestamp'];
    const rows = participants.map((p) => [
      p.participantId,
      p.fullName,
      p.registrationNumber || 'N/A',
      p.college,
      p.department || 'ECE',
      p.venueCheckIn || p.venueCheckInStatus === 'CHECKED_IN' ? 'CONFIRMED_PRESENT' : 'NOT_ARRIVED',
      p.venueCheckInTimestamp || p.createdAt || 'N/A',
    ]);
    downloadCSV(`TARAS_2K26_Venue_CheckIn_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="DATA & AUDIT EXPORTS"
        title="SYMPOSIUM REPORTS"
        subtitle="Export clean, CSV/Excel-ready datasets for physical attendance verification, jury scoring, and certificate issuance."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-mono">AVAILABLE AUDIT REPORTS</h3>
            <p className="text-xs text-slate-400 font-mono">Live Sync Datasets: {participants.length} Participants • {registrations.length} Registrations</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs text-white flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="Compiling Symposium Datasets…" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Report Card 1 */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/40">
                    <Users className="w-5 h-5" />
                  </div>
                  <Badge variant="red">DIRECTORY</Badge>
                </div>
                <h4 className="text-base font-bold text-white font-mono">Participant Master Report</h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  Full list of all registered participants with registration numbers, department, year, section, contact information, and role identities.
                </p>
                <div className="text-[10px] font-mono text-slate-400">Total Records: {participants.length}</div>
              </div>

              <Button
                variant="glow"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={exportParticipantReport}
                className="w-full justify-center font-mono text-xs"
              >
                Export Participants (CSV)
              </Button>
            </div>

            {/* Report Card 2 */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/40">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <Badge variant="red">ENTRIES</Badge>
                </div>
                <h4 className="text-base font-bold text-white font-mono">Track Registrations Report</h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  Consolidated competition entries per track, including solo registrations, team associations, confirmation status, and event attendance flags.
                </p>
                <div className="text-[10px] font-mono text-slate-400">Total Entries: {registrations.length}</div>
              </div>

              <Button
                variant="glow"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={exportRegistrationReport}
                className="w-full justify-center font-mono text-xs"
              >
                Export Registrations (CSV)
              </Button>
            </div>

            {/* Report Card 3 */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/40">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <Badge variant="red">ANALYTICS</Badge>
                </div>
                <h4 className="text-base font-bold text-white font-mono">Event Capacity & Distribution</h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  Summary matrix breakdown across technical and non-technical events, showing total registrations, workstation capacities, and remaining slots.
                </p>
                <div className="text-[10px] font-mono text-slate-400">Total Tracks: {MOCK_EVENTS.length}</div>
              </div>

              <Button
                variant="glow"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={exportEventReport}
                className="w-full justify-center font-mono text-xs"
              >
                Export Event Summary (CSV)
              </Button>
            </div>

            {/* Report Card 4 */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/40">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <Badge variant="red">GATE DESK</Badge>
                </div>
                <h4 className="text-base font-bold text-white font-mono">Venue Check-In Audit</h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  Audit log of ground-floor campus attendance verification, confirmed check-ins, scanned QR passes, and timestamps for security validation.
                </p>
                <div className="text-[10px] font-mono text-slate-400">
                  Checked-In: {participants.filter((p) => p.venueCheckIn || p.venueCheckInStatus === 'CHECKED_IN').length} / {participants.length}
                </div>
              </div>

              <Button
                variant="glow"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={exportCheckInReport}
                className="w-full justify-center font-mono text-xs"
              >
                Export Venue Check-In (CSV)
              </Button>
            </div>

            {/* Report Card 5 — Scorecards */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/40">
                    <Star className="w-5 h-5" />
                  </div>
                  <Badge variant="red">SCORING</Badge>
                </div>
                <h4 className="text-base font-bold text-white font-mono">Scorecard Summary Report</h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  All submitted and reopened judge scorecards across every event track, including criteria breakdown, total scores, judge identity, and submission timestamps.
                </p>
                <div className="text-[10px] font-mono text-slate-400">Total Scorecards: {scorecards.length}</div>
              </div>
              <Button
                variant="glow"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={exportScorecardReport}
                className="w-full justify-center font-mono text-xs"
              >
                Export Scorecards (CSV)
              </Button>
            </div>

            {/* Report Card 6 — Results */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/40">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <Badge variant="red">PODIUM</Badge>
                </div>
                <h4 className="text-base font-bold text-white font-mono">Results & Winners Report</h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  Official published results: winner, runner-up, special mention, and full ranking data for every event track where results have been finalized.
                </p>
                <div className="text-[10px] font-mono text-slate-400">Published Results: {results.filter((r) => r.status === 'PUBLISHED').length} / {results.length}</div>
              </div>
              <Button
                variant="glow"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={exportResultsReport}
                className="w-full justify-center font-mono text-xs"
              >
                Export Results (CSV)
              </Button>
            </div>

            {/* Report Card 7 — Certificates */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/40">
                    <Award className="w-5 h-5" />
                  </div>
                  <Badge variant="red">CREDENTIALS</Badge>
                </div>
                <h4 className="text-base font-bold text-white font-mono">Certificate Records Report</h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  Full issuance log of all verifiable certificates: cert ID, participant, achievement type, verification codes, and public verification URLs.
                </p>
                <div className="text-[10px] font-mono text-slate-400">Certificates Issued: {certificates.filter((c) => c.status === 'ISSUED').length} / {certificates.length}</div>
              </div>
              <Button
                variant="glow"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={exportCertificateReport}
                className="w-full justify-center font-mono text-xs"
              >
                Export Certificates (CSV)
              </Button>
            </div>

            {/* Report Card 8 — Per-Event Attendance */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/40">
                    <Activity className="w-5 h-5" />
                  </div>
                  <Badge variant="red">ATTENDANCE</Badge>
                </div>
                <h4 className="text-base font-bold text-white font-mono">Per-Event Attendance Report</h4>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  Detailed per-registration attendance flags for every event track: PRESENT / ABSENT / NOT_MARKED, shortlist status, and team associations.
                </p>
                <div className="text-[10px] font-mono text-slate-400">Total Registration Entries: {registrations.length}</div>
              </div>
              <Button
                variant="glow"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={exportPerEventAttendance}
                className="w-full justify-center font-mono text-xs"
              >
                Export Event Attendance (CSV)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
