import type { TARASEvent } from '../types/event';

export const MOCK_EVENTS: TARASEvent[] = [
  {
    id: 'taras-01-int',
    name: 'PAPER-X-VERSE — INTERNAL',
    slug: 'paper-x-verse-internal',
    shortDescription: 'MCU-Themed Technical Paper Presentation Event for Internal SRM VEC Delegates.',
    theme: 'If your paper’s technology had a MCU ability, how would it use it?',
    category: 'TECHNICAL',
    type: 'TEAM',
    minTeamSize: 1,
    maxTeamSize: 3,
    allowInternal: true,
    allowExternal: false,
    duration: '10 Mins Total (8 Mins Presentation + 2 Mins Q&A)',
    venue: 'Venue details will be updated later.',
    schedule: '10 Oct 2026, 10:00 AM IST',
    eligibility: ['Open only to eligible internal students of SRM Valliammai Engineering College.'],
    about: 'Paper-X-Verse Internal is the flagship MCU-themed paper presentation event reserved exclusively for SRM Valliammai Engineering College students across all departments. Present your research and end with a mandatory MCU superpower correlation explaining what the superpower means and how it applies to your technical project.',
    rounds: [
      {
        number: 1,
        name: 'Abstract Submission',
        description: 'Online submission of paper abstract before deadline.',
        duration: 'Pre-event screening',
        venue: 'Venue details will be updated later.',
      },
      {
        number: 2,
        name: 'Main Presentation & MCU Defense',
        description: '8-minute technical slide presentation concluding with mandatory MCU ability correlation, followed by 2-minute jury Q&A defense.',
        duration: '10 Mins per Team (8 Min Talk + 2 Min Q&A)',
        venue: 'Venue details will be updated later.',
        time: '10:00 AM',
      },
    ],
    rules: [
      'Reserved strictly for internal SRM VEC / VEC students.',
      'Team size: 1 to 3 members.',
      'Open to all engineering and science domains (ECE, EEE, CSE, IT, AI, Cyber, Mechanical, Civil, etc.).',
      '8 minutes presentation + 2 minutes Q&A.',
      'MANDATORY MCU THEME: Conclude presentation with an MCU Superpower Explanation.',
      'Plagiarism is strictly prohibited.',
    ],
    evaluationCriteria: [
      'Technical Depth & Quality',
      'Innovation & Originality',
      'Presentation Delivery',
      'MCU Ability Correlation & Defense',
    ],
    requirements: ['Presentation Slides (.pptx / .pdf)', 'Abstract Copy', 'College ID Card'],
    prizes: [
      { position: '1st', amount: '₹ 1,000', perks: ['Trophy', 'Merit Certificate', 'Paper-X-Verse Internal Champion Shield'] },
      { position: '2nd', amount: '₹ 750', perks: ['Runner Up Shield', 'Merit Certificate'] },
      { position: '3rd', amount: '₹ 500', perks: ['Merit Certificate'] },
    ],
    coordinators: [
      { name: 'KANISHKA M', role: 'Event Head', phone: '8838513747', email: 'kanishksudha631@gmail.com' },
    ],
    eventHead: {
      name: 'KANISHKA M',
      phone: '8838513747',
      email: 'kanishksudha631@gmail.com',
      linkedin: 'https://www.linkedin.com/in/kanishka-mohan-vengadesh-336a812b6',
      instagram: 'https://www.instagram.com/_s_assy_04',
      image: '/assets/team/kanishka.png',
    },
    faq: [
      { question: 'Who can register for Paper-X-Verse Internal?', answer: 'Only internal students belonging to SRM Valliammai Engineering College (VEC / SRM VEC).' },
      { question: 'Is there a registration fee for internal delegates?', answer: 'No, registration for Paper-X-Verse Internal is completely free for internal SRM VEC delegates.' },
    ],
    status: 'REGISTRATION_OPEN',
    registrationFee: 'Free (Internal Students Only)',
  },

  {
    id: 'taras-01-ext',
    name: 'PAPER-X-VERSE — EXTERNAL',
    slug: 'paper-x-verse-external',
    shortDescription: 'National MCU-Themed Technical Paper Presentation Event for External College Delegates.',
    theme: 'If your paper’s technology had a MCU ability, how would it use it?',
    category: 'TECHNICAL',
    type: 'TEAM',
    minTeamSize: 1,
    maxTeamSize: 3,
    allowInternal: false,
    allowExternal: true,
    duration: '10 Mins Total (8 Mins Presentation + 2 Mins Q&A)',
    venue: 'Venue details will be updated later.',
    schedule: '10 Oct 2026, 10:00 AM IST',
    eligibility: ['All External UG & PG Engineering, Science & Technology Students across India'],
    about: 'Paper-X-Verse External is the flagship national-level paper presentation track for delegates from participating institutions across the country. Teams present technical papers concluding with an MCU superpower correlation.',
    rounds: [
      {
        number: 1,
        name: 'Abstract Screening',
        description: 'Submission of project abstract before the official deadline.',
        duration: 'Pre-event screening',
        venue: 'Venue details will be updated later.',
      },
      {
        number: 2,
        name: 'Main Presentation & MCU Defense',
        description: '8-minute technical slide presentation concluding with mandatory MCU ability correlation, followed by 2-minute Q&A jury defense.',
        duration: '10 Mins per Team (8 Min Talk + 2 Min Q&A)',
        venue: 'Venue details will be updated later.',
        time: '10:00 AM',
      },
    ],
    rules: [
      'Open to all registered external UG & PG students across engineering, science, and technology domains.',
      'Team size: 1 to 3 members.',
      'Presentation duration: 8 minutes talk + 2 minutes Q&A.',
      'MANDATORY MCU THEME: Conclude presentation with MCU superpower explanation.',
      'Plagiarism is strictly prohibited.',
    ],
    evaluationCriteria: [
      'Technical Depth & Innovation',
      'Originality & Relevance',
      'Presentation Clarity',
      'MCU Superpower Correlation',
    ],
    requirements: ['Presentation Slides (.pptx / .pdf)', 'Abstract Copy', 'College ID Card'],
    prizes: [
      { position: '1st', amount: '₹ 1,500', perks: ['Trophy', 'Merit Certificate', 'Paper-X-Verse National Champion Shield'] },
      { position: '2nd', amount: '₹ 1,250', perks: ['Runner Up Shield', 'Merit Certificate'] },
      { position: '3rd', amount: '₹ 1,000', perks: ['Merit Certificate'] },
    ],
    coordinators: [
      { name: 'ARUN KUMAR N', role: 'Event Head', phone: '9962043906', email: 'arunkumarak200595@gmail.com' },
    ],
    eventHead: {
      name: 'ARUN KUMAR N',
      phone: '9962043906',
      email: 'arunkumarak200595@gmail.com',
      linkedin: 'https://www.linkedin.com/in/arun-kumar-a709882b7',
      instagram: 'https://www.instagram.com/_.aruneeyyyyyyyy',
      image: '/assets/team/arunkumar.png',
    },
    faq: [
      { question: 'Who can register for Paper-X-Verse External?', answer: 'All external delegates from engineering, science, and technology institutions outside SRM VEC.' },
      { question: 'What is the registration fee for external delegates?', answer: '₹ 200 per participant.' },
    ],
    status: 'REGISTRATION_OPEN',
    registrationFee: '₹ 200 per participant',
  },

  {
    id: 'taras-07',
    name: 'DOC OCK’S CLUE CARTEL',
    slug: 'doc-ocks-clue-cartel',
    shortDescription: 'Inter-Department Technical Game combining engineering knowledge, strategy, logic, and bidding.',
    theme: 'Crack the code, outsmart the cartel!',
    category: 'TECHNICAL',
    type: 'TEAM',
    minTeamSize: 3,
    maxTeamSize: 4,
    allowInternal: false,
    allowExternal: true,
    duration: '3 Hours',
    venue: 'Venue details will be updated later.',
    schedule: '10 Oct 2026, 10:30 AM IST',
    eligibility: ['External Only — Open to external delegates across all engineering & technology departments'],
    about: 'Doc Ock’s Clue Cartel is a thrilling inter-department technical game that combines engineering knowledge, strategy, logical thinking, problem-solving, and teamwork. Across two challenging rounds, teams will bid for clues, solve technical questions, spin the 8-slot wheel, tackle surprise tasks, and compete across multiple engineering categories.',
    rounds: [
      {
        number: 1,
        name: 'Round 1: Clue & Claim',
        description: 'Teams bid on how few clues they need to solve technical questions.',
        duration: '1.25 Hours',
        venue: 'Venue details will be updated later.',
        time: '10:30 AM',
      },
      {
        number: 2,
        name: 'Round 2: Spin the Wheel',
        description: 'Teams spin an 8-slot wheel covering technical categories and surprise task slots.',
        duration: '1.75 Hours',
        venue: 'Venue details will be updated later.',
        time: '11:45 AM',
      },
    ],
    rules: [
      'External participants ONLY.',
      'Each team must consist of 3–4 participants.',
      'Lowest clue bid gets first chance to answer.',
      'Wrong answers carry negative marks (-5 points).',
      'The decision of event coordinators is final.',
    ],
    evaluationCriteria: [
      'Cumulative Score Across Both Rounds',
      'Clue Bidding Strategy',
      'Technical Accuracy',
    ],
    requirements: ['Stationery (Pens, Scratch Pad)', 'ID Card'],
    prizes: [
      { position: '1st', amount: '₹ 1,000', perks: ['Cartel Champion Trophy', 'Merit Certificate'] },
      { position: '2nd', amount: '₹ 750', perks: ['Runner Up Shield', 'Merit Certificate'] },
    ],
    coordinators: [
      { name: 'PAVITHRA K', role: 'Event Head', phone: '9344178530', email: 'pavithrakannan308@gmail.com' },
    ],
    eventHead: {
      name: 'PAVITHRA K',
      phone: '9344178530',
      email: 'pavithrakannan308@gmail.com',
      linkedin: 'https://www.linkedin.com/in/pavithra-kannan-7247992b5',
      instagram: 'https://www.instagram.com/pavithra_kanan/',
      image: '/assets/team/pavithra.jpeg',
    },
    faq: [
      { question: 'What is the team size?', answer: 'Each team must consist of 3 to 4 participants.' },
      { question: 'Are internal VEC students allowed?', answer: 'No, this event is reserved exclusively for external participants.' },
    ],
    status: 'REGISTRATION_OPEN',
    registrationFee: '₹ 200 per participant',
  },

  {
    id: 'taras-08',
    name: 'KNULL’S VOID',
    slug: 'knulls-void',
    shortDescription: 'Fast-paced team challenge testing memory, observation, speed, coordination, and ECE technical reasoning.',
    theme: 'Enter the Void. Unleash the Power.',
    category: 'TECHNICAL',
    type: 'TEAM',
    minTeamSize: 2,
    maxTeamSize: 3,
    allowInternal: false,
    allowExternal: true,
    duration: '2.5 Hours',
    venue: 'Venue details will be updated later.',
    schedule: '10 Oct 2026, 11:30 AM IST',
    eligibility: ['External Only — Open to external registered college & engineering delegates'],
    about: 'KNULL’S VOID is an exciting, fast-paced team event designed to test participants’ memory, observation, speed, coordination, decision-making, and technical reasoning through electronic component recall and Cup to Core speed logic challenges.',
    rounds: [
      {
        number: 1,
        name: 'Round 1: Recall Rush',
        description: 'Memory and observation challenge observing displayed electronic components.',
        duration: '45 Mins',
        venue: 'Venue details will be updated later.',
        time: '11:30 AM',
      },
      {
        number: 2,
        name: 'Round 2: Cup to Core',
        description: 'Recreating memorized colored cup pyramids paired with ECE logic questions.',
        duration: '1.5 Hours',
        venue: 'Venue details will be updated later.',
        time: '12:30 PM',
      },
    ],
    rules: [
      'External participants ONLY.',
      'Teams of 2–3 members.',
      'Recall Rush: observe and recall components within allotted time.',
      'Cup to Core: speed pyramid construction gives first chance to answer logic-gate questions.',
    ],
    evaluationCriteria: [
      'Component Recall Accuracy',
      'Pyramid Speed & Precision',
      'Logic Gate Circuit Reasoning',
    ],
    requirements: ['Stationery', 'College ID Card'],
    prizes: [
      { position: '1st', amount: '₹ 1,000', perks: ['Void Champion Shield', 'Merit Certificate'] },
      { position: '2nd', amount: '₹ 750', perks: ['Runner Up Shield', 'Merit Certificate'] },
    ],
    coordinators: [
      { name: 'UTHAYAKUMAR M M', role: 'Event Head', phone: '9042461946', email: 'udhayakumarmm454@gmail.com' },
    ],
    eventHead: {
      name: 'UTHAYAKUMAR M M',
      phone: '9042461946',
      email: 'udhayakumarmm454@gmail.com',
      linkedin: 'https://www.linkedin.com/in/uthaya20',
      instagram: 'https://www.instagram.com/udhay___03',
      image: '/assets/team/udhaya.jpeg',
    },
    faq: [
      { question: 'What is the team size requirement?', answer: 'Teams can consist of 2 to 3 members.' },
      { question: 'Are internal VEC students allowed?', answer: 'No, this event is reserved exclusively for external participants.' },
    ],
    status: 'REGISTRATION_OPEN',
    registrationFee: '₹ 200 per participant',
  },

  {
    id: 'taras-09',
    name: 'KINGPIN’S NEXUS',
    slug: 'kingpins-nexus',
    shortDescription: 'Competitive Cricket Quiz, Conceptual Connections & Live Player Auction Challenge.',
    theme: 'One Auction. Many Players. One Master.',
    category: 'NON-TECHNICAL',
    type: 'TEAM',
    minTeamSize: 2,
    maxTeamSize: 4,
    allowInternal: false,
    allowExternal: true,
    duration: '2.5 Hours',
    venue: 'Venue details will be updated later.',
    schedule: '10 Oct 2026, 11:00 AM IST',
    eligibility: ['External Only — Open to external cricket enthusiasts and delegates'],
    about: 'KINGPIN’S NEXUS is a two-round competitive cricket event combining knowledge, strategy, conceptual connections, and live auction excitement. Qualifiers move to a high-stakes live player auction to assemble a balanced squad within fixed budget limits.',
    rounds: [
      {
        number: 1,
        name: 'Round 1: Quiz + Connection',
        description: 'Elimination round testing deep cricket stats, rules, and conceptual connections.',
        duration: '45 Mins',
        venue: 'Venue details will be updated later.',
        time: '11:00 AM',
      },
      {
        number: 2,
        name: 'Round 2: Live Player Auction',
        description: 'Live auction bidding challenge managing fixed budget to build a balanced squad.',
        duration: '1.5 Hours',
        venue: 'Venue details will be updated later.',
        time: '12:00 PM',
      },
    ],
    rules: [
      'External participants ONLY.',
      'Teams of 2–4 members.',
      'Round 1 is an elimination cricket quiz and connection round.',
      'Top teams advance to live budget bidding in Round 2.',
      'Evaluation rewards squad composition and tactical budget allocation.',
    ],
    evaluationCriteria: [
      'Cricket Knowledge & Connection Accuracy',
      'Auction Bidding Strategy',
      'Overall Squad Balance',
    ],
    requirements: ['Stationery', 'College ID Card'],
    prizes: [
      { position: '1st', amount: '₹ 1,000', perks: ['Kingpin Nexus Champion Trophy', 'Merit Certificate'] },
      { position: '2nd', amount: '₹ 750', perks: ['Runner Up Shield', 'Merit Certificate'] },
    ],
    coordinators: [
      { name: 'GURUSATHYAGAN M', role: 'Event Head', phone: '9342035854', email: 'gurusathyagan19@gmail.com' },
    ],
    eventHead: {
      name: 'GURUSATHYAGAN M',
      phone: '9342035854',
      email: 'gurusathyagan19@gmail.com',
      linkedin: 'https://www.linkedin.com/in/guru-sathyagan-8702492b7',
      instagram: 'https://www.instagram.com/mg_guru_07',
      image: '/assets/team/guru.jpeg',
    },
    faq: [
      { question: 'What is the structure of Kingpin’s Nexus?', answer: 'Round 1 Quiz/Connections followed by Round 2 Live Player Auction.' },
      { question: 'Are internal VEC students allowed?', answer: 'No, this event is reserved exclusively for external participants.' },
    ],
    status: 'REGISTRATION_OPEN',
    registrationFee: '₹ 200 per participant',
  },

  {
    id: 'taras-10',
    name: 'MYSTERIO’S PARADOX',
    slug: 'mysterios-paradox',
    shortDescription: 'Interactive Clue & Mystery Box Technical Challenge.',
    theme: 'Pick. Connect. Conquer.',
    category: 'TECHNICAL',
    type: 'TEAM',
    minTeamSize: 2,
    maxTeamSize: 3,
    allowInternal: false,
    allowExternal: true,
    duration: '2.5 Hours',
    venue: 'Venue details will be updated later.',
    schedule: '10 Oct 2026, 11:30 AM IST',
    eligibility: ['External Only — Open to external engineering, technology, and science delegates'],
    about: 'MYSTERIO’S PARADOX is a two-round technical challenge testing awareness and observation. Round 1 rapid fire leads to Round 2 Mystery Box where teams burst balloons to reveal word chits and reframe technical statements accurately.',
    rounds: [
      {
        number: 1,
        name: 'Round 1: Tech Illusion',
        description: 'Rapid-fire quiz testing tech awareness across AI, IoT, robotics, and core engineering.',
        duration: '45 Mins',
        venue: 'Venue details will be updated later.',
        time: '11:30 AM',
      },
      {
        number: 2,
        name: 'Round 2: Mystery Box',
        description: 'Balloon bursting clue retrieval and technical sentence reconstruction.',
        duration: '1.5 Hours',
        venue: 'Venue details will be updated later.',
        time: '12:30 PM',
      },
    ],
    rules: [
      'External participants ONLY.',
      'Teams of 2–3 members.',
      'Round 1 rapid-fire tech quiz leads to Round 2 Mystery Box.',
      'Teams select Core or Coding track in Round 2.',
      'Contestants burst 3 balloons to reconstruct incomplete technical sentence.',
    ],
    evaluationCriteria: [
      'Tech Awareness Precision',
      'Sentence Reconstruction Accuracy',
      'Completion Speed',
    ],
    requirements: ['Stationery', 'College ID Card'],
    prizes: [
      { position: '1st', amount: '₹ 1,000', perks: ['Paradox Champion Trophy', 'Merit Certificate'] },
      { position: '2nd', amount: '₹ 750', perks: ['Runner Up Shield', 'Merit Certificate'] },
    ],
    coordinators: [
      { name: 'KAMALES A M', role: 'Event Head', phone: '9345376163', email: 'amk25amales2006@gmail.com' },
    ],
    eventHead: {
      name: 'KAMALES A M',
      phone: '9345376163',
      email: 'amk25amales2006@gmail.com',
      linkedin: 'https://www.linkedin.com/in/amkamales25',
      instagram: 'https://www.instagram.com/_.amk._tanzanite',
      image: '/assets/team/kamalesam.jpeg',
    },
    faq: [
      { question: 'What tracks are in Round 2?', answer: 'Core track and Coding track.' },
      { question: 'Are internal VEC students allowed?', answer: 'No, this event is reserved exclusively for external participants.' },
    ],
    status: 'REGISTRATION_OPEN',
    registrationFee: '₹ 200 per participant',
  },
];

/**
 * Get Event by ID with alias fallback support (e.g. taras-01 -> taras-01-ext)
 */
export function getEventById(id: string): TARASEvent | undefined {
  if (id === 'taras-01') {
    return MOCK_EVENTS.find((e) => e.id === 'taras-01-ext') || MOCK_EVENTS[0];
  }
  return MOCK_EVENTS.find((e) => e.id === id);
}

/**
 * Get Event by Slug with alias fallback
 */
export function getEventBySlug(slug: string): TARASEvent | undefined {
  const norm = slug.toLowerCase().trim();
  if (norm === 'paper-x-verse' || norm === 'paper-x-verse-external') {
    return MOCK_EVENTS.find((e) => e.id === 'taras-01-ext') || MOCK_EVENTS[0];
  }
  if (norm === 'paper-x-verse-internal') {
    return MOCK_EVENTS.find((e) => e.id === 'taras-01-int') || MOCK_EVENTS[0];
  }
  if (norm === 'mysterios-paradox' || norm === 'mysterio-paradox') {
    return MOCK_EVENTS.find((e) => e.id === 'taras-10');
  }
  if (norm === 'knulls-void' || norm === 'knull-void') {
    return MOCK_EVENTS.find((e) => e.id === 'taras-08');
  }
  if (norm === 'kingpins-nexus' || norm === 'kingpin-nexus') {
    return MOCK_EVENTS.find((e) => e.id === 'taras-09');
  }
  if (norm === 'doc-ocks-clue-cartel' || norm === 'doc-ock-clue-cartel' || norm === 'doc-ocs-clue-cartel' || norm === 'doc-oc-clue-cartel') {
    return MOCK_EVENTS.find((e) => e.id === 'taras-07');
  }
  return MOCK_EVENTS.find((e) => e.slug === slug || e.id === slug);
}
