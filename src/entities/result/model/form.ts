import { summarizeResult, toGoals, toQuarterScores, type Goal, type QuarterScore } from "./result";

export type Outcome = "win" | "draw" | "loss";

export const OUTCOME_LABELS: Record<Outcome, string> = { win: "승", draw: "무", loss: "패" };

/** 매치 결과(PLAN.md §7 "매치 결과"): 그날 쿼터 점수를 더한 합계로 정한다 */
export const outcomeOf = ({ ours, theirs }: { ours: number; theirs: number }): Outcome =>
  ours > theirs ? "win" : ours < theirs ? "loss" : "draw";

/** 결과 한 줄: 매치 · 합계 점수 · 승무패 */
export type MatchResultLine = {
  matchId: string;
  date: string;
  opponent: string | null;
  ours: number;
  theirs: number;
  outcome: Outcome;
};

type ResultSource = {
  id: string;
  date: string;
  opponent: string | null;
  /** 결과를 남긴 쿼터의 점수 */
  quarters: readonly { ours: number; theirs: number }[];
};

/** 결과를 남긴 매치만 최근 순으로 limit 개(최근 폼). 쿼터 결과가 하나도 없으면 결과가 없는 매치다 */
export const recentResults = (matches: readonly ResultSource[], limit = 5): MatchResultLine[] =>
  matches
    .filter((match) => match.quarters.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((match) => {
      const ours = match.quarters.reduce((sum, quarter) => sum + quarter.ours, 0);
      const theirs = match.quarters.reduce((sum, quarter) => sum + quarter.theirs, 0);
      return { matchId: match.id, date: match.date, opponent: match.opponent, ours, theirs, outcome: outcomeOf({ ours, theirs }) };
    });

type MatchRow = { match_id: string };

/** 여러 매치를 한 번에 읽은 쿼터 점수 · 골 줄을 매치마다 나눈다. 기록이 없는 매치도 빈 값으로 둔다 */
export const groupResultsByMatch = (
  matchIds: readonly string[],
  scoreRows: readonly (MatchRow & Record<string, unknown>)[],
  goalRows: readonly (MatchRow & Record<string, unknown>)[],
): Record<string, { scores: QuarterScore[]; goals: Goal[] }> =>
  Object.fromEntries(
    matchIds.map((id) => [
      id,
      {
        scores: toQuarterScores(scoreRows.filter((row) => row.match_id === id)),
        goals: toGoals(goalRows.filter((row) => row.match_id === id)),
      },
    ]),
  );

/** 매치마다 쿼터 결과(우리 점수 = 골 수)를 붙인다. 기록을 못 읽은 매치는 결과가 없는 매치다 */
export const withQuarterResults = <M extends { id: string; date: string; opponent: string | null; quarterCount: number }>(
  matches: readonly M[],
  results: Readonly<Record<string, { scores: QuarterScore[]; goals: Goal[] }>>,
) =>
  matches.map((match) => ({
    ...match,
    quarters: summarizeResult(match.quarterCount, results[match.id]?.scores ?? [], results[match.id]?.goals ?? []).quarters,
  }));
