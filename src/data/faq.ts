import type { FAQItem } from '../types/schedule';

export const MOCK_FAQ: FAQItem[] = [
  // General
  {
    id: 'faq-01',
    categoryId: 'cat-general',
    categoryName: 'General',
    question: 'What is TARAS 2K26?',
    answer: 'TARAS 2K26 is the annual national-level technical symposium organized by the Department of Electronics and Communication Engineering at SRM Valliammai Engineering College, Kattankulathur.',
  },
  {
    id: 'faq-02',
    categoryId: 'cat-general',
    categoryName: 'General',
    question: 'When and where will TARAS 2K26 take place?',
    answer: 'TARAS 2K26 will take place on Saturday, 26th September 2026 at the SRM Valliammai Engineering College campus, Kattankulathur, Chengalpattu District.',
  },
  {
    id: 'faq-03',
    categoryId: 'cat-general',
    categoryName: 'General',
    question: 'Who can participate in TARAS 2K26?',
    answer: 'Students currently pursuing B.E., B.Tech, M.E., M.Tech, MCA, or allied diploma courses in recognized colleges are eligible to participate.',
  },

  // Registration
  {
    id: 'faq-04',
    categoryId: 'cat-reg',
    categoryName: 'Registration',
    question: 'How do I register for events?',
    answer: 'Registration can be completed online via this platform. Select your desired events on the Events Hub and proceed with individual or team details.',
  },
  {
    id: 'faq-05',
    categoryId: 'cat-reg',
    categoryName: 'Registration',
    question: 'Will on-spot registration be available on 26th September?',
    answer: 'On-spot registration will be open from 08:00 AM to 09:15 AM at the Ground Floor Registration Desk, subject to seat availability.',
  },
  {
    id: 'faq-06',
    categoryId: 'cat-reg',
    categoryName: 'Registration',
    question: 'How do I get my Digital TARAS Pass?',
    answer: 'Once registered, your Digital TARAS Pass featuring your unique participant QR code will be generated in your dashboard for venue check-in.',
  },

  // Events
  {
    id: 'faq-07',
    categoryId: 'cat-events',
    categoryName: 'Events',
    question: 'Can I participate in both technical and non-technical events?',
    answer: 'Yes! You can participate in multiple events as long as the event schedules do not overlap.',
  },
  {
    id: 'faq-08',
    categoryId: 'cat-events',
    categoryName: 'Events',
    question: 'Is accommodation provided for outstation participants?',
    answer: 'Limited hostel accommodation is available upon prior request during online registration for outstation delegates.',
  },

  // Payment
  {
    id: 'faq-09',
    categoryId: 'cat-pay',
    categoryName: 'Payment',
    question: 'What are the payment options for registration?',
    answer: 'Online payments can be made via UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and Net Banking.',
  },

  // Venue
  {
    id: 'faq-10',
    categoryId: 'cat-venue',
    categoryName: 'Venue',
    question: 'How do I reach the SRM Valliammai campus?',
    answer: 'The campus is located adjacent to Potheri Railway Station (Suburban train line) and GST Road (NH 45), well-connected by MTC buses and trains.',
  },

  // Certificates
  {
    id: 'faq-11',
    categoryId: 'cat-cert',
    categoryName: 'Certificates',
    question: 'How and when will I receive my participation certificate?',
    answer: 'Digital certificates will be activated in your TARAS portal after event completion, provided both Venue Presence and Event Attendance were marked present on-site.',
  },
];
