export interface TimelineItem {
  id: string;
  eventId?: string;
  stage: number;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  description: string;
  status: 'COMPLETED' | 'UPCOMING' | 'LIVE';
  category: 'PRE_EVENT' | 'EVENT_DAY' | 'POST_EVENT';
  venue?: string;
  highlights?: string[];
}

export interface FAQCategory {
  id: string;
  name: 'General' | 'Registration' | 'Events' | 'Payment' | 'Venue' | 'Certificates';
  description?: string;
}

export interface FAQItem {
  id: string;
  categoryId: string;
  categoryName: FAQCategory['name'];
  question: string;
  answer: string;
}

export interface EventResult {
  id: string;
  eventId: string;
  eventName: string;
  category: string;
  winner: {
    name: string;
    college: string;
    teamName?: string;
  };
  runnerUp: {
    name: string;
    college: string;
    teamName?: string;
  };
  specialMention?: {
    name: string;
    college: string;
    teamName?: string;
  };
  publishedAt: string;
}
