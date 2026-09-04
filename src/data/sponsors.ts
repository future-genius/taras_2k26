export interface Sponsor {
  id: string;
  name: string;
  category: 'TITLE' | 'PLATINUM' | 'GOLD' | 'TECHNICAL_PARTNER' | 'ASSOCIATE';
  description: string;
  logoPlaceholder: string;
  websiteUrl?: string;
}

export const MOCK_SPONSORS: Sponsor[] = [
  {
    id: 'sp-01',
    name: 'TechMatrix VLSI Solutions',
    category: 'TITLE',
    description: 'Leading Semiconductor EDA & ASIC Prototyping Solutions Provider.',
    logoPlaceholder: 'TECHMATRIX',
    websiteUrl: 'https://example.com/techmatrix',
  },
  {
    id: 'sp-02',
    name: 'CyberGrid Systems',
    category: 'PLATINUM',
    description: 'Enterprise Edge Computing & IoT Cloud Infrastructure.',
    logoPlaceholder: 'CYBERGRID',
    websiteUrl: 'https://example.com/cybergrid',
  },
  {
    id: 'sp-03',
    name: 'Qualnet Communications',
    category: 'GOLD',
    description: '5G/6G Wireless Signal Simulation & RF Hardware Design.',
    logoPlaceholder: 'QUALNET',
    websiteUrl: 'https://example.com/qualnet',
  },
  {
    id: 'sp-04',
    name: 'RoboCraft India',
    category: 'TECHNICAL_PARTNER',
    description: 'Hardware Sensor Kits & Embedded Controller Developer Community.',
    logoPlaceholder: 'ROBOCRAFT',
    websiteUrl: 'https://example.com/robocraft',
  },
  {
    id: 'sp-05',
    name: 'IEEE SRM Valliammai SB',
    category: 'ASSOCIATE',
    description: 'IEEE Student Branch & ECE Technical Society Partner.',
    logoPlaceholder: 'IEEE VEC',
  },
];
