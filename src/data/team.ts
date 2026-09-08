// TARAS 2K26 — Symposium Organisational Team Members

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'FACULTY' | 'STUDENT_LEAD' | 'COORDINATOR' | 'VOLUNTEER' | 'OFFICE_BEARER' | 'EVENT_COORDINATOR' | 'AUTHORITY';
  department?: string;
  designation?: string;
  phone?: string;
  email?: string;
  assignedEventName?: string;
  assignedEventId?: string;
  year?: string;
}

export const MOCK_TEAM: TeamMember[] = [
  // College Authorities
  {
    id: 'auth-01',
    name: 'Dr. B. Chidambararajan',
    role: 'Chief Patron (Director)',
    category: 'AUTHORITY',
    department: 'SRM Valliammai Engineering College',
    designation: 'Director',
  },
  {
    id: 'auth-02',
    name: 'Dr. M. Murugan',
    role: 'Patron (Principal)',
    category: 'AUTHORITY',
    department: 'SRM Valliammai Engineering College',
    designation: 'Principal',
  },

  // Faculty Leadership
  {
    id: 'team-fac-01',
    name: 'Dr. Komala',
    role: 'HOD / Convener',
    category: 'FACULTY',
    department: 'Electronics & Communication Engineering',
    designation: 'Professor & HOD',
    email: 'taras2k26@gmail.com',
  },
  {
    id: 'team-fac-02',
    name: 'Dr. G. Uresh Kumar',
    role: 'Faculty Coordinator',
    category: 'FACULTY',
    department: 'Electronics & Communication Engineering',
    designation: 'Associate Professor',
    email: 'taras2k26@gmail.com',
  },
  {
    id: 'team-fac-03',
    name: 'Dr. C. Amali',
    role: 'Faculty Coordinator',
    category: 'FACULTY',
    department: 'Electronics & Communication Engineering',
    designation: 'Assistant Professor (Sr. G)',
    email: 'taras2k26@gmail.com',
  },

  // Student Office Bearers (Exact Order)
  {
    id: 'team-stud-01',
    name: 'R. Kirthivasan',
    role: 'President',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    phone: '+91 88385 13747',
    email: 'taras2k26@gmail.com',
  },
  {
    id: 'team-stud-02',
    name: 'S. Niveditha',
    role: 'Secretary',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    email: 'taras2k26@gmail.com',
  },
  {
    id: 'team-stud-03',
    name: 'K. Divya',
    role: 'Treasurer',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    email: 'taras2k26@gmail.com',
  },
  {
    id: 'team-stud-04',
    name: 'K. Abhinav',
    role: 'Event Coordinator',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    email: 'taras2k26@gmail.com',
  },
  {
    id: 'team-stud-05',
    name: 'V. Siddharth',
    role: 'Vice President',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    email: 'taras2k26@gmail.com',
  },
  {
    id: 'team-stud-06',
    name: 'M. Gokul',
    role: 'Joint Secretary',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    email: 'taras2k26@gmail.com',
  },
  {
    id: 'team-stud-07',
    name: 'S. Preethi',
    role: 'Joint Treasurer',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    email: 'taras2k26@gmail.com',
  },
  {
    id: 'team-stud-08',
    name: 'R. Vignesh',
    role: 'Joint Event Coordinator',
    category: 'OFFICE_BEARER',
    department: 'ECE - Final Year',
    email: 'taras2k26@gmail.com',
  },
];
