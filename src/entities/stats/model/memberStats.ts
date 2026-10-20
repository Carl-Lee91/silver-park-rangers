import type { Position } from "@/entities/position";
import type { StatsEntry, StatsSource } from "./source";

export type MemberStats = {
  memberId: string;
  realName: string;
  status: "approved" | "inactive";
  /** 가입 뒤의 지난 매치 수 */
  eligible: number;
  responded: number;
  responseRate: number | null;
  /** 그중 실제 출석을 정한 매치 수 */
  confirmed: number;
  attended: number;
  attendanceRate: number | null;
  /** 참석으로 투표했고 출석을 정한 매치 수 */
  yesConfirmed: number;
  noShows: number;
  noShowRate: number | null;
  /** 스쿼드에 든(필드든 키퍼든) 매치 수 */
  squadMatches: number;
  fieldQuarters: number;
  keeperQuarters: number;
  avgFieldQuarters: number | null;
  positionCounts: Partial<Record<Position, number>>;
  /** 필드 쿼터 중 선호 포지션에서 뛴 비율 */
  preferredShare: number | null;
  goals: number;
  assists: number;
};

/** 나눌 수 없으면 null — 0 으로 보이면 "한 번도 안 왔다"로 오해한다. */
const ratio = (part: number, whole: number) => (whole === 0 ? null : part / whole);

/**
 * 멤버별 통계(PLAN.md §10 2차). 용병은 뺀다.
 *
 * - 참석률: 출석을 정한 매치 중 실제로 온 비율. 정한 매치에 기록이 없으면 안 온 것이다.
 * - 응답률: 가입 뒤 지난 매치 중 투표한 비율.
 * - 노쇼율: 참석으로 투표하고 출석을 정한 매치 중 안 온(attended = false) 비율.
 * - 출전: 필드 쿼터만 센다. 키퍼 쿼터는 따로 센다(PLAN.md §6).
 */
export const computeMemberStats = (source: StatsSource): MemberStats[] => {
  const entryOf = new Map<string, StatsEntry>();
  for (const entry of source.entries) entryOf.set(`${entry.matchId}:${entry.memberId}`, entry);

  return source.members
    .filter((member) => member.memberType === "member")
    .map((member) => {
      const eligible = source.matches.filter((match) => match.date >= member.joinedOn);
      const confirmed = eligible.filter((match) => match.confirmed);
      const entriesIn = (matches: typeof eligible) =>
        matches.flatMap((match) => {
          const entry = entryOf.get(`${match.id}:${member.id}`);
          return entry ? [entry] : [];
        });

      const responded = entriesIn(eligible).filter((entry) => entry.response !== null).length;
      const attended = entriesIn(confirmed).filter((entry) => entry.attended === true).length;
      const yesConfirmed = entriesIn(confirmed).filter((entry) => entry.response === "yes" && entry.attended !== null);
      const noShows = yesConfirmed.filter((entry) => entry.attended === false).length;

      const mine = source.entries.filter((entry) => entry.memberId === member.id);
      const squad = mine.filter((entry) => entry.fieldQuarters + entry.keeperQuarters > 0);
      const fieldQuarters = mine.reduce((sum, entry) => sum + entry.fieldQuarters, 0);
      const keeperQuarters = mine.reduce((sum, entry) => sum + entry.keeperQuarters, 0);
      const positionCounts: Partial<Record<Position, number>> = {};
      for (const position of mine.flatMap((entry) => entry.positions)) {
        positionCounts[position] = (positionCounts[position] ?? 0) + 1;
      }
      const preferred = member.preferredPositions.reduce((sum, position) => sum + (positionCounts[position] ?? 0), 0);

      return {
        memberId: member.id,
        realName: member.realName,
        status: member.status,
        eligible: eligible.length,
        responded,
        responseRate: ratio(responded, eligible.length),
        confirmed: confirmed.length,
        attended,
        attendanceRate: ratio(attended, confirmed.length),
        yesConfirmed: yesConfirmed.length,
        noShows,
        noShowRate: ratio(noShows, yesConfirmed.length),
        squadMatches: squad.length,
        fieldQuarters,
        keeperQuarters,
        avgFieldQuarters: ratio(fieldQuarters, squad.length),
        positionCounts,
        preferredShare: ratio(preferred, fieldQuarters),
        goals: mine.reduce((sum, entry) => sum + entry.goals, 0),
        assists: mine.reduce((sum, entry) => sum + entry.assists, 0),
      };
    });
};

export type MatchTrendPoint = {
  matchId: string;
  date: string;
  opponent: string | null;
  /** 참석으로 투표한 사람(용병 포함) */
  yes: number;
  /** 실제로 온 사람(용병 포함). 출석을 정하지 않았으면 null */
  attended: number | null;
  guestsAttended: number | null;
};

/** 팀 요약: 매치별 참석 투표·실제 출석 추이와 매치당 평균 출석 인원 */
export const computeTeamSummary = (source: StatsSource) => {
  const guests = new Set(source.members.filter((member) => member.memberType === "guest").map((member) => member.id));
  const trend: MatchTrendPoint[] = source.matches.map((match) => {
    const entries = source.entries.filter((entry) => entry.matchId === match.id);
    const came = entries.filter((entry) => entry.attended === true);
    return {
      matchId: match.id,
      date: match.date,
      opponent: match.opponent,
      yes: entries.filter((entry) => entry.response === "yes").length,
      attended: match.confirmed ? came.length : null,
      guestsAttended: match.confirmed ? came.filter((entry) => guests.has(entry.memberId)).length : null,
    };
  });
  const confirmed = trend.filter((point) => point.attended !== null);
  const scores = source.matches.flatMap((match) => match.quarterScores);
  return {
    /** 쿼터를 한 경기로 센 전적(결과를 남긴 쿼터만) */
    record: {
      win: scores.filter((score) => score.ours > score.theirs).length,
      draw: scores.filter((score) => score.ours === score.theirs).length,
      loss: scores.filter((score) => score.ours < score.theirs).length,
    },
    goalsFor: scores.reduce((sum, score) => sum + score.ours, 0),
    goalsAgainst: scores.reduce((sum, score) => sum + score.theirs, 0),
    matchCount: trend.length,
    confirmedCount: confirmed.length,
    avgAttended: ratio(
      confirmed.reduce((sum, point) => sum + (point.attended ?? 0), 0),
      confirmed.length,
    ),
    trend,
  };
};
