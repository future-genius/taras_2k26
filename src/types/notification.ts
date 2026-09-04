export type NotificationCategory =
  | 'GENERAL'
  | 'EVENT'
  | 'URGENT'
  | 'RESULT'
  | 'SCHEDULE'
  | 'VENUE'
  | 'IMPORTANT'
  | 'SHORTLIST';

export interface SystemAnnouncement {
  announcementId: string;
  title: string;
  message: string;
  eventId?: string;
  category: NotificationCategory;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  publishedBy: string;
  createdAt: string;
  expiresAt?: string;
}

export interface UserNotification {
  notificationId: string;
  uid: string;
  participantId: string;
  type: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  actionPath?: string;
}
