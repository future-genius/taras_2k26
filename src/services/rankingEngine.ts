import type { Scorecard, RankedResultItem, EventResult } from '../types/eventDay';
import type { TARASEvent } from '../types/event';

export interface RankingOptions {
  event: TARASEvent;
  scorecards: Scorecard[];
  participantsMetadata?: Record<string, { fullName: string; college: string; participantId?: string }>;
  teamsMetadata?: Record<string, { teamName: string; teamCode: string; memberNames: string[]; leaderName: string }>;
  manualTieBreakerOrder?: string[]; // Optional targetIds in explicit tie-break order
}

/**
 * Computes deterministic rankings from scorecards.
 * Primary: totalScore descending.
 * Secondary tie-breaker:
 *  1. Manual tie-breaker order (if provided by admin/coordinator)
 *  2. Highest score in the first criterion
 *  3. Earliest submission timestamp
 *  4. Lexicographical targetName as final deterministic fallback
 */
export function computeDeterministicRanking(options: RankingOptions): RankedResultItem[] {
  const { event, scorecards, participantsMetadata = {}, teamsMetadata = {}, manualTieBreakerOrder = [] } = options;

  // Deduplicate by targetId (take highest/latest valid scorecard)
  const targetMap = new Map<string, Scorecard>();
  for (const sc of scorecards) {
    if (!sc.targetId) continue;
    const existing = targetMap.get(sc.targetId);
    if (!existing || (sc.status === 'SUBMITTED' && existing.status !== 'SUBMITTED') || (sc.totalScore > existing.totalScore)) {
      targetMap.set(sc.targetId, sc);
    }
  }

  const validScorecards = Array.from(targetMap.values());

  const sorted = [...validScorecards].sort((a, b) => {
    // 1. Primary: Total Score DESC
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }

    // 2. Manual Tie Breaker (if specified)
    if (manualTieBreakerOrder.length > 0) {
      const indexA = manualTieBreakerOrder.indexOf(a.targetId);
      const indexB = manualTieBreakerOrder.indexOf(b.targetId);
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
    }

    // 3. Highest first criterion score
    const critKeysA = Object.keys(a.criteria || {});
    const critKeysB = Object.keys(b.criteria || {});
    if (critKeysA.length > 0 && critKeysB.length > 0) {
      const firstValA = a.criteria[critKeysA[0]] || 0;
      const firstValB = b.criteria[critKeysB[0]] || 0;
      if (firstValB !== firstValA) {
        return firstValB - firstValA;
      }
    }

    // 4. Earliest submitted timestamp
    if (a.submittedAt && b.submittedAt) {
      const timeA = new Date(a.submittedAt).getTime();
      const timeB = new Date(b.submittedAt).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }
    }

    // 5. Lexicographical fallback
    return (a.targetName || '').localeCompare(b.targetName || '');
  });

  return sorted.map((sc, index) => {
    const isTeam = event.maxTeamSize > 1 || sc.isTeam;
    const rank = index + 1;

    let name = sc.targetName;
    let college = 'Institution';
    let teamMembers: string[] | undefined = undefined;
    let teamCode: string | undefined = sc.teamCode;

    if (isTeam && teamsMetadata[sc.targetId]) {
      const tMeta = teamsMetadata[sc.targetId];
      name = tMeta.teamName || sc.targetName;
      teamCode = tMeta.teamCode;
      teamMembers = tMeta.memberNames;
    } else if (participantsMetadata[sc.targetId]) {
      const pMeta = participantsMetadata[sc.targetId];
      name = pMeta.fullName || sc.targetName;
      college = pMeta.college || 'Institution';
    }

    let achievement: 'WINNER' | 'RUNNER_UP' | 'FINALIST' | 'SPECIAL_MENTION' = 'FINALIST';
    if (rank === 1) achievement = 'WINNER';
    else if (rank === 2) achievement = 'RUNNER_UP';
    else if (rank <= 5) achievement = 'FINALIST';

    return {
      targetId: sc.targetId,
      name,
      college,
      totalScore: sc.totalScore,
      rank,
      achievement,
      isTeam,
      teamCode,
      teamMembers,
    };
  });
}

/**
 * Builds a draft EventResult object from calculated deterministic rankings.
 */
export function buildDraftEventResult(
  event: TARASEvent,
  rankings: RankedResultItem[],
  adminUid: string
): EventResult {
  const winnerItem = rankings[0] || {
    targetId: 'pending',
    name: 'TBD',
    college: 'TBD',
    totalScore: 0,
  };

  const runnerUpItem = rankings[1] || {
    targetId: 'pending',
    name: 'TBD',
    college: 'TBD',
    totalScore: 0,
  };

  const specialMentionItem = rankings[2];

  const now = new Date().toISOString();

  return {
    resultId: `RES-${event.id}`,
    eventId: event.id,
    eventName: event.name,
    category: event.category,
    winner: {
      targetId: winnerItem.targetId,
      name: winnerItem.name,
      college: winnerItem.college,
      score: winnerItem.totalScore,
      teamCode: winnerItem.teamCode,
      members: winnerItem.teamMembers,
    },
    runnerUp: {
      targetId: runnerUpItem.targetId,
      name: runnerUpItem.name,
      college: runnerUpItem.college,
      score: runnerUpItem.totalScore,
      teamCode: runnerUpItem.teamCode,
      members: runnerUpItem.teamMembers,
    },
    specialMention: specialMentionItem
      ? {
          targetId: specialMentionItem.targetId,
          name: specialMentionItem.name,
          college: specialMentionItem.college,
          score: specialMentionItem.totalScore,
          teamCode: specialMentionItem.teamCode,
          members: specialMentionItem.teamMembers,
        }
      : undefined,
    rankings,
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
  };
}
