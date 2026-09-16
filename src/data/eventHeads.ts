/**
 * TARAS 2K26 — Official Event Heads Central Data Source
 * 
 * Maps each event track to its official assigned Event Head.
 * 
 * MANDATORY EVENT HEAD MAPPING:
 * 1. PAPER-X-VERSE — INTERNAL  → KANISHKA M
 * 2. PAPER-X-VERSE — EXTERNAL  → ARUN KUMAR N
 * 3. MYSTERIO'S PARADOX        → KAMALES A M
 * 4. KNULL'S VOID              → UTHAYAKUMAR M M
 * 5. KINGPIN'S NEXUS           → GURUSATHYAGAN M
 */

export interface EventHeadItem {
  id: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  instagram: string;
  department: string;
  shortBio: string;
  image?: string;
}

export const EVENT_HEADS: EventHeadItem[] = [
  {
    id: 'eh-01',
    eventId: 'taras-01-int',
    eventName: 'PAPER-X-VERSE — INTERNAL',
    eventSlug: 'paper-x-verse-internal',
    name: 'KANISHKA M',
    phone: '8838513747',
    email: 'kanishksudha631@gmail.com',
    linkedin: 'https://www.linkedin.com/in/kanishka-mohan-vengadesh-336a812b6',
    instagram: 'https://www.instagram.com/_s_assy_04',
    department: 'Department of ECE',
    shortBio: 'Event Head managing internal paper presentation track submissions, jury defense schedules, and MCU superpower evaluation for SRM VEC / VEC delegates.',
    image: '/assets/team/kanishka.png',
  },
  {
    id: 'eh-02',
    eventId: 'taras-01-ext',
    eventName: 'PAPER-X-VERSE — EXTERNAL',
    eventSlug: 'paper-x-verse-external',
    name: 'ARUN KUMAR N',
    phone: '9962043906',
    email: 'arunkumarak200595@gmail.com',
    linkedin: 'https://www.linkedin.com/in/arun-kumar-a709882b7',
    instagram: 'https://www.instagram.com/_.aruneeyyyyyyyy',
    department: 'Department of ECE',
    shortBio: 'Event Head leading external national delegate paper presentations, abstract screening, and defense proceedings for external delegates.',
    image: '/assets/team/arunkumar.png',
  },
  {
    id: 'eh-03',
    eventId: 'taras-10',
    eventName: "MYSTERIO'S PARADOX",
    eventSlug: 'mysterios-paradox',
    name: 'KAMALES A M',
    phone: '9345376163',
    email: 'amk25amales2006@gmail.com',
    linkedin: 'https://www.linkedin.com/in/amkamales25',
    instagram: 'https://www.instagram.com/_.amk._tanzanite',
    department: 'Department of ECE',
    shortBio: 'Event Head leading the interactive Mystery Box sentence reconstruction and rapid-fire technology illusion competition.',
    image: '/assets/team/kamalesam.jpeg',
  },
  {
    id: 'eh-04',
    eventId: 'taras-08',
    eventName: "KNULL'S VOID",
    eventSlug: 'knulls-void',
    name: 'UTHAYAKUMAR M M',
    phone: '9042461946',
    email: 'udhayakumarmm454@gmail.com',
    linkedin: 'https://www.linkedin.com/in/uthaya20',
    instagram: 'https://www.instagram.com/udhay___03',
    department: 'Department of ECE',
    shortBio: 'Event Head managing Recall Rush electronic component recall and Cup to Core speed logic challenge.',
    image: '/assets/team/udhaya.jpeg',
  },
  {
    id: 'eh-05',
    eventId: 'taras-09',
    eventName: "KINGPIN'S NEXUS",
    eventSlug: 'kingpins-nexus',
    name: 'GURUSATHYAGAN M',
    phone: '9342035854',
    email: 'gurusathyagan19@gmail.com',
    linkedin: 'https://www.linkedin.com/in/guru-sathyagan-8702492b7',
    instagram: 'https://www.instagram.com/mg_guru_07',
    image: '/assets/team/guru.jpeg',
    department: 'Department of ECE',
    shortBio: 'Event Head directing the competitive Cricket Quiz and live player auction squad-building track.',
  },
  {
    id: 'eh-06',
    eventId: 'taras-07',
    eventName: "DOC OCK'S CLUE CARTEL",
    eventSlug: 'doc-ocks-clue-cartel',
    name: 'PAVITHRA K',
    phone: '9344178530',
    email: 'pavithrakannan308@gmail.com',
    linkedin: 'https://www.linkedin.com/in/pavithra-kannan-7247992b5',
    instagram: 'https://www.instagram.com/pavithra_kanan/',
    department: 'Department of ECE',
    shortBio: 'Event Head leading Doc Ock’s Clue Cartel technical bidding, 8-slot wheel challenge, and clue decoding operations.',
    image: '/assets/team/pavithra.jpeg',
  },
];

/**
 * Get Event Head by Event ID
 */
export function getEventHeadForEvent(eventId: string): EventHeadItem | undefined {
  return EVENT_HEADS.find(
    (eh) =>
      eh.eventId === eventId ||
      (eventId === 'taras-01' && eh.eventId === 'taras-01-ext') // Fallback mapping for legacy taras-01
  );
}

/**
 * Get Event Head by Event Name
 */
export function getEventHeadByEventName(eventName: string): EventHeadItem | undefined {
  const norm = eventName.toLowerCase().trim();
  return EVENT_HEADS.find(
    (eh) =>
      eh.eventName.toLowerCase().includes(norm) ||
      norm.includes(eh.eventName.toLowerCase()) ||
      eh.eventSlug.toLowerCase() === norm
  );
}

/**
 * Get Event Head by Email
 */
export function getEventHeadByEmail(email: string): EventHeadItem | undefined {
  return EVENT_HEADS.find((eh) => eh.email.toLowerCase() === email.toLowerCase());
}
