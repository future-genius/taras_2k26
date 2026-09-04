import React, { lazy, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { UserRole } from '../../types/participant';

const AccessDeniedPage = lazy(() =>
  import('../../pages/AccessDeniedPage').then((m) => ({ default: m.AccessDeniedPage }))
);

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireSuperAdmin?: boolean; // exclusive President-only gate
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireSuperAdmin = false,
}) => {
  const { user, participantProfile, role, isSuperAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <LoadingSpinner label="Authenticating TARAS Identity…" />
      </div>
    );
  }

  // Not authenticated at all -> send to login
  if (!user && !participantProfile) {
    return <Navigate to="/participant/login" state={{ from: location }} replace />;
  }

  // President-only gate
  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <Suspense fallback={<LoadingSpinner label="Checking Clearance…" />}>
        <AccessDeniedPage />
      </Suspense>
    );
  }

  // Role validation — super_admin inherits ALL roles automatically
  if (allowedRoles && allowedRoles.length > 0 && !isSuperAdmin) {
    const normalizedUserRole = role?.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());
    const isAuthorized = normalizedAllowedRoles.includes(normalizedUserRole);

    if (!isAuthorized) {
      return (
        <Suspense fallback={<LoadingSpinner label="Checking Clearance…" />}>
          <AccessDeniedPage />
        </Suspense>
      );
    }
  }

  return <>{children}</>;
};
