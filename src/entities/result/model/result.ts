import { z } from "zod";

export type Goal = {
  id: string;
  quarter: number;
  /** 비면 득점자 모름(또는 상대 자책골) */
  scorerId: string | null;
  /** 볼 수 없는 멤버(휴면 등)거나 모르면 null */
  scorerName: string | null;
  assistId: string | null;
  assistName: string | null;
};

export type QuarterScore = { number: number; theirScore: number };

export type QuarterResult = { number: number; ours: number; theirs: number; goals: Goal[] };

export type ResultSummary = {
  /** 점수나 골을 남긴 쿼터만 */
  quarters: QuarterResult[];
  total: { ours: number; theirs: number };
  /** 쿼터를 한 경기로 센 전적 */
  record: { win: number; draw: number; loss: number };
};

export const GOAL_COLUMNS =
  "id, quarter_number, scorer_id, assist_id, scorer:members!match_goals_scorer_id_fkey(real_name), assist:members!match_goals_assist_id_fkey(real_name)";

const name = z.object({ real_name: z.string() });
const nameOf = (value: z.infer<typeof name> | z.infer<typeof name>[] | null) =>
  (Array.isArray(value) ? value[0] : value)?.real_name ?? null;

const goalSchema = z.object({
  id: z.string(),
  quarter_number: z.number().int(),
  scorer_id: z.string().nullable(),
  assist_id: z.string().nullable(),
  scorer: z.union([name, z.array(name)]).nullable(),
  assist: z.union([name, z.array(name)]).nullable(),
});

export const toGoals = (rows: unknown): Goal[] =>
  z
    .array(goalSchema)
    .parse(rows)
    .map((row) => ({
      id: row.id,
      quarter: row.quarter_number,
      scorerId: row.scorer_id,
      scorerName: nameOf(row.scorer),
      assistId: row.assist_id,
      assistName: nameOf(row.assist),
    }));

export const toQuarterScores = (rows: unknown): QuarterScore[] =>
  z
    .array(z.object({ number: z.number().int(), their_score: z.number().int() }))
    .parse(rows)
    .map((row) => ({ number: row.number, theirScore: row.their_score }));

/**
 * 쿼터별 결과 요약. 우리 점수는 그 쿼터의 골 기록 수, 상대 점수는 기록한 값이다.
 * 점수도 골도 남기지 않은 쿼터는 아직 안 한(또는 안 적은) 경기로 보고 빼며, 전적에도 넣지 않는다.
 */
export const summarizeResult = (
  quarterCount: number,
  scores: readonly QuarterScore[],
  goals: readonly Goal[],
): ResultSummary => {
  const quarters: QuarterResult[] = [];
  for (let number = 1; number <= quarterCount; number++) {
    const score = scores.find((row) => row.number === number);
    const scored = goals.filter((goal) => goal.quarter === number);
    if (score === undefined && scored.length === 0) continue;
    quarters.push({ number, ours: scored.length, theirs: score?.theirScore ?? 0, goals: scored });
  }
  return {
    quarters,
    total: {
      ours: quarters.reduce((sum, quarter) => sum + quarter.ours, 0),
      theirs: quarters.reduce((sum, quarter) => sum + quarter.theirs, 0),
    },
    record: {
      win: quarters.filter((quarter) => quarter.ours > quarter.theirs).length,
      draw: quarters.filter((quarter) => quarter.ours === quarter.theirs).length,
      loss: quarters.filter((quarter) => quarter.ours < quarter.theirs).length,
    },
  };
};
