import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// ─── Page-Level Lazy Imports ────────────────────────────────────────────────
// Public Phase 1 Pages
import { Home } from './pages/Home'; // Eager — initial landing page

const EventsHub             = lazy(() => import('./pages/EventsHub').then(m => ({ default: m.EventsHub })));
const EventDetail           = lazy(() => import('./pages/EventDetail').then(m => ({ default: m.EventDetail })));
const TimelinePage          = lazy(() => import('./pages/TimelinePage').then(m => ({ default: m.TimelinePage })));
const AboutPage             = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const TeamPage              = lazy(() => import('./pages/TeamPage').then(m => ({ default: m.TeamPage })));
const RulesPage             = lazy(() => import('./pages/RulesPage').then(m => ({ default: m.RulesPage })));
const FAQPage               = lazy(() => import('./pages/FAQPage').then(m => ({ default: m.FAQPage })));
const VenuePage             = lazy(() => import('./pages/VenuePage').then(m => ({ default: m.VenuePage })));
const AnnouncementsPage     = lazy(() => import('./pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const ResultsPage           = lazy(() => import('./pages/ResultsPage').then(m => ({ default: m.ResultsPage })));
const GalleryPage           = lazy(() => import('./pages/GalleryPage').then(m => ({ default: m.GalleryPage })));
const ProceedingsPage       = lazy(() => import('./pages/ProceedingsPage').then(m => ({ default: m.ProceedingsPage })));
const ContactPage           = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const NotFoundPage          = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const AccessDeniedPage      = lazy(() => import('./pages/AccessDeniedPage').then(m => ({ default: m.AccessDeniedPage })));

// Phase 2 Participant Ecosystem Pages
const LoginPage             = lazy(() => import('./pages/participant/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage          = lazy(() => import('./pages/participant/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage    = lazy(() => import('./pages/participant/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ParticipantDashboard  = lazy(() => import('./pages/participant/ParticipantDashboard').then(m => ({ default: m.ParticipantDashboard })));
const ProfilePage           = lazy(() => import('./pages/participant/ProfilePage').then(m => ({ default: m.ProfilePage })));
const DigitalPassPage       = lazy(() => import('./pages/participant/DigitalPassPage').then(m => ({ default: m.DigitalPassPage })));
const MyEventsPage          = lazy(() => import('./pages/participant/MyEventsPage').then(m => ({ default: m.MyEventsPage })));
const ParticipantSchedulePage = lazy(() => import('./pages/participant/ParticipantSchedulePage').then(m => ({ default: m.ParticipantSchedulePage })));
const NotificationCenterPage  = lazy(() => import('./pages/participant/NotificationCenterPage').then(m => ({ default: m.NotificationCenterPage })));

// Phase 4 & 5 Admin Operations Ecosystem Pages
const AdminDashboard             = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ParticipantsPage           = lazy(() => import('./pages/admin/ParticipantsPage').then(m => ({ default: m.ParticipantsPage })));
const AddParticipantPage         = lazy(() => import('./pages/admin/AddParticipantPage').then(m => ({ default: m.AddParticipantPage })));
const RegistrationsPage          = lazy(() => import('./pages/admin/RegistrationsPage').then(m => ({ default: m.RegistrationsPage })));
const EventManagementPage        = lazy(() => import('./pages/admin/EventManagementPage').then(m => ({ default: m.EventManagementPage })));
const StaffManagementPage        = lazy(() => import('./pages/admin/StaffManagementPage').then(m => ({ default: m.StaffManagementPage })));
const CoordinatorManagementPage  = lazy(() => import('./pages/admin/CoordinatorManagementPage').then(m => ({ default: m.CoordinatorManagementPage })));
const TeamsPage                  = lazy(() => import('./pages/admin/TeamsPage').then(m => ({ default: m.TeamsPage })));
const AnnouncementManagementPage = lazy(() => import('./pages/admin/AnnouncementManagementPage').then(m => ({ default: m.AnnouncementManagementPage })));
const ScheduleManagementPage     = lazy(() => import('./pages/admin/ScheduleManagementPage').then(m => ({ default: m.ScheduleManagementPage })));
const ReportsPage                = lazy(() => import('./pages/admin/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ResultsManagementPage     = lazy(() => import('./pages/admin/ResultsManagementPage').then(m => ({ default: m.ResultsManagementPage })));
const CertificateVerificationPage = lazy(() => import('./pages/CertificateVerificationPage').then(m => ({ default: m.CertificateVerificationPage })));
const AdminAnalyticsPage         = lazy(() => import('./pages/admin/AdminAnalyticsPage').then(m => ({ default: m.AdminAnalyticsPage })));
const AuditLogPage               = lazy(() => import('./pages/admin/AuditLogPage').then(m => ({ default: m.AuditLogPage })));
const CommunicationsPage         = lazy(() => import('./pages/admin/CommunicationsPage').then(m => ({ default: m.CommunicationsPage })));
const CertificateManagementPage  = lazy(() => import('./pages/admin/CertificateManagementPage').then(m => ({ default: m.CertificateManagementPage })));
const CertificateDemoPage        = lazy(() => import('./pages/admin/CertificateDemoPage').then(m => ({ default: m.CertificateDemoPage })));
const PresidentControlPage       = lazy(() => import('./pages/admin/PresidentControlPage').then(m => ({ default: m.PresidentControlPage })));

// Staff & Coordinator Role Consoles
const StaffDashboard        = lazy(() => import('./pages/staff/StaffDashboard').then(m => ({ default: m.StaffDashboard })));
const RegistrationDashboard = lazy(() => import('./pages/registration/RegistrationDashboard').then(m => ({ default: m.RegistrationDashboard })));
const CoordinatorDashboard  = lazy(() => import('./pages/coordinator/CoordinatorDashboard').then(m => ({ default: m.CoordinatorDashboard })));

// ─── Suspense Loading Fallback ───────────────────────────────────────────────
const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4" aria-label="Loading page">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-2 border-[#3f0000] border-t-[#b91c1c] animate-spin" />
      <div className="absolute inset-2 rounded-full bg-[#0a0c10] border border-[#7f1d1d]/50 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[#b91c1c] animate-pulse" />
      </div>
    </div>
    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Loading…</span>
  </div>
);

// ─── App ─────────────────────────────────────────────────────────────────────
export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public Phase 1 Pages */}
              <Route index element={<Home />} />
              <Route path="events" element={<EventsHub />} />
              <Route path="events/:eventId" element={<EventDetail />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="rules" element={<RulesPage />} />
              <Route path="faq" element={<FAQPage />} />
              <Route path="venue" element={<VenuePage />} />
              <Route path="sponsors" element={<Navigate to="/events" replace />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="verify-certificate" element={<CertificateVerificationPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="proceedings" element={<ProceedingsPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="access-denied" element={<AccessDeniedPage />} />

              {/* Public Auth Pages */}
              <Route path="participant/login" element={<LoginPage />} />
              <Route path="participant/register" element={<RegisterPage />} />
              <Route path="participant/forgot-password" element={<ForgotPasswordPage />} />

              {/* Participant Protected Routes */}
              <Route
                path="participant/dashboard"
                element={
                  <ProtectedRoute>
                    <ParticipantDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="participant/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="participant/pass"
                element={
                  <ProtectedRoute>
                    <DigitalPassPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="participant/my-events"
                element={
                  <ProtectedRoute>
                    <MyEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="participant/schedule"
                element={
                  <ProtectedRoute>
                    <ParticipantSchedulePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="participant/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationCenterPage />
                  </ProtectedRoute>
                }
              />

              {/* Phase 5 Admin Management Ecosystem (Strict Admin Role) */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/participants"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <ParticipantsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/participants/new"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <AddParticipantPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/registrations"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <RegistrationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/events"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <EventManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/staff"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <StaffManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/coordinators"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <CoordinatorManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/teams"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <TeamsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/announcements"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <AnnouncementManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/schedules"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <ScheduleManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/results"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <ResultsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <AdminAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT', 'super_admin']}>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/communications"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <CommunicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/certificates"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT']}>
                    <CertificateManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/certificate-demo"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'PRESIDENT', 'super_admin']}>
                    <CertificateDemoPage />
                  </ProtectedRoute>
                }
              />

              {/* President-only control centre — requireSuperAdmin blocks normal admins */}
              <Route
                path="admin/president"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <PresidentControlPage />
                  </ProtectedRoute>
                }
              />

              {/* Staff & Registration Terminals */}
              <Route
                path="staff/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['staff', 'REGISTRATION_TEAM', 'registration_staff', 'admin', 'PRESIDENT']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="registration"
                element={
                  <ProtectedRoute allowedRoles={['registration_staff', 'staff', 'REGISTRATION_TEAM', 'admin', 'PRESIDENT', 'super_admin']}>
                    <RegistrationDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="registration-demo"
                element={
                  <ProtectedRoute allowedRoles={['registration_staff', 'staff', 'REGISTRATION_TEAM', 'admin', 'PRESIDENT', 'super_admin']}>
                    <RegistrationDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['coordinator', 'EVENT_HEAD', 'admin', 'PRESIDENT']}>
                    <CoordinatorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
};
