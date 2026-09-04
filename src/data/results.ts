import type { EventResult } from '../types/schedule';

export const MOCK_RESULTS: EventResult[] = [
  {
    id: 'res-01',
    eventId: 'taras-01',
    eventName: 'Paperionix (Paper Presentation)',
    category: 'TECHNICAL',
    winner: {
      name: 'K. Vignesh & Team',
      college: 'College of Engineering, Guindy (CEG)',
      teamName: 'NeuralWave',
    },
    runnerUp: {
      name: 'S. Ananya',
      college: 'SSN College of Engineering',
      teamName: 'QuantumBits',
    },
    specialMention: {
      name: 'R. Manoj',
      college: 'SRM Valliammai Engineering College',
      teamName: 'OptiCircuit',
    },
    publishedAt: '2026-09-26T16:30:00Z',
  },
  {
    id: 'res-02',
    eventId: 'taras-02',
    eventName: 'Circuitrix (Circuit Debugging)',
    category: 'TECHNICAL',
    winner: {
      name: 'P. Rahul & M. Dinesh',
      college: 'PSG College of Technology, Coimbatore',
      teamName: 'DebugSquad',
    },
    runnerUp: {
      name: 'T. Kavitha & G. Swetha',
      college: 'Chennai Institute of Technology',
      teamName: 'Waveform',
    },
    publishedAt: '2026-09-26T16:35:00Z',
  },
  {
    id: 'res-03',
    eventId: 'taras-04',
    eventName: 'CineMatrix (Cine Quiz)',
    category: 'NON-TECHNICAL',
    winner: {
      name: 'A. Joseph & B. Karthik',
      college: 'Loyola College, Chennai',
      teamName: 'FrameRate',
    },
    runnerUp: {
      name: 'S. Nithin & R. Varun',
      college: 'SRM Institute of Science and Technology',
      teamName: 'CinePhiles',
    },
    publishedAt: '2026-09-26T16:45:00Z',
  },
];
