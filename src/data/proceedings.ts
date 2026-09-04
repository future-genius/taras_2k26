export interface ProceedingItem {
  id: string;
  year: string;
  title: string;
  theme: string;
  papersCount: number;
  isbn: string;
  downloadUrlPlaceholder: string;
  description: string;
  editors: string[];
}

export const MOCK_PROCEEDINGS: ProceedingItem[] = [
  {
    id: 'proc-2025',
    year: '2025',
    title: 'Proceedings of TARAS 2025: Intelligent Embedded Systems & Signal Analytics',
    theme: 'AI-assisted Signal Processing & Next-Gen IoT Networks',
    papersCount: 42,
    isbn: '978-93-89123-45-1',
    downloadUrlPlaceholder: '#download-taras-2025-souvenir',
    description: 'Archive of peer-reviewed paper presentations published during TARAS 2025, covering FPGA synthesis, RF sensors, and machine learning on microcontrollers.',
    editors: ['Dr. G. Uresh Kumar', 'Dr. C. Amali'],
  },
  {
    id: 'proc-2024',
    year: '2024',
    title: 'Proceedings of TARAS 2024: VLSI Innovations & Smart Automation',
    theme: 'Sub-nanometer CMOS Logic & Autonomous Robotics',
    papersCount: 38,
    isbn: '978-93-89123-12-8',
    downloadUrlPlaceholder: '#download-taras-2024-souvenir',
    description: 'Volume 12 of the SRM Valliammai ECE National Symposium Proceedings showcasing student research papers and workshop summaries.',
    editors: ['Dr. S. Ramesh', 'Dr. V. Suresh'],
  },
  {
    id: 'proc-2026-upcoming',
    year: '2026',
    title: 'TARAS 2K26 Souvenir & Proceedings Volume (Upcoming)',
    theme: 'Spider-Web Connected Intelligence & 6G Wireless Frontiers',
    papersCount: 50,
    isbn: '978-93-90000-26-0 (Reserved)',
    downloadUrlPlaceholder: '#upcoming-taras-2k26-proceedings',
    description: 'All selected high-scoring papers from Paperionix 2026 will be compiled into the official ISBN indexed TARAS 2K26 E-Souvenir.',
    editors: ['Dr. Komala', 'Dr. G. Uresh Kumar'],
  },
];
