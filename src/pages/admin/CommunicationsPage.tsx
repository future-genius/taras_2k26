import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_EVENTS } from '../../data/events';
import {
  PREDEFINED_EMAIL_TEMPLATES,
  renderEmailTemplate,
  fetchAudienceRecipients,
  sendBulkEmailJob,
  retryFailedEmailJob,
  type EmailRecipient,
} from '../../services/emailService';
import type { AudienceFilter, EmailTemplate, EmailJob } from '../../types/email';
import {
  Mail,
  Send,
  Users,
  Filter,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Eye,
  Sparkles,
  Layers,
  Search,
  RotateCcw,
} from 'lucide-react';

export const CommunicationsPage: React.FC = () => {
  const { user } = useAuth();

  // Audience Filter State
  const [filterType, setFilterType] = useState<AudienceFilter['type']>('ALL_PARTICIPANTS');
  const [selectedEventId, setSelectedEventId] = useState(MOCK_EVENTS[0]?.id || '');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Resolved Recipients State
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [isCounting, setIsCounting] = useState(false);

  // Template & Message State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('REGISTRATION_CONFIRMATION');
  const [subject, setSubject] = useState(PREDEFINED_EMAIL_TEMPLATES[0].subject);
  const [body, setBody] = useState(PREDEFINED_EMAIL_TEMPLATES[0].body);
  const [activeTab, setActiveTab] = useState<'compose' | 'preview' | 'history'>('compose');

  // Dispatch & Progress State
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ sent: number; total: number } | null>(null);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [sendErrorMsg, setSendErrorMsg] = useState<string | null>(null);

  // Delivery History State
  const [emailLogs, setEmailLogs] = useState<EmailJob[]>([]);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  // 1. Resolve Recipients on filter change
  useEffect(() => {
    let isMounted = true;
    setIsCounting(true);

    const currentFilter: AudienceFilter = {
      type: filterType,
      eventId: filterType === 'EVENT_PARTICIPANTS' ? selectedEventId : undefined,
      year: selectedYear,
      section: selectedSection,
      role: selectedRole,
    };

    fetchAudienceRecipients(currentFilter).then((list) => {
      if (isMounted) {
        setRecipients(list);
        setIsCounting(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [filterType, selectedEventId, selectedYear, selectedSection, selectedRole]);

  // 2. Load Email History
  const fetchEmailLogs = async () => {
    try {
      const docs = await db.getCollection('email_logs');
      const jobs = docs as unknown as EmailJob[];
      jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEmailLogs(jobs);
    } catch (err) {
      console.warn('Error loading email logs:', err);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  // 3. Handle Template Selection
  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found = PREDEFINED_EMAIL_TEMPLATES.find((t) => t.id === tplId);
    if (found) {
      setSubject(found.subject);
      setBody(found.body);
    }
  };

  // 4. Handle Send Email Dispatch
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (recipients.length === 0) {
      setSendErrorMsg('No valid recipients found for the selected audience filter.');
      return;
    }

    setIsSending(true);
    setSendSuccessMsg(null);
    setSendErrorMsg(null);
    setSendProgress({ sent: 0, total: recipients.length });

    const currentFilter: AudienceFilter = {
      type: filterType,
      eventId: filterType === 'EVENT_PARTICIPANTS' ? selectedEventId : undefined,
      year: selectedYear,
      section: selectedSection,
      role: selectedRole,
    };

    try {
      const job = await sendBulkEmailJob(
        currentFilter,
        selectedTemplateId,
        subject,
        body,
        user.uid,
        (sent, total) => {
          setSendProgress({ sent, total });
        }
      );

      setSendSuccessMsg(`Email job completed! Delivered: ${job.sentCount}, Failed: ${job.failedCount}.`);
      fetchEmailLogs();
    } catch (err: any) {
      setSendErrorMsg(err.message || 'Failed to dispatch email campaign.');
    } finally {
      setIsSending(false);
    }
  };

  // 5. Handle Retry Failed Emails
  const handleRetryFailed = async (emailJobId: string) => {
    if (!user) return;
    setIsRetrying(emailJobId);
    try {
      const updated = await retryFailedEmailJob(emailJobId, user.uid);
      setSendSuccessMsg(`Retry complete for campaign ${emailJobId}. Sent: ${updated.sentCount}, Failed: ${updated.failedCount}.`);
      fetchEmailLogs();
    } catch (err: any) {
      setSendErrorMsg(err.message || 'Failed to retry email dispatch.');
    } finally {
      setIsRetrying(null);
    }
  };

  // Live sample variables preview
  const sampleVariables = {
    name: 'Arun Kumar',
    registrationId: 'TARAS26-C404-1027',
    eventName: MOCK_EVENTS.find((e) => e.id === selectedEventId)?.name || 'CIRCUIT 404',
    venue: 'Main Auditorium / ECE Lab 2',
    eventDate: 'March 15, 2026',
    certificateId: 'TARAS26-CERT-8F72K9',
  };

  const previewSubject = renderEmailTemplate(subject, sampleVariables);
  const previewBody = renderEmailTemplate(body, sampleVariables);

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="announcements"
        badgeText="COMMUNICATIONS & EMAIL CENTER"
        title="AUTOMATED BULK EMAIL SYSTEM"
        subtitle="Dispatch personalized symposium emails to dynamic Firestore student audiences with zero manual typing."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('compose')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'compose'
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-[#b91c1c]" /> Compose & Dispatch
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#b91c1c]" /> Live Template Preview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#b91c1c]" /> Delivery History & Logs ({emailLogs.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Compose & Dispatch */}
        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Audience Filter Configurator */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/40 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                    <Filter className="w-4 h-4 text-[#b91c1c]" /> AUDIENCE SELECTOR
                  </div>
                  <Badge variant="red" size="sm">
                    {isCounting ? 'Counting…' : `${recipients.length} RECIPIENTS`}
                  </Badge>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">
                      Target Audience Category
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as AudienceFilter['type'])}
                      className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#b91c1c]"
                    >
                      <option value="ALL_PARTICIPANTS">All Registered Participants</option>
                      <option value="EVENT_PARTICIPANTS">Participants of Specific Event Track</option>
                      <option value="YEAR">Filter by Academic Year</option>
                      <option value="SECTION">Filter by Academic Section</option>
                      <option value="STAFF">Staff & Registration Team</option>
                      <option value="TARAS_MEMBERS">TARAS Coordinators & Members</option>
                      <option value="CUSTOM_COMBINED">Custom Combined Filters</option>
                    </select>
                  </div>

                  {filterType === 'EVENT_PARTICIPANTS' && (
                    <div>
                      <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">
                        Select Event Track
                      </label>
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#b91c1c]"
                      >
                        {MOCK_EVENTS.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name} ({ev.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(filterType === 'YEAR' || filterType === 'CUSTOM_COMBINED') && (
                    <div>
                      <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">
                        Academic Year
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#b91c1c]"
                      >
                        <option value="ALL">All Years</option>
                        <option value="I">I Year</option>
                        <option value="II">II Year</option>
                        <option value="III">III Year</option>
                        <option value="IV">IV Year</option>
                      </select>
                    </div>
                  )}

                  {(filterType === 'SECTION' || filterType === 'CUSTOM_COMBINED') && (
                    <div>
                      <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">
                        Academic Section
                      </label>
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#b91c1c]"
                      >
                        <option value="ALL">All Sections</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                  )}

                  {filterType === 'CUSTOM_COMBINED' && (
                    <div>
                      <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">
                        Role Filter
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#b91c1c]"
                      >
                        <option value="ALL">All Roles</option>
                        <option value="participant">Participants Only</option>
                        <option value="coordinator">Coordinators Only</option>
                        <option value="staff">Staff Only</option>
                      </select>
                    </div>
                  )}

                  {/* Recipient Counter Summary Card */}
                  <div className="p-4 rounded-2xl bg-[#0a0c10] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Resolved Email Address Count:</span>
                      <span className="font-bold text-white text-sm">{recipients.length}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      Recipients are fetched directly from Cloud Firestore with zero manual entry required.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Template Selector & Message Composer */}
            <div className="lg:col-span-7 space-y-6">
              <form onSubmit={handleSendEmail} className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/40 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                    <Mail className="w-4 h-4 text-[#b91c1c]" /> EMAIL TEMPLATE & COMPOSER
                  </div>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">
                      Select Reusable Template
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#b91c1c]"
                    >
                      {PREDEFINED_EMAIL_TEMPLATES.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#b91c1c]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-slate-400 uppercase font-bold text-[10px]">
                        Email Body Content
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Variables: {'{{name}}'}, {'{{eventName}}'}, {'{{registrationId}}'}, {'{{certificateId}}'}
                      </span>
                    </div>
                    <textarea
                      rows={10}
                      required
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#b91c1c] font-mono leading-relaxed"
                    />
                  </div>

                  {/* Progress Indicator */}
                  {isSending && sendProgress && (
                    <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] space-y-2">
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span>Dispatching Batched Email Campaign…</span>
                        <span>{sendProgress.sent} / {sendProgress.total} Recipients</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full bg-[#b91c1c] transition-all duration-300"
                          style={{ width: `${Math.round((sendProgress.sent / sendProgress.total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {sendSuccessMsg && (
                    <div className="p-4 rounded-2xl bg-green-950/40 border border-green-500/50 text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{sendSuccessMsg}</span>
                    </div>
                  )}

                  {sendErrorMsg && (
                    <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-[#b91c1c] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{sendErrorMsg}</span>
                    </div>
                  )}

                  <Button
                    variant="glow"
                    size="lg"
                    type="submit"
                    disabled={isSending || recipients.length === 0}
                    className="w-full justify-center font-mono py-4 text-sm font-bold"
                  >
                    {isSending ? 'Processing Batched Dispatch…' : `Dispatch Email to ${recipients.length} Recipients`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Live Template Preview */}
        {activeTab === 'preview' && (
          <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-[#b91c1c]/40 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#b91c1c]" /> LIVE PERSONALIZED EMAIL PREVIEW
              </div>
              <Badge variant="red">SAMPLE RECIPIENT: ARUN KUMAR</Badge>
            </div>

            <div className="p-6 rounded-2xl bg-[#06080c] border border-slate-800 space-y-4 font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 space-y-1">
                <div className="text-slate-400">From: <strong className="text-white">TARAS 2K26 Admin &lt;no-reply@taras-2k26.web.app&gt;</strong></div>
                <div className="text-slate-400">To: <strong className="text-white">Arun Kumar &lt;student1@gmail.com&gt;</strong></div>
                <div className="text-slate-400">Subject: <strong className="text-[#b91c1c] font-bold">{previewSubject}</strong></div>
              </div>

              <div className="whitespace-pre-wrap text-slate-200 leading-relaxed font-mono p-4 rounded-xl bg-[#0a0c10] border border-white/5">
                {previewBody}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Delivery History & Logs */}
        {activeTab === 'history' && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/40 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                <Clock className="w-4 h-4 text-[#b91c1c]" /> CAMPAIGN DELIVERY LOGS
              </div>
              <Button variant="outline" size="sm" onClick={fetchEmailLogs} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                Refresh History
              </Button>
            </div>

            {emailLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                No bulk email campaigns have been dispatched yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#1a0000] text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="px-5 py-3.5">Job ID & Subject</th>
                      <th className="px-5 py-3.5">Audience Target</th>
                      <th className="px-5 py-3.5">Recipients</th>
                      <th className="px-5 py-3.5">Sent / Failed</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {emailLogs.map((job) => (
                      <tr key={job.emailJobId} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-white">{job.subject}</div>
                          <span className="text-[10px] text-[#b91c1c]">{job.emailJobId}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{job.audienceDescription}</td>
                        <td className="px-5 py-4 text-white font-bold">{job.totalRecipients}</td>
                        <td className="px-5 py-4">
                          <span className="text-green-400 font-bold">{job.sentCount} sent</span>
                          {job.failedCount > 0 && (
                            <span className="text-[#b91c1c] font-bold ml-2">• {job.failedCount} failed</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={job.failedCount === 0 ? 'green' : 'red'} size="sm">
                            {job.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {job.failedCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isRetrying === job.emailJobId}
                              onClick={() => handleRetryFailed(job.emailJobId)}
                              icon={<RotateCcw className="w-3.5 h-3.5 text-[#b91c1c]" />}
                            >
                              {isRetrying === job.emailJobId ? 'Retrying…' : 'Retry Failed'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
