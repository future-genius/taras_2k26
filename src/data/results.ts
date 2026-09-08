import type { EventResult } from '../types/schedule';

export const MOCK_RESULTS: EventResult[] = [
  {
    id: 'res-01',
    eventId: 'taras-01',
    eventName: 'Paper-X-Verse (MCU-Themed Paper Presentation)',
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


];
