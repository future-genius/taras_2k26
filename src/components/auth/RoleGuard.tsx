import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/participant';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = null,
}) => {
  const { role } = useAuth();
  const normalizedUserRole = role?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

  if (normalizedAllowedRoles.includes(normalizedUserRole)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
