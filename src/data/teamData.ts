/**
 * TARAS 2K26 — Official Team Data Store (SINGLE SOURCE OF TRUTH)
 *
 * All student office bearer order, college authorities, staff coordinators,
 * and event head references are centralized here.
 *
 * DO NOT ALTER THE STUDENT OFFICE BEARER ORDER:
 * 1. PRESIDENT
 * 2. SECRETARY
 * 3. TREASURER
 * 4. EVENT CO ORDINATOR
 * 5. VICE PRESIDENT
 * 6. JOINT SECRETARY
 * 7. JOINT TREASURER
 * 8. JOINT EVENT CO ORDINATOR
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
  profileLink?: string;
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
    label: 'FACULTY EVENT COORDINATORS',
    shortLabel: 'FACULTY',
    description: 'HOD and faculty coordinators guiding the symposium.',
  },
  {
    key: 'coordinator',
    label: 'EVENT HEADS & COORDINATORS',
    shortLabel: 'EVENT HEADS',
    description: 'Track heads managing competition execution and judging coordination.',
  },
];

export const TEAM_MEMBERS: TeamMemberItem[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // 1. OFFICIAL STUDENT TEAM (PRESERVE THIS EXACT ORDER MANDATORY)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'ob-01',
    name: 'HARIHARAN R',
    role: 'PRESIDENT',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Student Council President',
    shortBio: 'Leading overall student operations, institutional synergy, and execution for TARAS 2K26.',
    email: 'haranrhari28@gmail.com',
    phone: '8637423676',
    linkedin: 'https://www.linkedin.com/in/future-genius/',
    instagram: 'https://instagram.com/hawkeye_hari',
    badge: 'PRESIDENT',
  },
  {
    id: 'ob-02',
    name: 'PRASANNARAJ S',
    role: 'SECRETARY',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'General Secretary',
    shortBio: 'Overseeing administrative proceedings, registration operations, and communication channels.',
    email: 'prasanna11112005@gmail.com',
    phone: '9710125994',
    linkedin: 'https://www.linkedin.com/in/prasannaraj-s-aa340333a',
    instagram: 'https://www.instagram.com/__.theprasanna',
    badge: 'SECRETARY',
    image: '/assets/team/prasanna.jpeg',
  },
  {
    id: 'ob-03',
    name: 'SUBASH. P',
    role: 'TREASURER',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Financial Treasurer',
    shortBio: 'Supervising fee collection, accounts reconciliation, and payment verification.',
    email: 'subashpallavadass@gmail.com',
    phone: '9361408376',
    linkedin: 'https://www.linkedin.com/in/subashpallavadoss',
    instagram: 'https://www.instagram.com/_.subashhh',
    badge: 'TREASURER',
    image: '/assets/team/subash.jpeg',
  },
  {
    id: 'ob-04',
    name: 'KAMALESHKUMAR. S',
    role: 'EVENT CO ORDINATOR',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Event Coordinator Lead',
    shortBio: 'Directing competition guidelines, track logistics, and event head operations.',
    email: 'kamaleshkk2005@gmail.com',
    phone: '9940416460',
    linkedin: 'https://www.linkedin.com/in/s-kamaleshkumar-4812972b7',
    instagram: 'https://www.instagram.com/prince__7731',
    badge: 'EVENT CO ORDINATOR',
    image: '/assets/team/kamaleshkumar.jpeg',
  },
  {
    id: 'ob-05',
    name: 'SAKTHIVEL. K',
    role: 'VICE PRESIDENT',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Student Vice President',
    shortBio: 'Directing inter-departmental coordination, delegate relations, and venue execution.',
    email: 'Sakthivel11082006@gmail.com',
    phone: '9025863623',
    linkedin: 'https://www.linkedin.com/in/sakthivel-k-35b718342',
    instagram: 'https://www.instagram.com/peace_____of____sadness',
    badge: 'VICE PRESIDENT',
    image: '/assets/team/sakthivel.jpeg',
  },
  {
    id: 'ob-06',
    name: 'PRATHIESH B',
    role: 'JOINT SECRETARY',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Joint Secretary',
    shortBio: 'Managing delegate care, pass verification systems, and event desk operations.',
    email: 'prathieshchn600091@gmail.com',
    phone: '8754510012',
    linkedin: 'https://www.linkedin.com/in/prathiesh-b-842978330',
    instagram: 'https://www.instagram.com/prathiesh_bp',
    badge: 'JOINT SECRETARY',
  },
  {
    id: 'ob-07',
    name: 'ASVITHA V',
    role: 'JOINT TREASURER',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Joint Treasurer',
    shortBio: 'Assisting financial auditing, payment proof verification, and budgeting.',
    email: 'asvithav1310@gmail.com',
    phone: '7339077983',
    linkedin: 'https://www.linkedin.com/in/asvitha-v-946a84350',
    instagram: 'https://www.instagram.com/_ashe17',
    badge: 'JOINT TREASURER',
    image: '/assets/team/asvitha.jpeg',
  },
  {
    id: 'ob-08',
    name: 'RUPESH. S',
    role: 'JOINT EVENT CO ORDINATOR',
    category: 'office-bearer',
    department: 'Department of ECE · Final Year',
    designation: 'Joint Event Coordinator',
    shortBio: 'Co-coordinating competition track execution, venue readiness, and scoring flows.',
    email: 'tamilselvansxc@gmail.com',
    phone: '9566206561',
    linkedin: 'https://www.linkedin.com/in/rupesh-s-14139b3ba',
    instagram: 'https://www.instagram.com/rupexhx._18',
    badge: 'JOINT EVENT CO ORDINATOR',
    image: '/assets/team/rupesh.jpeg',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. OFFICIAL COLLEGE AUTHORITIES
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'auth-01',
    name: 'DR. M. MURUGAN M. E.(E&TC), PH. D.',
    role: 'PATRON & PRINCIPAL',
    category: 'authorities',
    department: 'SRM Valliammai Engineering College',
    designation: 'Professor & Principal',
    shortBio: 'Providing academic leadership, institutional guidance, and principal patron support for TARAS 2K26.',
    email: 'muruganm.ece@srmvalliammai.ac.in',
    badge: 'PROFESSOR & PRINCIPAL',
  },
  {
    id: 'auth-02',
    name: 'DR. KOMALA JAMES M.E., PH.D.',
    role: 'HEAD OF DEPARTMENT (ECE)',
    category: 'authorities',
    department: 'Department of Electronics & Communication Engineering',
    designation: 'Professor & Head of the department',
    shortBio: 'Convener and HOD guiding the vision, technical standards, and execution of TARAS 2K26.',
    email: 'komalaj.ece@srmvalliammai.ac.in',
    badge: 'PROFESSOR & HOD',
    image: '/assets/team/hod_maam.webp',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. STAFF EVENT COORDINATORS
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'st-01',
    name: 'DR. N. JOTHY, M.TECH., PH.D',
    role: 'STAFF EVENT COORDINATOR',
    category: 'staff',
    department: 'Department of Electronics & Communication Engineering',
    designation: 'Faculty Event Coordinator',
    shortBio: 'Faculty Event Coordinator overseeing track schedules, academic alignment, and jury panels.',
    email: 'jothyn.ece@srmvalliammai.ac.in',
    badge: 'STAFF EVENT COORDINATOR',
    image: '/assets/team/jothy.webp',
  },
  {
    id: 'st-02',
    name: 'DR. R. DHANANJEYAN, M.E., PH.D.',
    role: 'STAFF EVENT COORDINATOR',
    category: 'staff',
    department: 'Department of Electronics & Communication Engineering',
    designation: 'Faculty Event Coordinator',
    shortBio: 'Faculty Event Coordinator overseeing technical track execution and venue coordination.',
    email: 'dhananjeyanr.ece@srmvalliammai.ac.in',
    profileLink: 'https://srmvalliammai.irins.org/profile/326285',
    badge: 'STAFF EVENT COORDINATOR',
    image: '/assets/team/dhananjeyan.jpg',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 4. EVENT HEADS (DEDICATED TRACK HEADS SECTION)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'eh-01',
    name: 'KANISHKA M',
    role: 'EVENT HEAD',
    category: 'coordinator',
    department: 'Department of ECE',
    designation: 'Event Head — Paper-X-Verse Internal',
    assignedEventName: 'PAPER-X-VERSE — INTERNAL',
    shortBio: 'Event Head managing internal paper presentation track submissions, jury defense schedules, and MCU superpower evaluation.',
    email: 'kanishksudha631@gmail.com',
    phone: '8838513747',
    linkedin: 'https://www.linkedin.com/in/kanishka-mohan-vengadesh-336a812b6',
    instagram: 'https://www.instagram.com/_s_assy_04',
    badge: 'PAPER-X-VERSE — INTERNAL',
    image: '/assets/team/kanishka.png',
  },
  {
    id: 'eh-02',
    name: 'ARUN KUMAR N',
    role: 'EVENT HEAD',
    category: 'coordinator',
    department: 'Department of ECE',
    designation: 'Event Head — Paper-X-Verse External',
    assignedEventName: 'PAPER-X-VERSE — EXTERNAL',
    shortBio: 'Event Head leading external national delegate paper presentations, abstract screening, and defense proceedings.',
    email: 'arunkumarak200595@gmail.com',
    phone: '9962043906',
    linkedin: 'https://www.linkedin.com/in/arun-kumar-a709882b7',
    instagram: 'https://www.instagram.com/_.aruneeyyyyyyyy',
    badge: 'PAPER-X-VERSE — EXTERNAL',
    image: '/assets/team/arunkumar.png',
  },
  {
    id: 'eh-03',
    name: 'KAMALES A M',
    role: 'EVENT HEAD',
    category: 'coordinator',
    department: 'Department of ECE',
    designation: 'Event Head — Mysterio’s Paradox',
    assignedEventName: "MYSTERIO'S PARADOX",
    shortBio: 'Event Head leading the interactive Mystery Box sentence reconstruction and rapid-fire technology illusion competition.',
    email: 'amk25amales2006@gmail.com',
    phone: '9345376163',
    linkedin: 'https://www.linkedin.com/in/amkamales25',
    instagram: 'https://www.instagram.com/_.amk._tanzanite',
    badge: "MYSTERIO'S PARADOX",
    image: '/assets/team/kamalesam.jpeg',
  },
  {
    id: 'eh-04',
    name: 'UTHAYAKUMAR M M',
    role: 'EVENT HEAD',
    category: 'coordinator',
    department: 'Department of ECE',
    designation: 'Event Head — Knull’s Void',
    assignedEventName: "KNULL'S VOID",
    shortBio: 'Event Head managing Recall Rush electronic component recall and Cup to Core speed logic challenge.',
    email: 'udhayakumarmm454@gmail.com',
    phone: '9042461946',
    linkedin: 'https://www.linkedin.com/in/uthaya20',
    instagram: 'https://www.instagram.com/udhay___03',
    badge: "KNULL'S VOID",
    image: '/assets/team/udhaya.jpeg',
  },
  {
    id: 'eh-05',
    name: 'GURUSATHYAGAN M',
    role: 'EVENT HEAD',
    category: 'coordinator',
    department: 'Department of ECE',
    designation: 'Event Head — Kingpin’s Nexus',
    assignedEventName: "KINGPIN'S NEXUS",
    shortBio: 'Event Head directing the competitive Cricket Quiz and live player auction squad-building track.',
    email: 'gurusathyagan19@gmail.com',
    phone: '9342035854',
    linkedin: 'https://www.linkedin.com/in/guru-sathyagan-8702492b7',
    instagram: 'https://www.instagram.com/mg_guru_07',
    badge: "KINGPIN'S NEXUS",
    image: '/assets/team/guru.jpeg',
  },
  {
    id: 'eh-06',
    name: 'PAVITHRA K',
    role: 'EVENT HEAD',
    category: 'coordinator',
    department: 'Department of ECE',
    designation: 'Event Head — Doc Ock’s Clue Cartel',
    assignedEventName: "DOC OCK'S CLUE CARTEL",
    shortBio: 'Event Head leading Doc Ock’s Clue Cartel technical bidding, 8-slot wheel challenge, and clue decoding operations.',
    email: 'pavithrakannan308@gmail.com',
    phone: '9344178530',
    linkedin: 'https://www.linkedin.com/in/pavithra-kannan-7247992b5',
    instagram: 'https://www.instagram.com/pavithra_kanan/',
    badge: "DOC OCK'S CLUE CARTEL",
    image: '/assets/team/pavithra.jpeg',
  },
];

/**
 * Get members by category key
 */
export function getMembersByCategory(category: TeamCategoryKey): TeamMemberItem[] {
  return TEAM_MEMBERS.filter((m) => m.category === category);
}

/**
 * Search member by name or role
 */
export function findTeamMember(query: string): TeamMemberItem | undefined {
  const q = query.toLowerCase();
  return TEAM_MEMBERS.find(
    (m) => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
  );
}
