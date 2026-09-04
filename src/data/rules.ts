export interface RuleSection {
  category: 'General' | 'Registration' | 'Events' | 'Team' | 'Conduct' | 'Certificates' | 'Venue';
  iconName: string;
  items: string[];
}

export const MOCK_RULES: RuleSection[] = [
  {
    category: 'General',
    iconName: 'ShieldAlert',
    items: [
      'TARAS 2K26 is open to undergraduate and postgraduate engineering students holding a valid college identity card.',
      'All participants must bring their physical college ID card alongside their digital TARAS entry pass.',
      'Symposium gates open at 08:00 AM IST on 26th September 2026. Reporting after 09:30 AM may forfeit event eligibility.',
      'Standard formal or decent casual dress code according to SRM Valliammai guidelines must be maintained.',
    ],
  },
  {
    category: 'Registration',
    iconName: 'UserCheck',
    items: [
      'Registration must be completed through the official TARAS 2K26 portal.',
      'Each participant receives an individual unique QR code pass upon registration.',
      'Registration fee payment is non-refundable under any circumstances once processed.',
      'On-spot registration availability depends on seat matrix capacity for individual events.',
    ],
  },
  {
    category: 'Events',
    iconName: 'Zap',
    items: [
      'Participants may register for multiple events provided there are no direct schedule overlaps.',
      'All event submissions (paper slides, hackathon repositories) must be presented within the allotted time limit.',
      'Decisions made by the event jury panels and coordinators are final and binding.',
      'Any form of malpractice or plagiarism will lead to immediate disqualification across all registered events.',
    ],
  },
  {
    category: 'Team',
    iconName: 'Users',
    items: [
      'Team members must register individually and specify their unique Team Code during registration.',
      'Inter-college and inter-departmental teams are allowed unless explicitly restricted in specific event rules.',
      'Substitutions of team members on event day require prior written approval from the Event Head.',
    ],
  },
  {
    category: 'Conduct',
    iconName: 'Award',
    items: [
      'Smoking, consumption of alcohol, or use of banned substances on campus is strictly prohibited.',
      'Littering, damaging college property, or disruptive behavior will attract severe disciplinary action.',
      'Please maintain decorum and sportsmanship during all competitive rounds.',
    ],
  },
  {
    category: 'Certificates',
    iconName: 'FileCheck',
    items: [
      'Certificates of Participation are issued ONLY to participants whose Venue Presence and Event Attendance are verified on-site.',
      'Digital verifiable certificates will be uploaded to the TARAS Participant Dashboard post-event.',
      'Certificates contain a unique verification QR code linked to the TARAS central database.',
    ],
  },
  {
    category: 'Venue',
    iconName: 'MapPin',
    items: [
      'Participants must restrict their movement to designated symposium areas (ECE Block, Main Auditorium, Central Dining Hall).',
      'Parking is permitted only in designated guest vehicle zones at the campus main gate.',
      'Help desks and medical first-aid stations are located on the Ground Floor ECE Quadrangle.',
    ],
  },
];
