/**
 * TARAS 2K26 — Phase 9 Analytics Service
 *
 * Pure computation functions that accept raw Firestore collection arrays
 * and return aggregated analytics objects.
 *
 * No Firestore imports. No side effects. Fully testable.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Attendance Funnel
// ─────────────────────────────────────────────────────────────────────────────

export interface AttendanceFunnel {
  totalRegistered: number;
  venueCheckedIn: number;
  eventCheckedIn: number;
  venueCheckInRate: number; // percentage
  eventCheckInRate: number; // percentage (of venue checked-in)
  absentCount: number;
}

export function computeAttendanceFunnel(
  participants: Record<string, unknown>[],
  registrations: Record<string, unknown>[]
): AttendanceFunnel {
  const totalRegistered = participants.length;

  const venueCheckedIn = participants.filter(
    (p) => p.venueCheckIn === true || p.venueCheckInStatus === 'CHECKED_IN'
  ).length;

  const eventCheckedIn = registrations.filter(
    (r) => r.eventAttendance === 'PRESENT'
  ).length;

  const absentCount = registrations.filter(
    (r) => r.eventAttendance === 'ABSENT'
  ).length;

  const venueCheckInRate =
    totalRegistered > 0
      ? Math.round((venueCheckedIn / totalRegistered) * 100)
      : 0;

  const eventCheckInRate =
    venueCheckedIn > 0
      ? Math.round((eventCheckedIn / venueCheckedIn) * 100)
      : 0;

  return {
    totalRegistered,
    venueCheckedIn,
    eventCheckedIn,
    venueCheckInRate,
    eventCheckInRate,
    absentCount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Category Distribution
// ─────────────────────────────────────────────────────────────────────────────

export interface CategoryDistributionItem {
  category: string;
  count: number;
  percentage: number;
}

export function computeCategoryDistribution(
  registrations: Record<string, unknown>[]
): CategoryDistributionItem[] {
  const counts: Record<string, number> = {};

  for (const reg of registrations) {
    const cat = (reg.category as string) || 'UNKNOWN';
    counts[cat] = (counts[cat] || 0) + 1;
  }

  const total = registrations.length;

  return Object.entries(counts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// ─────────────────────────────────────────────────────────────────────────────
// College Breakdown
// ─────────────────────────────────────────────────────────────────────────────

export interface CollegeBreakdownItem {
  college: string;
  count: number;
  percentage: number;
  checkedInCount: number;
}

export function computeCollegeBreakdown(
  participants: Record<string, unknown>[],
  topN = 10
): CollegeBreakdownItem[] {
  const counts: Record<string, { total: number; checkedIn: number }> = {};

  for (const p of participants) {
    const college = ((p.college as string) || 'Unknown').trim();
    if (!counts[college]) counts[college] = { total: 0, checkedIn: 0 };
    counts[college].total++;
    if (p.venueCheckIn === true || p.venueCheckInStatus === 'CHECKED_IN') {
      counts[college].checkedIn++;
    }
  }

  const total = participants.length;

  return Object.entries(counts)
    .map(([college, { total: count, checkedIn }]) => ({
      college,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      checkedInCount: checkedIn,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

// ─────────────────────────────────────────────────────────────────────────────
// Scorecard Summary
// ─────────────────────────────────────────────────────────────────────────────

export interface ScorecardSummary {
  totalScorecards: number;
  submittedCount: number;
  reopenedCount: number;
  draftCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  submissionRate: number; // percentage
}

export function computeScorecardSummary(
  scorecards: Record<string, unknown>[]
): ScorecardSummary {
  const total = scorecards.length;

  let submitted = 0;
  let reopened = 0;
  let draft = 0;
  let scoreSum = 0;
  let highest = 0;
  let lowest = Infinity;

  for (const sc of scorecards) {
    const status = sc.status as string;
    const score = (sc.totalScore as number) || 0;

    if (status === 'SUBMITTED') submitted++;
    else if (status === 'REOPENED') reopened++;
    else draft++;

    scoreSum += score;
    if (score > highest) highest = score;
    if (score < lowest) lowest = score;
  }

  return {
    totalScorecards: total,
    submittedCount: submitted,
    reopenedCount: reopened,
    draftCount: draft,
    averageScore: total > 0 ? Math.round((scoreSum / total) * 10) / 10 : 0,
    highestScore: highest,
    lowestScore: total > 0 && lowest !== Infinity ? lowest : 0,
    submissionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-Event Attendance Matrix
// ─────────────────────────────────────────────────────────────────────────────

export interface EventAttendanceRow {
  eventId: string;
  eventName: string;
  registeredCount: number;
  presentCount: number;
  absentCount: number;
  notMarkedCount: number;
  attendanceRate: number; // percentage
}

export function computePerEventAttendance(
  registrations: Record<string, unknown>[]
): EventAttendanceRow[] {
  const eventMap: Record<
    string,
    { eventName: string; registered: number; present: number; absent: number; notMarked: number }
  > = {};

  for (const reg of registrations) {
    const eventId = (reg.eventId as string) || 'unknown';
    const eventName = (reg.eventName as string) || eventId;
    const attendance = (reg.eventAttendance as string) || 'NOT_MARKED';

    if (!eventMap[eventId]) {
      eventMap[eventId] = {
        eventName,
        registered: 0,
        present: 0,
        absent: 0,
        notMarked: 0,
      };
    }

    eventMap[eventId].registered++;
    if (attendance === 'PRESENT') eventMap[eventId].present++;
    else if (attendance === 'ABSENT') eventMap[eventId].absent++;
    else eventMap[eventId].notMarked++;
  }

  return Object.entries(eventMap).map(
    ([eventId, { eventName, registered, present, absent, notMarked }]) => ({
      eventId,
      eventName,
      registeredCount: registered,
      presentCount: present,
      absentCount: absent,
      notMarkedCount: notMarked,
      attendanceRate:
        registered > 0 ? Math.round((present / registered) * 100) : 0,
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Certificate Pipeline Status
// ─────────────────────────────────────────────────────────────────────────────

export interface CertificatePipelineStatus {
  total: number;
  issued: number;
  pending: number;
  revoked: number;
  byType: Record<string, number>;
  issuanceRate: number; // percentage
}

export function computeCertificatePipeline(
  certificates: Record<string, unknown>[]
): CertificatePipelineStatus {
  const total = certificates.length;
  let issued = 0;
  let pending = 0;
  let revoked = 0;
  const byType: Record<string, number> = {};

  for (const cert of certificates) {
    const status = (cert.status as string) || 'PENDING';
    const type = (cert.certificateType as string) || 'UNKNOWN';

    if (status === 'ISSUED') issued++;
    else if (status === 'REVOKED') revoked++;
    else pending++;

    byType[type] = (byType[type] || 0) + 1;
  }

  return {
    total,
    issued,
    pending,
    revoked,
    byType,
    issuanceRate: total > 0 ? Math.round((issued / total) * 100) : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Top Scorers Leaderboard (used in coordinator leaderboard)
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  targetId: string;
  targetName: string;
  totalScore: number;
  rank: number;
  judgeName: string;
  submittedAt: string;
}

export function computeEventLeaderboard(
  scorecards: Record<string, unknown>[]
): LeaderboardEntry[] {
  // Deduplicate: highest score per target
  const targetMap = new Map<string, Record<string, unknown>>();

  for (const sc of scorecards) {
    const targetId = sc.targetId as string;
    if (!targetId) continue;
    const existing = targetMap.get(targetId);
    const score = (sc.totalScore as number) || 0;
    if (!existing || score > ((existing.totalScore as number) || 0)) {
      targetMap.set(targetId, sc);
    }
  }

  return Array.from(targetMap.values())
    .filter((sc) => sc.status === 'SUBMITTED')
    .sort((a, b) => ((b.totalScore as number) || 0) - ((a.totalScore as number) || 0))
    .map((sc, i) => ({
      targetId: sc.targetId as string,
      targetName: (sc.targetName as string) || 'Participant',
      totalScore: (sc.totalScore as number) || 0,
      rank: i + 1,
      judgeName: (sc.judgeName as string) || 'Judge',
      submittedAt: (sc.submittedAt as string) || '',
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Health Monitor
// ─────────────────────────────────────────────────────────────────────────────

export interface EventHealthMetric {
  eventId: string;
  eventName: string;
  category: string;
  venue: string;
  type: string;
  registeredCount: number;
  gateCheckedCount: number;
  eventCheckedCount: number;
  presentCount: number;
  absentCount: number;
  notMarkedCount: number;
  scoresSubmittedCount: number;
  scoresPendingCount: number;
  resultsStatus: 'NO_RESULT' | 'DRAFT' | 'PUBLISHED';
  operationalStatus: 'UPCOMING' | 'REGISTRATION_OPEN' | 'LIVE' | 'SCORING' | 'RESULTS_READY' | 'PUBLISHED' | 'COMPLETED';
}

export function computeEventHealthMetrics(
  events: Array<{ id: string; name: string; category: string; venue: string; type: string }>,
  registrations: Record<string, unknown>[],
  participants: Record<string, unknown>[],
  scorecards: Record<string, unknown>[],
  results: Record<string, unknown>[]
): EventHealthMetric[] {
  // Create quick lookup maps
  const participantGateMap = new Map<string, boolean>();
  for (const p of participants) {
    const uid = (p.uid as string) || (p.id as string);
    if (uid) {
      participantGateMap.set(uid, p.venueCheckIn === true || p.venueCheckInStatus === 'CHECKED_IN');
    }
  }

  const resultsMap = new Map<string, string>();
  for (const res of results) {
    const evId = res.eventId as string;
    if (evId) {
      resultsMap.set(evId, (res.status as string) || 'DRAFT');
    }
  }

  return events.map((ev) => {
    const evRegs = registrations.filter((r) => (r.eventId as string) === ev.id);
    const evScores = scorecards.filter((sc) => (sc.eventId as string) === ev.id);
    const resStatus = (resultsMap.get(ev.id) as 'NO_RESULT' | 'DRAFT' | 'PUBLISHED') || 'NO_RESULT';

    let gateCheckedCount = 0;
    let presentCount = 0;
    let absentCount = 0;
    let notMarkedCount = 0;

    for (const r of evRegs) {
      const uid = r.uid as string;
      if (participantGateMap.get(uid)) {
        gateCheckedCount++;
      }
      const att = (r.eventAttendance as string) || 'NOT_MARKED';
      if (att === 'PRESENT') presentCount++;
      else if (att === 'ABSENT') absentCount++;
      else notMarkedCount++;
    }

    const eventCheckedCount = presentCount;
    const scoresSubmittedCount = evScores.filter((sc) => sc.status === 'SUBMITTED').length;
    const scoresPendingCount = Math.max(0, presentCount - scoresSubmittedCount);

    // Determine operational lifecycle status
    let operationalStatus: EventHealthMetric['operationalStatus'] = 'UPCOMING';
    if (resStatus === 'PUBLISHED') {
      operationalStatus = 'PUBLISHED';
    } else if (scoresSubmittedCount > 0 && scoresPendingCount === 0 && presentCount > 0) {
      operationalStatus = 'RESULTS_READY';
    } else if (scoresSubmittedCount > 0 || evScores.length > 0) {
      operationalStatus = 'SCORING';
    } else if (eventCheckedCount > 0) {
      operationalStatus = 'LIVE';
    } else if (evRegs.length > 0) {
      operationalStatus = 'REGISTRATION_OPEN';
    }

    return {
      eventId: ev.id,
      eventName: ev.name,
      category: ev.category,
      venue: ev.venue,
      type: ev.type,
      registeredCount: evRegs.length,
      gateCheckedCount,
      eventCheckedCount,
      presentCount,
      absentCount,
      notMarkedCount,
      scoresSubmittedCount,
      scoresPendingCount,
      resultsStatus: resStatus,
      operationalStatus,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Results Readiness Evaluation
// ─────────────────────────────────────────────────────────────────────────────

export interface ResultsReadinessEvaluation {
  isReady: boolean;
  scorecardsSubmitted: number;
  scorecardsRequired: number;
  pendingScorecardsCount: number;
  attendanceComplete: boolean;
  incompleteAttendanceCount: number;
  unresolvedTiesCount: number;
  hasPublishedResult: boolean;
  blockers: string[];
}

export function evaluateResultsReadiness(
  eventId: string,
  registrations: Record<string, unknown>[],
  scorecards: Record<string, unknown>[],
  results: Record<string, unknown>[]
): ResultsReadinessEvaluation {
  const evRegs = registrations.filter((r) => (r.eventId as string) === eventId);
  const evScores = scorecards.filter((sc) => (sc.eventId as string) === eventId);
  const existingResult = results.find((res) => (res.eventId as string) === eventId);

  const presentCount = evRegs.filter((r) => r.eventAttendance === 'PRESENT').length;
  const notMarkedCount = evRegs.filter((r) => (r.eventAttendance as string) === 'NOT_MARKED').length;
  const submittedScores = evScores.filter((sc) => sc.status === 'SUBMITTED');
  const submittedScoresCount = submittedScores.length;

  const blockers: string[] = [];

  if (evRegs.length === 0) {
    blockers.push('No participants registered for this event.');
  }

  if (presentCount === 0) {
    blockers.push('No participants marked PRESENT for this event.');
  }

  if (notMarkedCount > 0) {
    blockers.push(`${notMarkedCount} participant(s) have unrecorded attendance status.`);
  }

  if (submittedScoresCount < presentCount) {
    const diff = presentCount - submittedScoresCount;
    blockers.push(`${diff} participant/team scorecard(s) are still pending judge submission.`);
  }

  // Check for unresolved score ties among top 3 positions
  const sortedScores = [...submittedScores].sort(
    (a, b) => ((b.totalScore as number) || 0) - ((a.totalScore as number) || 0)
  );

  let tiesCount = 0;
  if (sortedScores.length >= 2) {
    if (sortedScores[0].totalScore === sortedScores[1].totalScore) {
      tiesCount++;
      blockers.push(`Tie detected between 1st and 2nd place (${sortedScores[0].targetName} & ${sortedScores[1].targetName} with ${sortedScores[0].totalScore} pts).`);
    }
  }
  if (sortedScores.length >= 3) {
    if (sortedScores[1].totalScore === sortedScores[2].totalScore) {
      tiesCount++;
      blockers.push(`Tie detected between 2nd and 3rd place (${sortedScores[1].targetName} & ${sortedScores[2].targetName} with ${sortedScores[1].totalScore} pts).`);
    }
  }

  const isReady = blockers.length === 0;

  return {
    isReady,
    scorecardsSubmitted: submittedScoresCount,
    scorecardsRequired: presentCount,
    pendingScorecardsCount: Math.max(0, presentCount - submittedScoresCount),
    attendanceComplete: notMarkedCount === 0 && presentCount > 0,
    incompleteAttendanceCount: notMarkedCount,
    unresolvedTiesCount: tiesCount,
    hasPublishedResult: existingResult?.status === 'PUBLISHED',
    blockers,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Operational Alerts Engine
// ─────────────────────────────────────────────────────────────────────────────

export interface OperationalAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  category: 'GATE' | 'EVENT' | 'SCORING' | 'RESULTS' | 'CERTIFICATES';
  actionPath?: string;
  actionLabel?: string;
}

export function detectOperationalAlerts(
  participants: Record<string, unknown>[],
  registrations: Record<string, unknown>[],
  scorecards: Record<string, unknown>[],
  results: Record<string, unknown>[],
  certificates: Record<string, unknown>[]
): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];

  const totalRegistered = participants.length;
  const gateChecked = participants.filter((p) => p.venueCheckIn === true || p.venueCheckInStatus === 'CHECKED_IN').length;
  const gatePending = totalRegistered - gateChecked;

  // 1. Gate Discrepancy Alert
  if (totalRegistered > 0 && gatePending > 0) {
    alerts.push({
      id: 'alert-gate-pending',
      severity: gatePending > totalRegistered * 0.5 ? 'WARNING' : 'INFO',
      title: `${gatePending} Registered Participants Awaiting Gate Check-In`,
      description: `${gateChecked} of ${totalRegistered} participants confirmed on campus. Gate desks active.`,
      category: 'GATE',
      actionPath: '/staff/dashboard',
      actionLabel: 'Open Gate Desk',
    });
  }

  // 2. Event Check-in with Gate Prerequisite Discrepancy
  const unverifiedGateAttendees = registrations.filter((r) => {
    const uid = r.uid as string;
    const p = participants.find((part) => ((part.uid as string) || (part.id as string)) === uid);
    return r.eventAttendance === 'PRESENT' && (!p || (p.venueCheckIn !== true && p.venueCheckInStatus !== 'CHECKED_IN'));
  });

  if (unverifiedGateAttendees.length > 0) {
    alerts.push({
      id: 'alert-gate-prereq-violation',
      severity: 'CRITICAL',
      title: `${unverifiedGateAttendees.length} Event Attendee(s) Missing Gate Confirmation`,
      description: 'Participants were marked present in event rooms without prior Ground Floor Gate Pass verification.',
      category: 'EVENT',
      actionPath: '/admin/audit',
      actionLabel: 'Audit Event Desk',
    });
  }

  // 3. Pending Scorecards Alert
  const draftScores = scorecards.filter((sc) => sc.status === 'DRAFT');
  if (draftScores.length > 0) {
    alerts.push({
      id: 'alert-draft-scores',
      severity: 'WARNING',
      title: `${draftScores.length} Scorecard(s) in Draft State`,
      description: 'Judges have started scoring but have not officially locked and submitted scorecards.',
      category: 'SCORING',
      actionPath: '/coordinator/dashboard',
      actionLabel: 'Review Scores',
    });
  }

  // 4. Results Published vs Pending
  const publishedResultsCount = results.filter((res) => res.status === 'PUBLISHED').length;
  if (publishedResultsCount > 0) {
    alerts.push({
      id: 'alert-results-published',
      severity: 'INFO',
      title: `${publishedResultsCount} Official Event Result(s) Live on Podium`,
      description: 'Public results declared and visible on the official symposium results page.',
      category: 'RESULTS',
      actionPath: '/admin/results',
      actionLabel: 'Results Hub',
    });
  }

  return alerts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Omni-Search ("Search Everything")
// ─────────────────────────────────────────────────────────────────────────────

export interface OmniSearchResultItem {
  id: string;
  type: 'PARTICIPANT' | 'TEAM' | 'EVENT';
  primaryTitle: string;
  secondaryTitle: string;
  subtitle: string;
  gateStatus: boolean;
  registeredEvents: string[];
  attendanceStatus: Record<string, string>;
  role: string;
  teamCode?: string;
  score?: number;
  rank?: number;
  certificateStatus?: string;
}

export function searchSymposiumEntities(
  queryText: string,
  participants: Record<string, unknown>[],
  teams: Record<string, unknown>[],
  events: Array<{ id: string; name: string; category: string }>,
  scorecards: Record<string, unknown>[],
  certificates: Record<string, unknown>[]
): OmniSearchResultItem[] {
  if (!queryText.trim() || queryText.trim().length < 2) return [];
  const q = queryText.trim().toLowerCase();

  const results: OmniSearchResultItem[] = [];

  // Search Participants
  for (const p of participants) {
    const fullName = ((p.fullName as string) || '').toLowerCase();
    const pid = ((p.participantId as string) || '').toLowerCase();
    const email = ((p.email as string) || '').toLowerCase();
    const college = ((p.college as string) || '').toLowerCase();
    const regNo = ((p.registrationNumber as string) || '').toLowerCase();
    const uid = (p.uid as string) || (p.id as string) || '';

    if (fullName.includes(q) || pid.includes(q) || email.includes(q) || college.includes(q) || regNo.includes(q)) {
      // Find matching certificate
      const cert = certificates.find((c) => (c.uid as string) === uid || (c.participantId as string) === pid);
      // Find highest score
      const userScores = scorecards.filter((sc) => (sc.targetId as string) === uid && sc.status === 'SUBMITTED');
      const maxScore = userScores.length > 0 ? Math.max(...userScores.map((sc) => (sc.totalScore as number) || 0)) : undefined;

      results.push({
        id: uid,
        type: 'PARTICIPANT',
        primaryTitle: (p.fullName as string) || 'Participant',
        secondaryTitle: (p.participantId as string) || uid,
        subtitle: `${(p.college as string) || 'Institution'} • ${(p.department as string) || 'ECE'}`,
        gateStatus: p.venueCheckIn === true || p.venueCheckInStatus === 'CHECKED_IN',
        registeredEvents: (p.registeredEvents as string[]) || [],
        attendanceStatus: (p.attendanceStatus as Record<string, string>) || {},
        role: (p.role as string) || 'PARTICIPANT',
        score: maxScore,
        certificateStatus: cert ? (cert.status as string) : (p.certificateStatus as string) || 'PENDING',
      });
    }
  }

  // Search Teams
  for (const t of teams) {
    const teamName = ((t.teamName as string) || '').toLowerCase();
    const teamCode = ((t.teamCode as string) || '').toLowerCase();
    const teamId = (t.teamId as string) || (t.id as string) || '';

    if (teamName.includes(q) || teamCode.includes(q)) {
      results.push({
        id: teamId,
        type: 'TEAM',
        primaryTitle: (t.teamName as string) || 'Team',
        secondaryTitle: `Code: ${(t.teamCode as string) || 'N/A'}`,
        subtitle: `Event: ${(t.eventName as string) || (t.eventId as string) || 'Team Track'} • ${((t.memberUids as string[]) || []).length} Members`,
        gateStatus: true,
        registeredEvents: t.eventId ? [t.eventId as string] : [],
        attendanceStatus: {},
        role: 'TEAM',
        teamCode: (t.teamCode as string) || '',
      });
    }
  }

  return results.slice(0, 12);
}

