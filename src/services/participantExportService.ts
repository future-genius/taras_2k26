import * as XLSX from 'xlsx';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { ParticipantProfile } from '../types/participant';
import type { EventRegistration } from '../types/registration';
import type { EventTeam } from '../types/team';
import { MOCK_EVENTS } from '../data/events';

export interface ExportMetadata {
  exportId: string;
  generatedAt: string;
  generatedBy: string;
  generatedByUid: string;
  generatedByRole: string;
  format: 'xlsx' | 'csv';
  recordCount: number;
  fileName: string;
}

const ALLOWED_EXPORT_ROLES = new Set([
  'super_admin',
  'SUPER_ADMIN',
  'president',
  'PRESIDENT',
  'admin',
  'ADMIN',
  'staff',
  'STAFF',
  'registration_staff',
  'REGISTRATION_STAFF',
  'registration_team',
  'REGISTRATION_TEAM',
]);

/**
 * Validates that the caller is authorized to export complete participant data.
 * Throws an explicit error if unauthorized (e.g. ordinary participant or coordinator).
 */
export function verifyExportAuthorization(profile: ParticipantProfile | null | undefined): void {
  if (!profile || !profile.role) {
    throw new Error('ACCESS_DENIED: Unauthenticated or missing user profile for data export.');
  }
  const normRole = profile.role.toString().trim();
  if (!ALLOWED_EXPORT_ROLES.has(normRole)) {
    throw new Error(`ACCESS_DENIED: User role "${normRole}" is not authorized to access complete participant exports.`);
  }
}

/**
 * Auto-fits Excel column widths based on cell content length
 */
function autofitColumns(ws: XLSX.WorkSheet, rows: (string | number)[][]): void {
  if (rows.length === 0) return;
  const colWidths = rows[0].map((_, colIdx) => {
    let maxLen = 12;
    rows.forEach((row) => {
      const val = row[colIdx];
      if (val !== undefined && val !== null) {
        const len = String(val).length;
        if (len > maxLen) maxLen = len;
      }
    });
    return { wch: Math.min(maxLen + 4, 60) };
  });

  ws['!cols'] = colWidths;
}

/**
 * Safe CSV field escaping for UTF-8 compatibility
 */
function escapeCsvCell(cellVal: any): string {
  if (cellVal === null || cellVal === undefined) return '""';
  const str = String(cellVal).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Fetches current canonical data from Firestore and exports Excel / CSV files.
 */
export async function generateParticipantExport(
  callerProfile: ParticipantProfile,
  format: 'xlsx' | 'csv'
): Promise<{ fileName: string; recordCount: number }> {
  // 1. Enforce RBAC
  verifyExportAuthorization(callerProfile);

  // 2. Fetch canonical collections from Firestore
  const [
    participantsSnap,
    registrationsSnap,
    teamsSnap,
    checkinsSnap,
    r1Snap,
    r2Snap,
    eventsSnap,
  ] = await Promise.all([
    getDocs(collection(firestore, 'participants')),
    getDocs(collection(firestore, 'registrations')),
    getDocs(collection(firestore, 'teams')),
    getDocs(collection(firestore, 'event_checkins')),
    getDocs(collection(firestore, 'round1_results')),
    getDocs(collection(firestore, 'round2_results')),
    getDocs(collection(firestore, 'events')),
  ]);

  const participantsList: ParticipantProfile[] = [];
  participantsSnap.forEach((d) => participantsList.push({ uid: d.id, ...d.data() } as ParticipantProfile));

  const registrationsList: EventRegistration[] = [];
  registrationsSnap.forEach((d) => registrationsList.push({ registrationId: d.id, ...d.data() } as EventRegistration));

  const teamsList: EventTeam[] = [];
  teamsSnap.forEach((d) => teamsList.push({ teamId: d.id, ...d.data() } as EventTeam));

  const checkinsList: any[] = [];
  checkinsSnap.forEach((d) => checkinsList.push({ id: d.id, ...d.data() }));

  const r1ResultsList: any[] = [];
  r1Snap.forEach((d) => r1ResultsList.push({ id: d.id, ...d.data() }));

  const r2ResultsList: any[] = [];
  r2Snap.forEach((d) => r2ResultsList.push({ id: d.id, ...d.data() }));

  const eventsList: any[] = [];
  eventsSnap.forEach((d) => eventsList.push({ id: d.id, ...d.data() }));

  // ── PARTICIPANT FILTER ────────────────────────────────────────────────────
  // The `participants` Firestore collection stores ALL user profiles, including
  // staff, coordinators, event heads, registration team, president, and admin.
  // Only records with role 'participant' or 'PARTICIPANT' are genuine registrants.
  // All other roles (super_admin, admin, staff, registration_staff, coordinator,
  // PRESIDENT, REGISTRATION_TEAM, EVENT_HEAD) are system/staff identities and
  // must NOT appear in the participant Excel export.
  // This filter is read-only — it does NOT modify or delete any Firestore data.
  const PARTICIPANT_ROLES = new Set(['participant', 'PARTICIPANT']);
  const exportParticipantsList = participantsList.filter(
    (p) => PARTICIPANT_ROLES.has(p.role)
  );
  // ─────────────────────────────────────────────────────────────────────────

  // Build Lookup Maps
  const participantMap = new Map<string, ParticipantProfile>();
  exportParticipantsList.forEach((p) => {
    if (p.uid) participantMap.set(p.uid, p);
  });

  const teamMap = new Map<string, EventTeam>();
  teamsList.forEach((t) => {
    if (t.teamId) teamMap.set(t.teamId, t);
  });

  const checkinMap = new Map<string, any>();
  checkinsList.forEach((c) => {
    if (c.participantUid) checkinMap.set(c.participantUid, c);
    if (c.uid) checkinMap.set(c.uid, c);
    if (c.teamId) checkinMap.set(c.teamId, c);
  });

  const r1Map = new Map<string, any>();
  r1ResultsList.forEach((r) => {
    if (r.teamId) r1Map.set(r.teamId, r);
    if (r.participantUid) r1Map.set(r.participantUid, r);
  });

  const r2Map = new Map<string, any>();
  r2ResultsList.forEach((r) => {
    if (r.teamId) r2Map.set(r.teamId, r);
    if (r.participantUid) r2Map.set(r.participantUid, r);
  });


  const dateTag = new Date().toISOString().split('T')[0];
  const timeTag = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  const fileName = `TARAS2K26_Participant_Export_${dateTag}_${timeTag}.${format}`;

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();

    // ─────────────────────────────────────────────────────────────────────────
    // SHEET 1: PARTICIPANT DETAILS
    // ─────────────────────────────────────────────────────────────────────────
    const sheet1Headers = [
      'S.No',
      'Participant ID',
      'Registration ID',
      'Registration Number',
      'Participant Name',
      'Email',
      'Phone',
      'College',
      'Department',
      'Year',
      'Section',
      'Event Name',
      'Registration Status',
      'Payment Status',
      'Payment Verification Status',
      'Transaction ID / UTR',
      'Transaction Date',
      'Bank Name',
      'Registration Date',
      'Gate Entry Status',
      'Gate Entry Time',
    ];

    const sheet1Rows: (string | number)[][] = [sheet1Headers];
    let partSNo = 1;

    exportParticipantsList.forEach((p) => {
      const pRegs = registrationsList.filter((r) => r.uid === p.uid || r.participantId === p.participantId);
      const gateCheck = checkinMap.get(p.uid);
      const isGateCheckedIn = p.venueCheckIn || gateCheck?.status === 'CHECKED_IN' || !!gateCheck;
      const gateTime = p.venueCheckInTimestamp || gateCheck?.timestamp || gateCheck?.scannedAt || (isGateCheckedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN');

      if (pRegs.length > 0) {
        pRegs.forEach((r) => {
          sheet1Rows.push([
            partSNo++,
            p.participantId || p.uid || 'N/A',
            r.registrationId || 'N/A',
            p.registrationNumber || 'N/A',
            p.fullName || 'N/A',
            p.email || 'N/A',
            p.phone || 'N/A',
            p.college || 'N/A',
            p.department || 'ECE',
            p.year || 'IV',
            p.section || 'A',
            r.eventName || 'N/A',
            r.status || 'CONFIRMED',
            r.paymentStatus || 'VERIFIED',
            r.paymentStatus || 'VERIFIED',
            r.utrNumber || 'N/A',
            r.transactionDate || (r as any).paymentProof?.transactionDate || 'N/A',
            r.bankName || (r as any).paymentProof?.bankName || 'N/A',
            r.registeredAt || (r as any).createdAt || 'N/A',
            isGateCheckedIn ? 'Checked In' : 'Not Checked In',
            gateTime,
          ]);
        });
      } else {
        sheet1Rows.push([
          partSNo++,
          p.participantId || p.uid || 'N/A',
          'N/A',
          p.registrationNumber || 'N/A',
          p.fullName || 'N/A',
          p.email || 'N/A',
          p.phone || 'N/A',
          p.college || 'N/A',
          p.department || 'ECE',
          p.year || 'IV',
          p.section || 'A',
          'N/A',
          'REGISTERED',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          isGateCheckedIn ? 'Checked In' : 'Not Checked In',
          gateTime,
        ]);
      }
    });

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
    autofitColumns(ws1, sheet1Rows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Participant Details');

    // ─────────────────────────────────────────────────────────────────────────
    // SHEET 2: TEAM DETAILS
    // ─────────────────────────────────────────────────────────────────────────
    const sheet2Headers = [
      'S.No',
      'Team ID',
      'Team Name',
      'Event Name',
      'Team Leader',
      'Team Leader Reg No',
      'Member Count',
      'Member 1 Name',
      'Member 2 Name',
      'Member 3 Name',
      'Member 4 Name',
      'Team Status',
      'Gate Entry Status',
      'Round 1 Status',
      'Round 1 Result',
      'Round 2 Status',
      'Final Result',
    ];

    const sheet2Rows: (string | number)[][] = [sheet2Headers];
    let teamSNo = 1;

    teamsList.forEach((t) => {
      const leader = participantMap.get(t.leaderUid);
      const r1Res = r1Map.get(t.teamId);
      const r2Res = r2Map.get(t.teamId);
      const tCheck = checkinMap.get(t.teamId);

      const isGate = tCheck || (t.memberUids || []).some((mUid) => checkinMap.has(mUid));
      const r1Status = r1Res ? 'Scanned' : 'Not Scanned';
      const r1Outcome = r1Res?.result || 'PENDING';
      const r2Status = r2Res ? 'Scanned' : 'Not Scanned';
      const r2Outcome = r2Res?.result || 'PENDING';

      // Resolve member names: leader first, then remaining members in array order
      const memberUids = t.memberUids || [];
      const leaderUid = t.leaderUid;
      const orderedUids = [
        leaderUid,
        ...memberUids.filter((uid) => uid !== leaderUid),
      ];
      const memberNames = orderedUids.map((uid) => participantMap.get(uid)?.fullName || '');

      sheet2Rows.push([
        teamSNo++,
        t.teamId,
        t.teamName,
        t.registeredEventName || t.eventName || 'N/A',
        leader?.fullName || t.leaderName || 'N/A',
        leader?.registrationNumber || 'N/A',
        t.memberCount || (t.memberUids || []).length,
        memberNames[0] || '',
        memberNames[1] || '',
        memberNames[2] || '',
        memberNames[3] || '',
        t.status || 'ACTIVE',
        isGate ? 'Checked In' : 'Not Checked In',
        r1Status,
        r1Outcome,
        r2Status,
        r2Outcome,
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
    autofitColumns(ws2, sheet2Rows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Team Details');

    // ─────────────────────────────────────────────────────────────────────────
    // SHEET 3: TEAM MEMBERS
    // ─────────────────────────────────────────────────────────────────────────
    const sheet3Headers = [
      'Team ID',
      'Team Name',
      'Event Name',
      'Member Name',
      'Registration Number',
      'Email',
      'Phone',
      'College',
      'Role in Team',
    ];

    const sheet3Rows: (string | number)[][] = [sheet3Headers];

    teamsList.forEach((t) => {
      const memberUids = t.memberUids || [];
      memberUids.forEach((mUid) => {
        const mProfile = participantMap.get(mUid);
        const isLeader = mUid === t.leaderUid;
        sheet3Rows.push([
          t.teamId,
          t.teamName,
          t.registeredEventName || t.eventName || 'N/A',
          mProfile?.fullName || 'N/A',
          mProfile?.registrationNumber || 'N/A',
          mProfile?.email || 'N/A',
          mProfile?.phone || 'N/A',
          mProfile?.college || 'N/A',
          isLeader ? 'Leader' : 'Member',
        ]);
      });
    });

    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Rows);
    autofitColumns(ws3, sheet3Rows);
    XLSX.utils.book_append_sheet(wb, ws3, 'Team Members');

    // ─────────────────────────────────────────────────────────────────────────
    // SHEET 4: EVENT SUMMARY
    // Uses MOCK_EVENTS — the canonical TARAS 2K26 event list used across the website.
    // ─────────────────────────────────────────────────────────────────────────
    const sheet4Headers = [
      'Event Name',
      'Total Registrations',
      'Confirmed',
      'Payment Verified',
      'Gate Checked-In',
      'Round 1 Participants',
      'Round 1 Selected',
      'Round 2 Participants',
      'Final Results',
    ];

    const sheet4Rows: (string | number)[][] = [sheet4Headers];

    MOCK_EVENTS.forEach((e) => {
      const eRegs = registrationsList.filter((r) => r.eventId === e.id || r.eventName === e.name);
      const eCheckins = checkinsList.filter((c) => c.eventId === e.id);
      const eR1 = r1ResultsList.filter((r) => r.eventId === e.id);
      const eR1Selected = eR1.filter((r) => r.result === 'SELECTED');
      const eR2 = r2ResultsList.filter((r) => r.eventId === e.id);
      const eFinals = eR2.filter((r) => r.result === 'WINNER' || r.result === 'RUNNER_UP' || r.result === 'SPECIAL_MENTION');

      sheet4Rows.push([
        e.name,
        eRegs.length,
        eRegs.filter((r) => r.status === 'CONFIRMED').length,
        eRegs.filter((r) => r.paymentStatus === 'VERIFIED').length,
        eCheckins.length,
        eR1.length,
        eR1Selected.length,
        eR2.length,
        eFinals.length,
      ]);
    });

    const ws4 = XLSX.utils.aoa_to_sheet(sheet4Rows);
    autofitColumns(ws4, sheet4Rows);
    XLSX.utils.book_append_sheet(wb, ws4, 'Event Summary');

    // Trigger XLSX Write
    XLSX.writeFile(wb, fileName);
  } else {
    // CSV FLATTENED EXPORT
    const csvHeaders = [
      'Registration ID',
      'Participant ID',
      'Registration Number',
      'Participant Name',
      'Email',
      'Phone',
      'College',
      'Department',
      'Year',
      'Section',
      'Event',
      'Team ID',
      'Team Name',
      'Team Leader',
      'Team Members',
      'Member Count',
      'Registration Status',
      'Payment Status',
      'Payment Verification',
      'Transaction ID',
      'Transaction Date',
      'Gate Entry',
      'Gate Entry Time',
      'Round 1 Status',
      'Round 1 Result',
      'Round 2 Status',
      'Final Result',
    ];

    const csvRows: string[] = [csvHeaders.map(escapeCsvCell).join(',')];

    exportParticipantsList.forEach((p) => {
      const pRegs = registrationsList.filter((r) => r.uid === p.uid || r.participantId === p.participantId);
      const pTeams = teamsList.filter((t) => (t.memberUids || []).includes(p.uid));
      const gateCheck = checkinMap.get(p.uid);
      const isGateCheckedIn = p.venueCheckIn || gateCheck?.status === 'CHECKED_IN' || !!gateCheck;
      const gateTime = p.venueCheckInTimestamp || gateCheck?.timestamp || gateCheck?.scannedAt || (isGateCheckedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN');

      const team = pTeams[0];
      const teamLeader = team ? (participantMap.get(team.leaderUid)?.fullName || team.leaderName || 'N/A') : 'N/A';
      const teamMembersStr = team
        ? (team.memberUids || [])
            .map((mUid) => {
              const mP = participantMap.get(mUid);
              return `${mP?.fullName || mUid}${mUid === team.leaderUid ? ' (Leader)' : ''}`;
            })
            .join('; ')
        : 'N/A';

      const r1Res = team ? r1Map.get(team.teamId) : r1Map.get(p.uid);
      const r2Res = team ? r2Map.get(team.teamId) : r2Map.get(p.uid);

      if (pRegs.length > 0) {
        pRegs.forEach((r) => {
          const rowVals = [
            r.registrationId || 'N/A',
            p.participantId || p.uid || 'N/A',
            p.registrationNumber || 'N/A',
            p.fullName || 'N/A',
            p.email || 'N/A',
            p.phone || 'N/A',
            p.college || 'N/A',
            p.department || 'ECE',
            p.year || 'IV',
            p.section || 'A',
            r.eventName || 'N/A',
            team?.teamId || 'N/A',
            team?.teamName || 'INDIVIDUAL',
            teamLeader,
            teamMembersStr,
            team ? (team.memberUids || []).length : 1,
            r.status || 'CONFIRMED',
            r.paymentStatus || 'VERIFIED',
            r.paymentStatus || 'VERIFIED',
            r.utrNumber || 'N/A',
            r.transactionDate || (r as any).paymentProof?.transactionDate || 'N/A',
            isGateCheckedIn ? 'Checked In' : 'Not Checked In',
            gateTime,
            r1Res ? 'Scanned' : 'Not Scanned',
            r1Res?.result || 'PENDING',
            r2Res ? 'Scanned' : 'Not Scanned',
            r2Res?.result || 'PENDING',
          ];
          csvRows.push(rowVals.map(escapeCsvCell).join(','));
        });
      } else {
        const rowVals = [
          'N/A',
          p.participantId || p.uid || 'N/A',
          p.registrationNumber || 'N/A',
          p.fullName || 'N/A',
          p.email || 'N/A',
          p.phone || 'N/A',
          p.college || 'N/A',
          p.department || 'ECE',
          p.year || 'IV',
          p.section || 'A',
          'N/A',
          team?.teamId || 'N/A',
          team?.teamName || 'INDIVIDUAL',
          teamLeader,
          teamMembersStr,
          team ? (team.memberUids || []).length : 1,
          'REGISTERED',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          isGateCheckedIn ? 'Checked In' : 'Not Checked In',
          gateTime,
          'N/A',
          'N/A',
          'N/A',
          'N/A',
        ];
        csvRows.push(rowVals.map(escapeCsvCell).join(','));
      }
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 3. Log Audit Record
  try {
    await addDoc(collection(firestore, 'audit_logs'), {
      action: 'PARTICIPANT_DATA_EXPORT',
      actorUid: callerProfile.uid,
      actorRole: callerProfile.role,
      actorEmail: callerProfile.email || 'N/A',
      format: format,
      recordCount: participantsList.length,
      timestamp: serverTimestamp(),
      createdAtISO: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('⚠️ Could not log export audit record:', err);
  }

  // 4. Update Export Metadata in Firestore
  try {
    const meta: ExportMetadata = {
      exportId: `EXP_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: callerProfile.fullName || callerProfile.email || 'Authorized User',
      generatedByUid: callerProfile.uid,
      generatedByRole: callerProfile.role,
      format,
      recordCount: participantsList.length,
      fileName,
    };
    await setDoc(doc(firestore, 'export_metadata', 'latest'), meta);
  } catch (err) {
    console.warn('⚠️ Could not save export metadata:', err);
  }

  return { fileName, recordCount: participantsList.length };
}

/**
 * Subscribe to real-time updates of the latest export metadata.
 */
export function subscribeLatestExportMetadata(
  callback: (meta: ExportMetadata | null) => void
): () => void {
  const metaRef = doc(firestore, 'export_metadata', 'latest');
  return onSnapshot(
    metaRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as ExportMetadata);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn('Export metadata listener warning:', err);
      callback(null);
    }
  );
}
