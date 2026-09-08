/**
 * TARAS 2K26 — Official Team Data Structure
 *
 * Centralized strongly-typed data store for all organizing committee members.
 * Includes: Office Bearers (in exact requested order), College Authorities, Faculty & Staff, Event Heads, and Core Team.
 */

export type TeamCategoryKey = 'office-bearer' | 'authorities' | 'staff' | 'coordinator' | 'core-team';

export interface TeamCategoryInfo {
  key: TeamCategoryKey;
  label: string;
  shortLabel: string;
  description: string;
}

export interface TeamMemberItem {
  id: string;
  name: string;
  role: string;
  category: TeamCategoryKey;
  department?: string;
  designation?: string;
  image?: string;
  instagram?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  shortBio?: string;
  assignedEventName?: string;
  badge?: string;
}

export const TEAM_CATEGORIES: TeamCategoryInfo[] = [
  {
    key: 'office-bearer',
    label: 'STUDENT OFFICE BEARERS',
    shortLabel: 'OFFICE BEARERS',
    description: 'Student executive leadership steering TARAS 2K26 operations.',
  },
  {
    key: 'authorities',
    label: 'COLLEGE AUTHORITIES',
    shortLabel: 'AUTHORITIES',
    description: 'Management & executive leadership of SRM Valliammai Engineering College.',
  },
  {
    key: 'staff',
    label: 'FACULTY COORDINATORS',
    shortLabel: 'FACULTY',
    description: 'HOD and faculty conveners guiding the symposium.',
  },
  {
    key: 'coordinator',
    label: 'EVENT HEADS',
    shortLabel: 'EVENT HEADS',
    description: 'Track heads managing competition execution and judging coordination.',
  },
  {
    key: 'core-team',
    label: 'CORE TEAM',
    shortLabel: 'CORE TEAM',
    description: 'Technical, design, media, and logistical teams building TARAS 2K26.',
  },
];

export const TEAM_MEMBERS: TeamMemberItem[] = [
  // ── 1. STUDENT OFFICE BEARERS (EXACT REQUIRED ORDER) ──────────────────────
  {
    id: 'ob-01',
    name: 'R. Kirthivasan',
    role: 'PRESIDENT',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Student Council President',
    shortBio: 'Leading overall student operations and institutional synergy for TARAS 2K26.',
    email: 'taras2k26@gmail.com',
    phone: '+91 88385 13747',
    badge: '1. PRESIDENT',
  },
  {
    id: 'ob-02',
    name: 'S. Niveditha',
    role: 'SECRETARY',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'General Secretary',
    shortBio: 'Overseeing administrative proceedings and registration desk operations.',
    email: 'taras2k26@gmail.com',
    badge: '2. SECRETARY',
  },
  {
    id: 'ob-03',
    name: 'K. Divya',
    role: 'TREASURER',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Financial Treasurer',
    shortBio: 'Supervising fee collection, accounts, and payment verification.',
    email: 'taras2k26@gmail.com',
    badge: '3. TREASURER',
  },
  {
    id: 'ob-04',
    name: 'K. Abhinav',
    role: 'EVENT COORDINATOR',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Event Coordinator Lead',
    shortBio: 'Coordinating event guidelines, track schedules, and event logistics.',
    email: 'taras2k26@gmail.com',
    badge: '4. EVENT COORDINATOR',
  },
  {
    id: 'ob-05',
    name: 'V. Siddharth',
    role: 'VICE PRESIDENT',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Student Vice President',
    shortBio: 'Directing inter-departmental coordination and delegate relations.',
    email: 'taras2k26@gmail.com',
    badge: '5. VICE PRESIDENT',
  },
  {
    id: 'ob-06',
    name: 'M. Gokul',
    role: 'JOINT SECRETARY',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Joint Secretary',
    shortBio: 'Managing participant care and registration desk support.',
    email: 'taras2k26@gmail.com',
    badge: '6. JOINT SECRETARY',
  },
  {
    id: 'ob-07',
    name: 'S. Preethi',
    role: 'JOINT TREASURER',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Joint Treasurer',
    shortBio: 'Assisting in finance management and payment record audits.',
    email: 'taras2k26@gmail.com',
    badge: '7. JOINT TREASURER',
  },
  {
    id: 'ob-08',
    name: 'R. Vignesh',
    role: 'JOINT EVENT COORDINATOR',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Joint Event Coordinator',
    shortBio: 'Supporting track execution and venue operations.',
    email: 'taras2k26@gmail.com',
    badge: '8. JOINT EVENT COORDINATOR',
  },

  // ── 2. COLLEGE AUTHORITIES ───────────────────────────────────────────────
  {
    id: 'auth-01',
    name: 'Dr. B. Chidambararajan',
    role: 'CHIEF PATRON',
    category: 'authorities',
    department: 'SRM Valliammai Engineering College',
    designation: 'Director',
    shortBio: 'Providing executive leadership and strategic vision for the institution and TARAS 2K26.',
    badge: 'CHIEF PATRON · DIRECTOR',
  },
  {
    id: 'auth-02',
    name: 'Dr. M. Murugan',
    role: 'PATRON',
    category: 'authorities',
    department: 'SRM Valliammai Engineering College',
    designation: 'Principal',
    shortBio: 'Guiding academic excellence and institutional support for the national symposium.',
    badge: 'PATRON · PRINCIPAL',
  },

  // ── 3. FACULTY & STAFF ───────────────────────────────────────────────────
  {
    id: 'st-01',
    name: 'Dr. Komala',
    role: 'HOD / CONVENER',
    category: 'staff',
    department: 'Department of Electronics & Communication Engineering',
    designation: 'Professor & HOD',
    shortBio: 'Convener and HOD guiding the TARAS 2K26 symposium.',
    email: 'taras2k26@gmail.com',
    badge: 'HOD / CONVENER',
  },
  {
    id: 'st-02',
    name: 'Dr. G. Uresh Kumar',
    role: 'FACULTY COORDINATOR',
    category: 'staff',
    department: 'Department of Electronics & Communication Engineering',
    designation: 'Associate Professor',
    shortBio: 'Faculty Coordinator overseeing event execution and academic compliance.',
    email: 'taras2k26@gmail.com',
    badge: 'FACULTY COORDINATOR',
  },
  {
    id: 'st-03',
    name: 'Dr. C. Amali',
    role: 'FACULTY COORDINATOR',
    category: 'staff',
    department: 'Department of Electronics & Communication Engineering',
    designation: 'Assistant Professor (Sr. G)',
    shortBio: 'Faculty Coordinator guiding competition schedules and student teams.',
    email: 'taras2k26@gmail.com',
    badge: 'FACULTY COORDINATOR',
  },

  // ── 4. EVENT HEADS ───────────────────────────────────────────────────────
  {
    id: 'co-01',
    name: 'Kanishka M',
    role: 'EVENT HEAD — PAPER-X-VERSE',
    category: 'coordinator',
    department: 'Department of ECE',
    assignedEventName: 'Paper-X-Verse',
    phone: '+91 88385 13747',
    badge: 'EVENT HEAD',
  },
  {
    id: 'co-02',
    name: 'Arun Kumar N',
    role: 'EVENT HEAD — PAPER-X-VERSE',
    category: 'coordinator',
    department: 'Department of ECE',
    assignedEventName: 'Paper-X-Verse',
    phone: '+91 99620 43906',
    badge: 'EVENT HEAD',
  },
  {
    id: 'co-03',
    name: 'Pavithra K',
    role: 'EVENT HEAD — DOC OCK’S CLUE CARTEL',
    category: 'coordinator',
    department: 'Department of ECE',
    assignedEventName: 'Doc Ock’s Clue Cartel',
    phone: '+91 93441 78530',
    badge: 'EVENT HEAD',
  },
  {
    id: 'co-04',
    name: 'R Rajasree',
    role: 'CO-HEAD — DOC OCK’S CLUE CARTEL',
    category: 'coordinator',
    department: 'Department of ECE',
    assignedEventName: 'Doc Ock’s Clue Cartel',
    phone: '+91 99624 52216',
    badge: 'CO-HEAD',
  },
  {
    id: 'co-05',
    name: 'Uthayakumar M M',
    role: 'EVENT HEAD — KNULL’S VOID',
    category: 'coordinator',
    department: 'Department of ECE',
    assignedEventName: 'Knull’s Void',
    phone: '+91 90424 61946',
    badge: 'EVENT HEAD',
  },
  {
    id: 'co-06',
    name: 'Guru Sathyagan M',
    role: 'EVENT HEAD — KINGPIN’S NEXUS',
    category: 'coordinator',
    department: 'Department of ECE',
    assignedEventName: 'Kingpin’s Nexus',
    phone: '+91 93420 35854',
    badge: 'EVENT HEAD',
  },
  {
    id: 'co-07',
    name: 'Kamales A M',
    role: 'EVENT HEAD — MYSTERIO’S PARADOX',
    category: 'coordinator',
    department: 'Department of ECE',
    assignedEventName: 'Mysterio’s Paradox',
    phone: '+91 93453 76163',
    badge: 'EVENT HEAD',
  },
];

export function getMembersByCategory(category: TeamCategoryKey): TeamMemberItem[] {
  return TEAM_MEMBERS.filter((m) => m.category === category);
}
