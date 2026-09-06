/**
 * TARAS 2K26 — Official Team Data Structure
 *
 * Centralized strongly-typed data store for all organizing committee members.
 * Supports: Office Bearers, Staff, Coordinators, and Core Team.
 */

export type TeamCategoryKey = 'office-bearer' | 'staff' | 'coordinator' | 'core-team';

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
    label: 'OFFICE BEARERS',
    shortLabel: 'OFFICE BEARERS',
    description: 'Student executive leadership steering TARAS 2K26 operations and student representation.',
  },
  {
    key: 'staff',
    label: 'FACULTY & STAFF',
    shortLabel: 'STAFF',
    description: 'Distinguished faculty conveners, HOD leadership, and staff advisors guiding the symposium.',
  },
  {
    key: 'coordinator',
    label: 'EVENT HEADS',
    shortLabel: 'COORDINATORS',
    description: 'Track heads managing competition execution, judging rubrics, and track coordination.',
  },
  {
    key: 'core-team',
    label: 'CORE TEAM',
    shortLabel: 'CORE TEAM',
    description: 'Technical, design, media, and logistical teams building the TARAS 2K26 experience.',
  },
];

export const TEAM_MEMBERS: TeamMemberItem[] = [
  // ── 1. OFFICE BEARERS ───────────────────────────────────────────────────────
  {
    id: 'ob-01',
    name: 'R. Kirthivasan',
    role: 'PRESIDENT',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Student Council President',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Leading student operations, institutional synergy, and overall event execution for TARAS 2K26.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    email: 'kirthivasan.taras@valliammai.edu.in',
    phone: '+91 98401 23456',
    badge: 'STUDENT COUNCIL PRESIDENT',
  },
  {
    id: 'ob-02',
    name: 'V. Siddharth',
    role: 'VICE PRESIDENT',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Student Vice President',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Directing inter-departmental coordination, delegate relations, and venue execution logistics.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    email: 'siddharth.taras@valliammai.edu.in',
    phone: '+91 97908 11223',
    badge: 'VICE PRESIDENT',
  },
  {
    id: 'ob-03',
    name: 'S. Niveditha',
    role: 'SECRETARY',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'General Secretary',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Overseeing administrative proceedings, registration desk operations, and communication channels.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    email: 'niveditha.taras@valliammai.edu.in',
    phone: '+91 98402 34567',
    badge: 'GENERAL SECRETARY',
  },
  {
    id: 'ob-04',
    name: 'M. Gokul',
    role: 'JOINT SECRETARY',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Joint Secretary',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Managing participant care, pass verification systems, and event desk operations.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    email: 'gokul.taras@valliammai.edu.in',
    badge: 'JOINT SECRETARY',
  },
  {
    id: 'ob-05',
    name: 'K. Divya',
    role: 'TREASURER',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Financial Treasurer',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Supervising fee collection, payment verification reconciliation, and symposium accounts.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    email: 'divya.taras@valliammai.edu.in',
    badge: 'FINANCIAL TREASURER',
  },
  {
    id: 'ob-06',
    name: 'K. Abhinav',
    role: 'TECHNICAL LEAD',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Student Technical Convener',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Coordinating technical event guidelines, judging criteria rubrics, and platform integration.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    phone: '+91 99403 88990',
    badge: 'TECHNICAL LEAD',
  },

  // ── 2. FACULTY & STAFF ──────────────────────────────────────────────────────
  {
    id: 'st-01',
    name: 'Dr. Komala',
    role: 'HEAD OF DEPARTMENT (ECE)',
    category: 'staff',
    department: 'Electronics & Communication Engineering',
    designation: 'Professor & HOD',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Providing visionary leadership and institutional guidance for the annual TARAS 2K26 symposium.',
    email: 'hod.ece@valliammai.edu.in',
    badge: 'HOD · ECE',
  },
  {
    id: 'st-02',
    name: 'Dr. G. Uresh Kumar',
    role: 'FACULTY CONVENER',
    category: 'staff',
    department: 'Electronics & Communication Engineering',
    designation: 'Associate Professor',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Heading overall faculty governance, academic alignment, and chief convener duties.',
    email: 'ureshkumar.ece@valliammai.edu.in',
    badge: 'FACULTY CONVENER',
  },
  {
    id: 'st-03',
    name: 'Dr. C. Amali',
    role: 'FACULTY CO-CONVENER',
    category: 'staff',
    department: 'Electronics & Communication Engineering',
    designation: 'Assistant Professor (Sr. G)',
    image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Co-coordinating event track schedules, faculty jury panels, and ceremonial proceedings.',
    email: 'amali.ece@valliammai.edu.in',
    badge: 'FACULTY CO-CONVENER',
  },
  {
    id: 'st-04',
    name: 'Prof. R. Arunkumar',
    role: 'STAFF COORDINATOR',
    category: 'staff',
    department: 'Electronics & Communication Engineering',
    designation: 'Assistant Professor',
    image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Supervising ground venue setup, hall assignments, and logistical infrastructure.',
    email: 'arunkumar.ece@valliammai.edu.in',
    badge: 'STAFF COORDINATOR',
  },
  {
    id: 'st-05',
    name: 'Dr. P. Subhashini',
    role: 'STAFF ADVISOR',
    category: 'staff',
    department: 'Electronics & Communication Engineering',
    designation: 'Associate Professor',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Guiding technical paper presentations, jury scorecards, and workshop sessions.',
    email: 'subhashini.ece@valliammai.edu.in',
    badge: 'STAFF ADVISOR',
  },

  // ── 3. EVENT COORDINATORS ───────────────────────────────────────────────────
  {
    id: 'co-01',
    name: 'M. Hariharan',
    role: 'EVENT HEAD — CINEMATRIX',
    category: 'coordinator',
    department: 'Department of ECE · 3rd Year',
    designation: 'Track Convener',
    assignedEventName: 'CineMatrix',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Managing rules, judging rubrics, and live scorecard scoring for the CineMatrix flagship event.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    phone: '+91 98845 67890',
    badge: 'EVENT HEAD · CINEMATRIX',
  },
  {
    id: 'co-02',
    name: 'S. Tharun',
    role: 'EVENT HEAD — BYTE HUNT',
    category: 'coordinator',
    department: 'Department of ECE · 3rd Year',
    designation: 'Track Convener',
    assignedEventName: 'Byte Hunt',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Leading competitive coding challenges, automated test evaluations, and leaderboard sync.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    phone: '+91 97100 54321',
    badge: 'EVENT HEAD · BYTE HUNT',
  },
  {
    id: 'co-03',
    name: 'A. Dhanush',
    role: 'EVENT HEAD — VLSI MASTERCLASS',
    category: 'coordinator',
    department: 'Department of ECE · 3rd Year',
    designation: 'Workshop Convener',
    assignedEventName: 'VLSI Masterclass',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Coordinating hands-on lab sessions, guest speakers, and workshop attendance certification.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    phone: '+91 96001 98765',
    badge: 'WORKSHOP CONVENER',
  },
  {
    id: 'co-04',
    name: 'R. Kavya',
    role: 'EVENT HEAD — ROBO WARS',
    category: 'coordinator',
    department: 'Department of ECE · 3rd Year',
    designation: 'Track Convener',
    assignedEventName: 'Robo Wars',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Supervising arena safety, arena specifications, and match bracket scheduling.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    badge: 'EVENT HEAD · ROBO WARS',
  },
  {
    id: 'co-05',
    name: 'V. Praveen',
    role: 'EVENT HEAD — PAPER PRESENTATION',
    category: 'coordinator',
    department: 'Department of ECE · 3rd Year',
    designation: 'Track Convener',
    assignedEventName: 'Paper Presentation',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Managing abstract submissions, jury evaluation sheets, and presentation tracks.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    badge: 'EVENT HEAD · PAPER PRESENTATION',
  },
  {
    id: 'co-06',
    name: 'S. Priya',
    role: 'EVENT HEAD — GAMING ARENA',
    category: 'coordinator',
    department: 'Department of ECE · 3rd Year',
    designation: 'Track Convener',
    assignedEventName: 'Gaming Arena',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Directing LAN tournament brackets, referee management, and live streaming setup.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    badge: 'EVENT HEAD · GAMING ARENA',
  },

  // ── 4. CORE TEAM ────────────────────────────────────────────────────────────
  {
    id: 'ct-01',
    name: 'E. Sanjay',
    role: 'LEAD PLATFORM ARCHITECT',
    category: 'core-team',
    department: 'Department of ECE · Final Year',
    designation: 'Tech Lead',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Architecting the TARAS 2K26 digital platform, real-time Firestore sync, and pass security.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    badge: 'PLATFORM ARCHITECT',
  },
  {
    id: 'ct-02',
    name: 'K. Varun',
    role: 'VISUAL & UI DIRECTOR',
    category: 'core-team',
    department: 'Department of ECE · Final Year',
    designation: 'Design Lead',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Crafting the cinematic visual language, web atmosphere, and symposium branding.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    badge: 'DESIGN DIRECTOR',
  },
  {
    id: 'ct-03',
    name: 'B. Swetha',
    role: 'MEDIA & PR LEAD',
    category: 'core-team',
    department: 'Department of ECE · Final Year',
    designation: 'Media Coordinator',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Directing official photography, social media coverage, and symposium teasers.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    badge: 'MEDIA LEAD',
  },
  {
    id: 'ct-04',
    name: 'T. Karthik',
    role: 'LOGISTICS & STAGE LEAD',
    category: 'core-team',
    department: 'Department of ECE · Final Year',
    designation: 'Operations Coordinator',
    image: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Managing auditorium audio-visuals, stage setup, and inaugural ceremony flow.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    badge: 'LOGISTICS LEAD',
  },
  {
    id: 'ct-05',
    name: 'R. Anitha',
    role: 'HOSPITALITY & CARE LEAD',
    category: 'core-team',
    department: 'Department of ECE · Final Year',
    designation: 'Delegate Lead',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Overseeing outstation delegate reception, hospitality desks, and certificate distribution.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    badge: 'HOSPITALITY LEAD',
  },
  {
    id: 'ct-06',
    name: 'J. Rahul',
    role: 'SPONSORSHIP & INDUSTRY OUTREACH',
    category: 'core-team',
    department: 'Department of ECE · Final Year',
    designation: 'Outreach Lead',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    shortBio: 'Building industry partnerships, corporate sponsorships, and stall relations.',
    instagram: 'https://instagram.com/placeholder',
    linkedin: 'https://linkedin.com/in/placeholder',
    badge: 'OUTREACH LEAD',
  },
];

/**
 * Get members by category key
 */
export function getMembersByCategory(category: TeamCategoryKey): TeamMemberItem[] {
  return TEAM_MEMBERS.filter((m) => m.category === category);
}
