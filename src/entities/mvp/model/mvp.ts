import { z } from "zod";

/**
 * 경기 후 MVP 투표(PLAN.md §10). 매치가 끝나고 이틀 동안, 그 매치에 뛴 사람끼리 뽑는다.
 * 🔴 기간은 DB 의 `mvp_open` · `mvp_closed` 와 같다(한국 시각, 끝 시각부터 2일).
 */
export const MVP_DAYS = 2;

export type MvpPhase = "before" | "open" | "closed";

type MatchEnd = { date: string; endsAt: string };

const endOf = ({ date, endsAt }: MatchEnd) => new Date(`${date}T${endsAt}:00+09:00`);

export const mvpClosesAt = (match: MatchEnd) => new Date(endOf(match).getTime() + MVP_DAYS * 24 * 60 * 60 * 1000);

export const mvpPhase = (match: MatchEnd, now: Date = new Date()): MvpPhase => {
  if (now < endOf(match)) return "before";
  return now < mvpClosesAt(match) ? "open" : "closed";
};

export type MvpTally = { memberId: string; realName: string; jerseyNumber: number | null; votes: number };

const tallySchema = z.object({
  candidate_id: z.string(),
  real_name: z.string(),
  jersey_number: z.number().int().nullable(),
  votes: z.number().int(),
});

/** `mvp_results` 의 한 줄 */
export const toMvpTally = (row: unknown): MvpTally => {
  const parsed = tallySchema.parse(row);
  return { memberId: parsed.candidate_id, realName: parsed.real_name, jerseyNumber: parsed.jersey_number, votes: parsed.votes };
};

/** MVP: 가장 많이 받은 사람. 같으면 함께 MVP 다. 아무도 안 뽑았으면 없다 */
export const mvpWinners = (tally: readonly MvpTally[]): MvpTally[] => {
  const top = Math.max(0, ...tally.map((row) => row.votes));
  return top === 0 ? [] : tally.filter((row) => row.votes === top);
};
