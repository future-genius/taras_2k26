export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type AnnouncementCategory = 'GENERAL' | 'EVENT_UPDATE' | 'VENUE' | 'SHORTLIST' | 'SCHEDULE';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  category: AnnouncementCategory;
  timestamp: string;
  eventId?: string;
  priority: AnnouncementPriority;
  authorRole?: string;
}
