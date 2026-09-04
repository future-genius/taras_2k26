import type { Announcement } from '../types/announcement';

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-01',
    title: 'TARAS 2K26 Portal Live',
    message: 'Official registration portal for Paperionix, Circuitrix, ElectraHack, CineMatrix, and Workshops is now officially open.',
    category: 'GENERAL',
    timestamp: '2026-08-25T10:00:00Z',
    priority: 'HIGH',
    authorRole: 'TARAS Executive Committee',
  },
  {
    id: 'ann-02',
    title: 'VLSI Masterclass Seat Matrix Updated',
    message: 'Due to high demand, 15 additional workstation seats have been added for the VLSI HDL Design hands-on workshop.',
    category: 'EVENT_UPDATE',
    timestamp: '2026-08-27T14:30:00Z',
    eventId: 'taras-06',
    priority: 'NORMAL',
    authorRole: 'Event Head - VLSI',
  },
  {
    id: 'ann-03',
    title: 'Paperionix IEEE Template Released',
    message: 'Authors presenting in Paperionix can now download the official IEEE double-column template from the Proceedings section.',
    category: 'SHORTLIST',
    timestamp: '2026-08-28T09:15:00Z',
    eventId: 'taras-01',
    priority: 'NORMAL',
    authorRole: 'Paperionix Desk',
  },
  {
    id: 'ann-04',
    title: 'Participant QR Entry Desk Instructions',
    message: 'Participants are advised to save their Digital Pass QR image offline prior to campus entry on 26th September.',
    category: 'VENUE',
    timestamp: '2026-08-28T16:00:00Z',
    priority: 'URGENT',
    authorRole: 'Registration Operations Desk',
  },
];
