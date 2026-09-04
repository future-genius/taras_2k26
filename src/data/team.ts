// Symposium organisational team member (Faculty + Student organisers)
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'FACULTY' | 'STUDENT_LEAD' | 'COORDINATOR' | 'VOLUNTEER' | 'OFFICE_BEARER' | 'EVENT_COORDINATOR';
  department?: string;
  designation?: string;
  phone?: string;
  email?: string;
  assignedEventName?: string;
  assignedEventId?: string;
  year?: string;
}

export const MOCK_TEAM: TeamMember[] = [
  // Faculty Leadership
  {
    id: 'team-fac-01',
    name: 'Dr. Komala',
    role: 'Head of Department (ECE)',
    category: 'FACULTY',
    department: 'Electronics & Communication Engineering',
    designation: 'Professor & HOD',
    email: 'hod.ece@valliammai.edu.in',
  },
  {
    id: 'team-fac-02',
    name: 'Dr. G. Uresh Kumar',
    role: 'Faculty Convener',
    category: 'FACULTY',
    department: 'Electronics & Communication Engineering',
    designation: 'Associate Professor',
    email: 'ureshkumar.ece@valliammai.edu.in',
  },
  {
    id: 'team-fac-03',
    name: 'Dr. C. Amali',
    role: 'Faculty Co-Convener',
    category: 'FACULTY',
    department: 'Electronics & Communication Engineering',
    designation: 'Assistant Professor (Sr. G)',
    email: 'amali.ece@valliammai.edu.in',
  },

  // Student Office Bearers
  {
    id: 'team-stud-01',
    name: 'R. Kirthivasan',
    role: 'President (Student Council)',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    phone: '+91 98401 23456',
    email: 'kirthivasan.taras@valliammai.edu.in',
  },
  {
    id: 'team-stud-02',
    name: 'V. Siddharth',
    role: 'Vice President',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    phone: '+91 97908 11223',
    email: 'siddharth.taras@valliammai.edu.in',
  },
  {
    id: 'team-stud-03',
    name: 'S. Niveditha',
    role: 'Secretary',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    phone: '+91 98402 34567',
    email: 'niveditha.taras@valliammai.edu.in',
  },
  {
    id: 'team-stud-04',
    name: 'K. Abhinav',
    role: 'Technical Lead',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    phone: '+91 99403 88990',
  },

  // Event Heads
  {
    id: 'team-head-01',
    name: 'M. Hariharan',
    role: 'Event Head - CineMatrix',
    category: 'EVENT_COORDINATOR',
    department: 'ECE - 3rd Year',
    assignedEventId: 'taras-04',
    assignedEventName: 'CineMatrix',
    phone: '+91 98845 67890',
  },
  {
    id: 'team-head-02',
    name: 'S. Tharun',
    role: 'Event Head - Byte Hunt',
    category: 'EVENT_COORDINATOR',
    department: 'ECE - 3rd Year',
    assignedEventId: 'taras-05',
    assignedEventName: 'Byte Hunt',
    phone: '+91 97100 54321',
  },
  {
    id: 'team-head-03',
    name: 'A. Dhanush',
    role: 'Event Head - VLSI Workshop',
    category: 'EVENT_COORDINATOR',
    department: 'ECE - 3rd Year',
    assignedEventId: 'taras-06',
    assignedEventName: 'VLSI Masterclass',
    phone: '+91 96001 98765',
  },
];
