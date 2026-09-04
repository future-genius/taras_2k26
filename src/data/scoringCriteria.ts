import type { ScoreCriterion } from '../types/eventDay';

export const DEFAULT_SCORING_CRITERIA: ScoreCriterion[] = [
  {
    id: 'crit-tech-accuracy',
    name: 'Technical Accuracy & Depth',
    description: 'Precision of technical concepts, correct methodology, and sound theoretical execution.',
    maxScore: 30,
    weight: 0.3,
  },
  {
    id: 'crit-innovation',
    name: 'Innovation & Originality',
    description: 'Novelty of approach, uniqueness of solution, and creative problem solving.',
    maxScore: 25,
    weight: 0.25,
  },
  {
    id: 'crit-presentation',
    name: 'Presentation & Communication',
    description: 'Clarity, slide/demo delivery, confidence, and adherence to time limits.',
    maxScore: 20,
    weight: 0.2,
  },
  {
    id: 'crit-implementation',
    name: 'Implementation & Working Demo',
    description: 'Practical execution, working code/hardware prototype, and defense responses.',
    maxScore: 25,
    weight: 0.25,
  },
];

export const EVENT_SPECIFIC_CRITERIA: Record<string, ScoreCriterion[]> = {
  // Paperionix: Technical Paper Presentation
  'taras-01': [
    {
      id: 'p-depth',
      name: 'Technical Depth & Originality',
      description: 'Originality of research, depth of literature survey, and theoretical novelty.',
      maxScore: 30,
    },
    {
      id: 'p-methodology',
      name: 'Problem Statement & Methodology',
      description: 'Clarity of problem formulation, mathematical models, and methodology.',
      maxScore: 25,
    },
    {
      id: 'p-presentation',
      name: 'Presentation & Slides Design',
      description: 'Adherence to IEEE format, slide quality, verbal clarity, and time management.',
      maxScore: 25,
    },
    {
      id: 'p-defense',
      name: 'Response to Jury Queries & Defense',
      description: 'Mastery of topic during the Q&A cross-examination defense.',
      maxScore: 20,
    },
  ],

  // Circuitrix: Electronic Circuit Debugging
  'taras-02': [
    {
      id: 'c-speed',
      name: 'Fault Identification Speed',
      description: 'Rapid troubleshooting and accurate root-cause fault diagnosis.',
      maxScore: 40,
    },
    {
      id: 'c-accuracy',
      name: 'Waveform & Voltage Accuracy',
      description: 'Precision of output signal on oscilloscope and correct voltage levels.',
      maxScore: 30,
    },
    {
      id: 'c-wiring',
      name: 'Breadboard Assembly & Wiring Neatness',
      description: 'Clean IC placement, proper grounding, and minimal parasitic wiring.',
      maxScore: 20,
    },
    {
      id: 'c-theory',
      name: 'Theoretical Explanation',
      description: 'Understanding of component characteristics and circuit laws.',
      maxScore: 10,
    },
  ],

  // ElectraHack: IoT & AI Sprint
  'taras-03': [
    {
      id: 'e-hardware',
      name: 'Hardware & Sensor Integration',
      description: 'Interfacing microcontrollers (ESP32/Arduino), sensors, and communication modules.',
      maxScore: 35,
    },
    {
      id: 'e-proto',
      name: 'Working Prototype Functionality',
      description: 'Live sensor data transmission, cloud dashboard, and end-to-end functionality.',
      maxScore: 35,
    },
    {
      id: 'e-ux',
      name: 'User Experience & Telemetry',
      description: 'Dashboard clarity, responsive UI, alerts, and analytics.',
      maxScore: 15,
    },
    {
      id: 'e-scale',
      name: 'Scalability & Live Pitch',
      description: 'Commercial viability, power optimization, and pitch defense.',
      maxScore: 15,
    },
  ],

  // CineMatrix: Non-Technical Cine Quiz
  'taras-04': [
    {
      id: 'm-accuracy',
      name: 'Trivia & Frame Accuracy',
      description: 'Correct identification of audio-visual clues, directors, and frame trivia.',
      maxScore: 50,
    },
    {
      id: 'm-buzzer',
      name: 'Buzzer Speed & Rapid Fire',
      description: 'Quick-response reflex and accuracy under timed buzzer rounds.',
      maxScore: 30,
    },
    {
      id: 'm-clues',
      name: 'Clue Connection & Theme Synthesis',
      description: 'Ability to connect subtle cinematic hints and cross-film relationships.',
      maxScore: 20,
    },
  ],

  // Byte Hunt: Cryptic Tech Treasure Hunt
  'taras-05': [
    {
      id: 'b-decrypt',
      name: 'Cipher & Decryption Speed',
      description: 'Speed and accuracy in solving cryptographic campus riddles.',
      maxScore: 40,
    },
    {
      id: 'b-checkpoint',
      name: 'Checkpoint Navigation & Time',
      description: 'Chronological checkpoint scans and total course completion time.',
      maxScore: 35,
    },
    {
      id: 'b-teamwork',
      name: 'Team Strategy & Integrity',
      description: 'Adherence to route rules, collaboration, and fair play.',
      maxScore: 25,
    },
  ],
};

/**
 * Returns the configurable scoring criteria for a specific event.
 * Falls back to category-tailored criteria or default if event not specifically mapped.
 */
export function getEventScoringCriteria(eventId: string, category?: string): ScoreCriterion[] {
  if (EVENT_SPECIFIC_CRITERIA[eventId]) {
    return EVENT_SPECIFIC_CRITERIA[eventId];
  }

  if (category === 'NON-TECHNICAL') {
    return [
      {
        id: 'crit-accuracy',
        name: 'Task Accuracy & Precision',
        description: 'Correctness of answers, execution of non-technical challenge.',
        maxScore: 40,
      },
      {
        id: 'crit-speed',
        name: 'Speed & Time Efficiency',
        description: 'Quick completion of rounds and fast reflex in stage challenges.',
        maxScore: 30,
      },
      {
        id: 'crit-creativity',
        name: 'Creativity & Engagement',
        description: 'Creative delivery, entertainment quotient, and teamwork.',
        maxScore: 30,
      },
    ];
  }

  return DEFAULT_SCORING_CRITERIA;
}
