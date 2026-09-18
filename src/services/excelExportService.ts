import * as XLSX from 'xlsx';
import type { EventTeam } from '../types/team';
import type { ParticipantProfile } from '../types/participant';
import type { EventRegistration } from '../types/registration';
import { isInternalRegNo } from '../utils/college';

export {
  generateParticipantExport,
  verifyExportAuthorization,
  subscribeLatestExportMetadata,
} from './participantExportService';

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
 * Generates and downloads a complete, professional multi-sheet Excel workbook for TARAS 2K26 President.
 *
 * Sheet 1: COMPLETE REGISTRATIONS (Option A — One Row Per Member with complete team, payment, member, & drive metadata)
 * Sheet 2: TEAM SUMMARY
 * Sheet 3: ALL TEAM MEMBERS
 * Sheet 4: PAYMENT REGISTER & DRIVE ARCHIVE
 */
export function exportPresidentTeamReportToExcel(
  teamDataList: ComprehensiveTeamData[],
  allRegistrations: EventRegistration[]
): void {
  const wb = XLSX.utils.book_new();

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 1: COMPLETE REGISTRATIONS (OPTION A — ONE ROW PER MEMBER)
  // ───────────────────────────────────────────────────────────────────────────
  const masterHeaders = [
    'Registration ID',
    'Payment Proof ID',
    'Team ID',
    'Team Name',
    'Team Code',
    'Registration Date & Time',
    'Event Name',
    'Event ID',
    'Round 1 Result',
    'Round 2 Final Result',
    'Registration Status',
    'Payment Status',
    'Number of Members Registered',
    'Paid Member Count',
    'UTR / Transaction ID',
    'Bank Name',
    'Transaction Date',
    'Payment Amount (INR)',
    'Payment Verification Status',
    'Payment Verified Date/Time',
    'Payment Verified By',
    'Member Name',
    'Member Email',
    'Member Phone Number',
    'College Name',
    'College Registration Number',
    'Department',
    'Year',
    'Section',
    'Team Role',
    'Payment Proof Storage Path',
    'Google Drive File ID',
    'Google Drive Folder ID',
    'Google Drive Archive Status',
  ];

  const masterRows: (string | number)[][] = [masterHeaders];

  // Map registrations by registrationId & by teamId for fast access
  teamDataList.forEach(({ team, members, registrations }) => {
    // If team has no event registrations yet, output team roster rows with 'UNREGISTERED'
    const activeRegs = registrations.filter((r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED');
    const targetRegs = activeRegs.length > 0 ? activeRegs : registrations.length > 0 ? [registrations[0]] : [null];

    targetRegs.forEach((reg) => {
      const regId = reg?.registrationId || 'N/A';
      const proofId = reg?.paymentProofId || (reg?.paymentProof as any)?.paymentProofId || 'N/A';
      const eventName = reg?.eventName || 'No Event Registered';
      const eventId = reg?.eventId || 'N/A';
      const r1ResultDisplay =
        reg?.round1Result === 'SELECTED'
          ? 'Selected for Next Round'
          : reg?.round1Result === 'NOT_SELECTED'
          ? 'Not Selected for Next Round'
          : 'Result Not Declared';
      const r2ResultDisplay =
        reg?.round2Result === 'WINNER'
          ? 'Winner'
          : reg?.round2Result === 'RUNNER_UP'
          ? 'Runner-Up'
          : reg?.round2Result === 'NOT_SELECTED'
          ? 'Not Selected'
          : 'Result Not Declared';
      const regStatus = reg?.status || team.status || 'FORMING';
      const payStatus = reg?.paymentStatus || 'UNPAID';
      const numMembersReg = team.memberCount || members.length;
      const paidMemberCount = team.paidMemberCount ?? reg?.paidMemberCount ?? (team.isPaymentVerified ? numMembersReg : 'N/A');
      const utr = reg?.utrNumber || reg?.utr || 'N/A';
      const bankName = reg?.bankName || (reg?.paymentProof as any)?.bankName || 'Not provided';
      const txnDate = reg?.transactionDate || (reg?.paymentProof as any)?.transactionDate || 'Not provided';
      const feeAmount = reg?.feeAmount ?? reg?.calculatedFee ?? 200;
      const payVerifStatus = reg?.paymentStatus || 'PENDING';
      const payVerifTime = reg?.paymentVerifiedAt || reg?.verifiedAt || 'N/A';
      const payVerifBy = reg?.paymentVerifiedBy || reg?.verifiedBy || 'N/A';
      const storagePath = reg?.paymentScreenshotPath || (reg?.paymentProof as any)?.path || reg?.supabasePath || 'N/A';
      const driveFileId = reg?.googleDriveFileId || (reg?.paymentProof as any)?.googleDriveFileId || 'N/A';
      const driveFolderId = reg?.googleDriveFolderId || (reg?.paymentProof as any)?.googleDriveFolderId || 'N/A';
      const driveArchiveStatus = reg?.googleDriveUploadStatus || (reg?.paymentProof as any)?.googleDriveUploadStatus || 'N/A';
      const regDateTime = reg?.registeredAt || (reg?.createdAt ? String(reg.createdAt) : '') || team.createdAt || 'N/A';

      // Sorted members with leader first
      const sortedMembers = [...members].sort((a, b) => {
        if (a.isLeader && !b.isLeader) return -1;
        if (!a.isLeader && b.isLeader) return 1;
        return a.fullName.localeCompare(b.fullName);
      });

      sortedMembers.forEach((m) => {
        const p = m.profile;
        const memberName = m.fullName || p?.fullName || 'N/A';
        const memberEmail = p?.email || 'N/A';
        const memberPhone = p?.phone || p?.phoneNumber || 'N/A';
        const collegeName = p?.college || m.college || 'N/A';
        const regNo = p?.registrationNumber || 'N/A';
        const dept = p?.department || 'ECE';
        const year = p?.year || 'IV';
        const section = p?.section || 'A';
        const teamRole = m.isLeader ? 'Leader' : 'Member';

        masterRows.push([
          regId,
          proofId,
          team.teamId,
          team.teamName,
          team.teamCode || 'N/A',
          regDateTime,
          eventName,
          eventId,
          r1ResultDisplay,
          r2ResultDisplay,
          regStatus,
          payStatus,
          numMembersReg,
          paidMemberCount,
          utr,
          bankName,
          txnDate,
          feeAmount,
          payVerifStatus,
          payVerifTime,
          payVerifBy,
          memberName,
          memberEmail,
          memberPhone,
          collegeName,
          regNo,
          dept,
          year,
          section,
          teamRole,
          storagePath,
          driveFileId,
          driveFolderId,
          driveArchiveStatus,
        ]);
      });
    });
  });


  const wsMaster = XLSX.utils.aoa_to_sheet(masterRows);
  autofitColumns(wsMaster, masterRows);
  XLSX.utils.book_append_sheet(wb, wsMaster, 'COMPLETE REGISTRATIONS');

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 2: TEAM SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  const summaryHeaders = [
    'Team ID',
    'Team Name',
    'Team Code',
    'Team Leader Name',
    'Team Leader Email',
    'Team Leader Phone',
    'Current Member Count',
    'Paid Member Count',
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
    const leaderPhone = leaderProfile?.phone || leaderProfile?.phoneNumber || 'N/A';

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

    const isVerified = registrations.some((r) => r.paymentStatus === 'VERIFIED') || !!team.isPaymentVerified;
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

    const paidCount = team.paidMemberCount ?? (isVerified ? members.length : 'N/A');

    summaryRows.push([
      team.teamId,
      team.teamName,
      team.teamCode || 'N/A',
      leaderName,
      leaderEmail,
      leaderPhone,
      members.length,
      paidCount,
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
  // SHEET 3: ALL TEAM MEMBERS
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
    'College Name',
    'Department',
    'Year',
    'Section',
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

    const isVerified = registrations.some((r) => r.paymentStatus === 'VERIFIED') || !!team.isPaymentVerified;
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
      const phone = profile?.phone || profile?.phoneNumber || 'N/A';
      const college = profile?.college || m.college || 'N/A';
      const dept = profile?.department || 'ECE';
      const year = profile?.year || 'IV';
      const sec = profile?.section || 'A';

      membersRows.push([
        currentTeamOrder,
        team.teamId,
        team.teamName,
        roleText,
        m.fullName || profile?.fullName || 'N/A',
        regNo,
        email,
        phone,
        college,
        dept,
        year,
        sec,
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
    'Bank Name',
    'Transaction Date',
    'Fee Amount (INR)',
    'Transaction ID (UTR)',
    'Uploaded At (IST)',
    'Verification Status',
    'Verified/Rejected By',
    'Verified/Rejected At',
    'Drive Path',
    'Google Drive File ID',
    'Google Drive Folder ID',
    'Google Drive Link',
  ];

  const paymentRows: (string | number)[][] = [paymentHeaders];

  allRegistrations.forEach((r) => {
    const proofId = r.paymentProofId || (r.paymentProof as any)?.paymentProofId || 'N/A';
    const driveFileId = (r as any).googleDriveFileId || (r.paymentProof as any)?.googleDriveFileId || 'N/A';
    const driveFolderId = (r as any).googleDriveFolderId || (r.paymentProof as any)?.googleDriveFolderId || 'N/A';
    const driveLink = driveFileId !== 'N/A' ? `https://drive.google.com/file/d/${driveFileId}/view` : 'N/A';
    const drivePath = (r as any).paymentProof?.drivePath || (r as any).googleDrivePath || (r as any).supabasePath || r.paymentScreenshotPath || 'N/A';
    const uploadedAtIST = (r as any).uploadedAtIST || r.paymentSubmittedAt || 'N/A';
    const verifiedBy = (r as any).paymentVerifiedBy || (r as any).verifiedBy || (r as any).paymentRejectedBy || 'N/A';
    const verifiedAt = (r as any).paymentVerifiedAt || (r as any).verifiedAt || (r as any).paymentRejectedAt || 'N/A';
    const bankName = r.bankName || (r.paymentProof as any)?.bankName || 'Not provided';
    const txnDate = r.transactionDate || (r.paymentProof as any)?.transactionDate || 'Not provided';

    paymentRows.push([
      proofId,
      r.registrationId,
      r.teamId || 'N/A',
      r.teamName || 'INDIVIDUAL',
      r.participantId || 'N/A',
      r.registrationNumber || 'N/A',
      r.eventName || 'N/A',
      bankName,
      txnDate,
      r.feeAmount || 200,
      r.utrNumber || 'N/A',
      uploadedAtIST,
      r.paymentStatus || r.status || 'PENDING',
      verifiedBy,
      verifiedAt,
      drivePath,
      driveFileId,
      driveFolderId,
      driveLink,
    ]);
  });

  const wsPayment = XLSX.utils.aoa_to_sheet(paymentRows);
  autofitColumns(wsPayment, paymentRows);
  XLSX.utils.book_append_sheet(wb, wsPayment, 'PAYMENT REGISTER');

  // ───────────────────────────────────────────────────────────────────────────
  // WRITE AND DOWNLOAD FILE DIRECTLY IN BROWSER
  // ───────────────────────────────────────────────────────────────────────────
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `TARAS_2K26_President_Registration_Report_${dateStr}.xlsx`;
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
    return { wch: Math.min(maxLen + 4, 50) };
  });

  ws['!cols'] = colWidths;
}
