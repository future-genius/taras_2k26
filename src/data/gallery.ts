export interface GalleryItem {
  id: string;
  title: string;
  category: 'Events' | 'People' | 'Behind the Scenes' | 'TARAS History';
  year: string;
  caption: string;
  gradientBg: string;
}

export const MOCK_GALLERY: GalleryItem[] = [
  {
    id: 'gal-01',
    title: 'Inaugural Lamp Lighting 2025',
    category: 'Events',
    year: '2025',
    caption: 'Dignitaries and HOD inaugurating the symposium at SRM Valliammai Main Auditorium.',
    gradientBg: 'from-[#1a0000] via-[#0a0c10] to-black',
  },
  {
    id: 'gal-02',
    title: 'Hardware Debugging Sprint',
    category: 'Events',
    year: '2025',
    caption: 'Participants in action during the circuit troubleshooting technical round in the IC Lab.',
    gradientBg: 'from-[#2a0000] via-[#0a0c10] to-[#1a0000]',
  },
  {
    id: 'gal-03',
    title: 'Executive Student Council Lead Team',
    category: 'People',
    year: '2025',
    caption: 'Student Office Bearers and Event Heads organizing the symposium registrations.',
    gradientBg: 'from-[#0a0c10] via-[#1a0000] to-black',
  },
  {
    id: 'gal-04',
    title: 'QR Scan Desk Setup',
    category: 'Behind the Scenes',
    year: '2025',
    caption: 'Registration Desk crew testing venue check-in scanner modules prior to gates opening.',
    gradientBg: 'from-[#3f0000] via-[#0a0c10] to-[#1a0000]',
  },
  {
    id: 'gal-05',
    title: 'Valedictory Overall Champion Trophy',
    category: 'TARAS History',
    year: '2024',
    caption: 'Overall Championship Trophy awarded to the top winning college delegation.',
    gradientBg: 'from-[#1a0000] via-[#0a0c10] to-[#2a0000]',
  },
  {
    id: 'gal-06',
    title: 'IoT Hackathon Pitch Session',
    category: 'Events',
    year: '2025',
    caption: 'Team presenting embedded sensor cloud dashboard to the expert jury panel.',
    gradientBg: 'from-[#0a0c10] via-[#3f0000] to-black',
  },
];
