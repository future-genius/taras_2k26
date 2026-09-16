import * as admin from 'firebase-admin';
import * as fs from 'fs';

const SERVICE_ACCOUNT_PATH = 'c:\\Users\\haran\\Downloads\\taras-2k26-firebase-adminsdk-fbsvc-1eb845732a.json';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function main() {
  console.log('⚡ Provisioning clean staff & admin profiles in Firestore...');

  const now = new Date().toISOString();

  // 1. Registration Desk Officer Demo Account
  await db.collection('participants').doc('0tUe9Zh0qYTzRqznBBKNNVHy3si1').set(
    {
      uid: '0tUe9Zh0qYTzRqznBBKNNVHy3si1',
      participantId: 'TARAS26-STAFF-DEMO',
      fullName: 'Registration Demo Officer',
      email: 'registration.demo@taras2k26.test',
      phone: '+91 98765 00000',
      college: 'Saveetha Engineering College',
      department: 'Electronics and Communication Engineering',
      year: 'IV',
      section: 'Staff',
      role: 'registration_staff',
      qrToken: 'QR-REG-STAFF-DEMO-TOKEN',
      venueCheckIn: true,
      venueCheckInStatus: 'CHECKED_IN',
      venueCheckInTimestamp: now,
      registeredEvents: [],
      teamIds: [],
      attendanceStatus: {},
      shortlistStatus: {},
      certificateStatus: 'READY',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
  console.log('✓ Provisioned registration_staff profile: 0tUe9Zh0qYTzRqznBBKNNVHy3si1');

  // 2. Event Head Demo Account
  await db.collection('participants').doc('zpS8rRnpP3aIu9lxoyoOtzkYYtk2').set(
    {
      uid: 'zpS8rRnpP3aIu9lxoyoOtzkYYtk2',
      participantId: 'TARAS26-EVENTHEAD-DEMO',
      fullName: 'Demo Event Head',
      email: 'eventhead.demo@taras2k26.test',
      phone: '+91 98765 11111',
      college: 'Saveetha Engineering College',
      department: 'Electronics and Communication Engineering',
      year: 'IV',
      section: 'Staff',
      role: 'event_head',
      assignedEventIds: ['taras-01', 'paper-x-verse'],
      qrToken: 'QR-EVENTHEAD-DEMO-TOKEN',
      venueCheckIn: true,
      venueCheckInStatus: 'CHECKED_IN',
      venueCheckInTimestamp: now,
      registeredEvents: [],
      teamIds: [],
      attendanceStatus: {},
      shortlistStatus: {},
      certificateStatus: 'READY',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
  console.log('✓ Provisioned event_head profile: zpS8rRnpP3aIu9lxoyoOtzkYYtk2');

  console.log('🎉 Clean staff profiles provisioned cleanly.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
