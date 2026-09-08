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
  // Paper-X-Verse: MCU-Themed Technical Paper Presentation
  'taras-01': [
    {
      id: 'p-content',
      name: 'Content Quality & Technical Depth',
      description: 'Technical accuracy, depth of engineering principles, and clarity of methodology.',
      maxScore: 25,
    },
    {
      id: 'p-innovation',
      name: 'Innovation & Originality',
      description: 'Novelty of idea, unique problem solving approach, and originality.',
      maxScore: 25,
    },
    {
      id: 'p-delivery',
      name: 'Presentation & Delivery Clarity',
      description: 'Slide design quality, verbal delivery confidence, and adherence to 8-minute limit.',
      maxScore: 25,
    },
    {
      id: 'p-mcu',
      name: 'Relevance of MCU Ability Correlation',
      description: 'Mandatory Marvel superpower explanation quality and how well it correlates with the project technology.',
      maxScore: 25,
    },
  ],



  // Doc Ock’s Clue Cartel: Inter-Department Technical Game
  'taras-07': [
    {
      id: 'd-clue-bidding',
      name: 'Round 1 Clue Bidding & Risk Strategy',
      description: 'Efficiency and calculated risk-taking in claiming questions with minimum clues (+50 for 0 clues to +10 for 4).',
      maxScore: 35,
    },
    {
      id: 'd-wheel-accuracy',
      name: 'Round 2 Wheel Category Accuracy',
      description: 'Precision in answering technical, electrical, EV, environmental, aptitude & programming wheel challenges (+15 points).',
      maxScore: 35,
    },
    {
      id: 'd-task-bonus',
      name: 'Task Performance & Bonus Points',
      description: 'Successful completion of task chit challenges (+5 bonus points + category selection advantage).',
      maxScore: 15,
    },
    {
      id: 'd-teamwork',
      name: 'Team Collaboration & Rule Adherence',
      description: 'Communication, strategic coordination, and strict adherence to game rules.',
      maxScore: 15,
    },
  ],

  // Knull’s Void: Fast-Paced ECE Memory & Speed Challenge
  'taras-08': [
    {
      id: 'kv-recall',
      name: 'Round 1: Component Recall Accuracy',
      description: 'Quantity and precision of ECE components recalled from memory (Resistors, ICs, Sensors, etc.).',
      maxScore: 35,
    },
    {
      id: 'kv-speed',
      name: 'Round 2: Cup Pyramid Speed & Recreation',
      description: 'Speed and exactness in recreating the memorized colored cup arrangement.',
      maxScore: 30,
    },
    {
      id: 'kv-tech',
      name: 'Technical Reasoning & Circuit Logic',
      description: 'Accuracy in solving logic-gate circuits, output determination, and ECE quiz questions.',
      maxScore: 25,
    },
    {
      id: 'kv-teamwork',
      name: 'Team Coordination & Time Management',
      description: 'Coordinated execution under pressure and adherence to time limits.',
      maxScore: 10,
    },
  ],

  // Kingpin’s Nexus: Cricket Quiz & Live Player Auction
  'taras-09': [
    {
      id: 'kn-quiz',
      name: 'Cricket Quiz & Connection Accuracy',
      description: 'Depth of cricket trivia, player stats, format rules, and conceptual connection speed.',
      maxScore: 35,
    },
    {
      id: 'kn-budget',
      name: 'Auction Strategy & Budget Management',
      description: 'Tactical bidding psychology, purse allocation, and value-for-money bidding execution.',
      maxScore: 30,
    },
    {
      id: 'kn-squad',
      name: 'Squad Composition & Balance',
      description: 'Balanced roster across batsmen, bowlers, all-rounders, and wicket-keepers.',
      maxScore: 20,
    },
    {
      id: 'kn-decision',
      name: 'Competitive Decision-Making',
      description: 'Rapid analytical thinking, adaptability to changing bidding opportunities, and team coordination.',
      maxScore: 15,
    },
  ],

  // Mysterio’s Paradox: Tech Awareness & Mystery Box Clue Challenge
  'taras-10': [
    {
      id: 'mp-tech',
      name: 'Tech Illusion Awareness & Speed',
      description: 'Rapid-fire technical & technology awareness accuracy across core engineering, IT, AI, and EV concepts.',
      maxScore: 35,
    },
    {
      id: 'mp-reframe',
      name: 'Mystery Box Clue Association & Reframing',
      description: 'Accuracy in extracting balloon word chits and reframing incomplete sentences into technically sound statements.',
      maxScore: 30,
    },
    {
      id: 'mp-logic',
      name: 'Logical Reasoning & Track Selection',
      description: 'Logical association of clues and strategic track choice (Core vs Coding).',
      maxScore: 20,
    },
    {
      id: 'mp-time',
      name: 'Time Efficiency & Accuracy',
      description: 'Overall speed of completing both Mystery Box attempts and time-based tiebreak standing.',
      maxScore: 15,
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
