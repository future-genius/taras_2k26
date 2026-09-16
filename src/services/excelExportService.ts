import * as XLSX from 'xlsx';
import type { EventTeam } from '../types/team';
import type { ParticipantProfile } from '../types/participant';
import type { EventRegistration } from '../types/registration';
import { isInternalRegNo } from '../utils/college';

export interface ComprehensiveTeamData {
  team: EventTeam;
  leader?: ParticipantProfile;
  members: {
    profile?: ParticipantProfile;
    uid: string;
    participantId: string;
    fullName: string;
    college?: string;
    isLeader: boolean;
  }[];
  registrations: EventRegistration[];
}

/**
 * Generates and downloads a professional, 3-sheet Excel workbook for TARAS 2K26.
 *
 * Sheet 1: TEAM SUMMARY
 * Sheet 2: ALL TEAM MEMBERS (Grouped sequentially by Team Order)
 * Sheet 3: EVENT-WISE TEAMS (Grouped by Event Name)
 */
export function exportPresidentTeamReportToExcel(
  teamDataList: ComprehensiveTeamData[],
  allRegistrations: EventRegistration[]
): void {
  const wb = XLSX.utils.book_new();

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 1: TEAM SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  const summaryHeaders = [
    'Team ID',
    'Team Name',
    'Team Leader Name',
    'Team Leader Email',
    'Team Leader Phone',
    'Team Member Count',
    'Event 1',
    'Event 2',
    'Event 3',
    'Registration Status',
    'Payment Status',
    'Team Created Date',
  ];

  const summaryRows: (string | number)[][] = [summaryHeaders];

  teamDataList.forEach(({ team, leader, members, registrations }) => {
    const leaderProfile = leader || members.find((m) => m.isLeader)?.profile;
    const leaderName = leaderProfile?.fullName || members.find((m) => m.isLeader)?.fullName || 'N/A';
    const leaderEmail = leaderProfile?.email || 'N/A';
    const leaderPhone = leaderProfile?.phone || (leaderProfile as any)?.phoneNumber || 'N/A';

    // Unique active events for this team
    const teamEvents = Array.from(
      new Set(
        registrations
          .filter((r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED')
          .map((r) => r.eventName)
      )
    );

    const event1 = teamEvents[0] || '';
    const event2 = teamEvents[1] || '';
    const event3 = teamEvents[2] || '';

    // Overall team registration & payment status
    const isVerified = registrations.some((r) => r.paymentStatus === 'VERIFIED');
    const isPendingVerification = registrations.some(
      (r) => r.status === 'PAYMENT_VERIFICATION_PENDING' || r.paymentStatus === 'PENDING'
    );
    const isConfirmed = registrations.some((r) => r.status === 'CONFIRMED');

    let overallRegStatus: string = team.status || 'FORMING';
    if (isConfirmed) overallRegStatus = 'CONFIRMED';
    else if (isPendingVerification) overallRegStatus = 'PENDING_VERIFICATION';

    let overallPayStatus = 'UNPAID';
    if (isVerified) overallPayStatus = 'VERIFIED';
    else if (isPendingVerification) overallPayStatus = 'VERIFICATION_PENDING';
    else if (registrations.some((r) => r.paymentStatus === 'NOT_REQUIRED')) overallPayStatus = 'NOT_REQUIRED';

    const createdDate = team.createdAt
      ? new Date(team.createdAt).toISOString().split('T')[0]
      : 'N/A';

    summaryRows.push([
      team.teamId,
      team.teamName,
      leaderName,
      leaderEmail,
      leaderPhone,
      members.length,
      event1,
      event2,
      event3,
      overallRegStatus,
      overallPayStatus,
      createdDate,
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  autofitColumns(wsSummary, summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'TEAM SUMMARY');

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 2: ALL TEAM MEMBERS (Grouped sequentially by Team Order)
  // ───────────────────────────────────────────────────────────────────────────
  const membersHeaders = [
    'Team Order',
    'Team ID',
    'Team Name',
    'Team Role',
    'Participant Name',
    'Registration Number',
    'Email',
    'Phone Number',
    'Internal/External',
    'Registered Event 1',
    'Registered Event 2',
    'Registered Event 3',
    'Registration Status',
    'Payment Status',
  ];

  const membersRows: (string | number)[][] = [membersHeaders];

  let teamOrderCounter = 1;
  teamDataList.forEach(({ team, members, registrations }) => {
    const currentTeamOrder = teamOrderCounter++;

    // Active events for team
    const teamEvents = Array.from(
      new Set(
        registrations
          .filter((r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED')
          .map((r) => r.eventName)
      )
    );
    const event1 = teamEvents[0] || '';
    const event2 = teamEvents[1] || '';
    const event3 = teamEvents[2] || '';

    const isVerified = registrations.some((r) => r.paymentStatus === 'VERIFIED');
    const isPendingVerification = registrations.some(
      (r) => r.status === 'PAYMENT_VERIFICATION_PENDING' || r.paymentStatus === 'PENDING'
    );
    const isConfirmed = registrations.some((r) => r.status === 'CONFIRMED');

    let overallRegStatus: string = team.status || 'FORMING';
    if (isConfirmed) overallRegStatus = 'CONFIRMED';
    else if (isPendingVerification) overallRegStatus = 'PENDING_VERIFICATION';

    let overallPayStatus = 'UNPAID';
    if (isVerified) overallPayStatus = 'VERIFIED';
    else if (isPendingVerification) overallPayStatus = 'VERIFICATION_PENDING';
    else if (registrations.some((r) => r.paymentStatus === 'NOT_REQUIRED')) overallPayStatus = 'NOT_REQUIRED';

    // Ensure leader is always the first member in the team list
    const sortedMembers = [...members].sort((a, b) => {
      if (a.isLeader && !b.isLeader) return -1;
      if (!a.isLeader && b.isLeader) return 1;
      return a.fullName.localeCompare(b.fullName);
    });

    sortedMembers.forEach((m) => {
      const profile = m.profile;
      const regNo = profile?.registrationNumber || 'N/A';
      const isInternal = isInternalRegNo(regNo);
      const participantType = isInternal ? 'Internal (SRM Valliammai)' : 'External Participant';
      const roleText = m.isLeader ? 'Leader' : 'Member';
      const email = profile?.email || 'N/A';
      const phone = profile?.phone || (profile as any)?.phoneNumber || 'N/A';

      membersRows.push([
        currentTeamOrder,
        team.teamId,
        team.teamName,
        roleText,
        m.fullName || profile?.fullName || 'N/A',
        regNo,
        email,
        phone,
        participantType,
        event1,
        event2,
        event3,
        overallRegStatus,
        overallPayStatus,
      ]);
    });
  });

  const wsMembers = XLSX.utils.aoa_to_sheet(membersRows);
  autofitColumns(wsMembers, membersRows);
  XLSX.utils.book_append_sheet(wb, wsMembers, 'ALL TEAM MEMBERS');

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 3: EVENT-WISE TEAMS
  // ───────────────────────────────────────────────────────────────────────────
  const eventWiseHeaders = [
    'Event Name',
    'Team ID',
    'Team Name',
    'Team Leader',
    'Participant Name',
    'Registration Number',
    'Email',
    'Phone',
    'Team Role',
    'Registration Status',
    'Payment Status',
  ];

  const eventWiseRows: (string | number)[][] = [eventWiseHeaders];

  // Group all registrations by eventName
  const eventMap = new Map<string, EventRegistration[]>();
  allRegistrations.forEach((r) => {
    if (r.status === 'CANCELLED' || r.status === 'REJECTED') return;
    const evName = r.eventName || 'Unspecified Event';
    if (!eventMap.has(evName)) {
      eventMap.set(evName, []);
    }
    eventMap.get(evName)!.push(r);
  });

  // Sort event names alphabetically
  const sortedEventNames = Array.from(eventMap.keys()).sort();

  sortedEventNames.forEach((eventName) => {
    const regsForEvent = eventMap.get(eventName)!;
    // Get unique team IDs registered for this event
    const teamIdsForEvent = Array.from(new Set(regsForEvent.map((r) => r.teamId).filter(Boolean)));

    teamIdsForEvent.forEach((teamId) => {
      const teamObj = teamDataList.find((td) => td.team.teamId === teamId);
      if (!teamObj) return;

      const { team, members } = teamObj;
      const leaderName = members.find((m) => m.isLeader)?.fullName || 'N/A';

      const reg = regsForEvent.find((r) => r.teamId === teamId);
      const regStatus = reg?.status || 'PENDING';
      const payStatus = reg?.paymentStatus || 'PENDING';

      const sortedMembers = [...members].sort((a, b) => {
        if (a.isLeader && !b.isLeader) return -1;
        if (!a.isLeader && b.isLeader) return 1;
        return a.fullName.localeCompare(b.fullName);
      });

      sortedMembers.forEach((m) => {
        const profile = m.profile;
        eventWiseRows.push([
          eventName,
          team.teamId,
          team.teamName,
          leaderName,
          m.fullName || profile?.fullName || 'N/A',
          profile?.registrationNumber || 'N/A',
          profile?.email || 'N/A',
          profile?.phone || (profile as any)?.phoneNumber || 'N/A',
          m.isLeader ? 'Leader' : 'Member',
          regStatus,
          payStatus,
        ]);
      });
    });
  });

  const wsEventWise = XLSX.utils.aoa_to_sheet(eventWiseRows);
  autofitColumns(wsEventWise, eventWiseRows);
  XLSX.utils.book_append_sheet(wb, wsEventWise, 'EVENT-WISE TEAMS');

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 4: PAYMENT REGISTER & DUAL-STORAGE ARCHIVE
  // ───────────────────────────────────────────────────────────────────────────
  const paymentHeaders = [
    'Payment Proof ID',
    'Registration ID',
    'Team ID',
    'Team Name',
    'Team Leader Name',
    'Registration Number',
    'Events',
    'Fee Amount (INR)',
    'Transaction ID (UTR)',
    'Uploaded At (IST)',
    'Verification Status',
    'Verified/Rejected By',
    'Verified/Rejected At',
    'Supabase Storage Path',
    'Google Drive File ID',
    'Google Drive Link',
  ];

  const paymentRows: (string | number)[][] = [paymentHeaders];

  allRegistrations.forEach((r) => {
    const proofId = r.paymentProofId || (r.paymentProof as any)?.paymentProofId || 'N/A';
    const driveFileId = (r as any).googleDriveFileId || (r.paymentProof as any)?.googleDriveFileId || 'N/A';
    const driveLink = driveFileId !== 'N/A' ? `https://drive.google.com/file/d/${driveFileId}/view` : 'N/A';
    const supabasePath = (r as any).supabasePath || r.paymentScreenshotPath || 'N/A';
    const uploadedAtIST = (r as any).uploadedAtIST || r.paymentSubmittedAt || 'N/A';
    const verifiedBy = (r as any).paymentVerifiedBy || (r as any).verifiedBy || (r as any).paymentRejectedBy || 'N/A';
    const verifiedAt = (r as any).paymentVerifiedAt || (r as any).verifiedAt || (r as any).paymentRejectedAt || 'N/A';

    paymentRows.push([
      proofId,
      r.registrationId,
      r.teamId || 'N/A',
      r.teamName || 'INDIVIDUAL',
      r.participantId || 'N/A',
      r.registrationNumber || 'N/A',
      r.eventName || 'N/A',
      r.feeAmount || 200,
      r.utrNumber || 'N/A',
      uploadedAtIST,
      r.paymentStatus || r.status || 'PENDING',
      verifiedBy,
      verifiedAt,
      supabasePath,
      driveFileId,
      driveLink,
    ]);
  });

  const wsPayment = XLSX.utils.aoa_to_sheet(paymentRows);
  autofitColumns(wsPayment, paymentRows);
  XLSX.utils.book_append_sheet(wb, wsPayment, 'PAYMENT REGISTER');

  // ───────────────────────────────────────────────────────────────────────────
  // WRITE AND DOWNLOAD FILE
  // ───────────────────────────────────────────────────────────────────────────
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `TARAS_2K26_Team_Report_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Auto-calculates column widths for a worksheet based on cell content length
 */
function autofitColumns(ws: XLSX.WorkSheet, rows: (string | number)[][]): void {
  if (rows.length === 0) return;
  const colWidths = rows[0].map((_, colIdx) => {
    let maxLen = 10;
    rows.forEach((row) => {
      const val = row[colIdx];
      if (val !== undefined && val !== null) {
        const len = String(val).length;
        if (len > maxLen) maxLen = len;
      }
    });
    return { wch: Math.min(maxLen + 4, 45) };
  });

  ws['!cols'] = colWidths;
}
