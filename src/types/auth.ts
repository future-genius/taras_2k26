export type UserRole = 'admin' | 'staff' | 'registration_staff' | 'coordinator' | 'participant' | 'PRESIDENT' | 'REGISTRATION_TEAM' | 'EVENT_HEAD' | 'PARTICIPANT';

export interface AuthUser {
  uid: string;
  email: string;
}

export interface RolePermissions {
  canManageUsers: boolean;
  canManageEvents: boolean;
  canMarkVenueAttendance: boolean;
  canMarkEventAttendance: boolean;
  canPublishAnnouncements: boolean;
  canManageSchedules: boolean;
  canManageCertificates: boolean;
  canViewAllRegistrations: boolean;
}

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  admin: {
    canManageUsers: true,
    canManageEvents: true,
    canMarkVenueAttendance: true,
    canMarkEventAttendance: true,
    canPublishAnnouncements: true,
    canManageSchedules: true,
    canManageCertificates: true,
    canViewAllRegistrations: true,
  },
  PRESIDENT: {
    canManageUsers: true,
    canManageEvents: true,
    canMarkVenueAttendance: true,
    canMarkEventAttendance: true,
    canPublishAnnouncements: true,
    canManageSchedules: true,
    canManageCertificates: true,
    canViewAllRegistrations: true,
  },
  staff: {
    canManageUsers: false,
    canManageEvents: false,
    canMarkVenueAttendance: true,
    canMarkEventAttendance: false,
    canPublishAnnouncements: true,
    canManageSchedules: false,
    canManageCertificates: false,
    canViewAllRegistrations: true,
  },
  registration_staff: {
    canManageUsers: false,
    canManageEvents: false,
    canMarkVenueAttendance: true,
    canMarkEventAttendance: false,
    canPublishAnnouncements: false,
    canManageSchedules: false,
    canManageCertificates: false,
    canViewAllRegistrations: true,
  },
  REGISTRATION_TEAM: {
    canManageUsers: false,
    canManageEvents: false,
    canMarkVenueAttendance: true,
    canMarkEventAttendance: false,
    canPublishAnnouncements: true,
    canManageSchedules: false,
    canManageCertificates: false,
    canViewAllRegistrations: true,
  },
  coordinator: {
    canManageUsers: false,
    canManageEvents: false,
    canMarkVenueAttendance: false,
    canMarkEventAttendance: true,
    canPublishAnnouncements: false,
    canManageSchedules: false,
    canManageCertificates: false,
    canViewAllRegistrations: false,
  },
  EVENT_HEAD: {
    canManageUsers: false,
    canManageEvents: false,
    canMarkVenueAttendance: false,
    canMarkEventAttendance: true,
    canPublishAnnouncements: false,
    canManageSchedules: false,
    canManageCertificates: false,
    canViewAllRegistrations: false,
  },
  participant: {
    canManageUsers: false,
    canManageEvents: false,
    canMarkVenueAttendance: false,
    canMarkEventAttendance: false,
    canPublishAnnouncements: false,
    canManageSchedules: false,
    canManageCertificates: false,
    canViewAllRegistrations: false,
  },
  PARTICIPANT: {
    canManageUsers: false,
    canManageEvents: false,
    canMarkVenueAttendance: false,
    canMarkEventAttendance: false,
    canPublishAnnouncements: false,
    canManageSchedules: false,
    canManageCertificates: false,
    canViewAllRegistrations: false,
  },
};
