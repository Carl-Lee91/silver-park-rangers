import { z } from "zod";

/** 하루 일정(PLAN.md §1 용어). 시각은 "HH:MM", 날짜는 "YYYY-MM-DD"(한국 날짜)다. */
export type Match = {
  id: string;
  date: string;
  startsAt: string;
  endsAt: string;
  quarterCount: number;
  venue: string | null;
  opponent: string | null;
  /** ISO 시각. null 이면 매치 시작에 마감한다(votingClosesAt) */
  voteDeadline: string | null;
  /** null 이면 스쿼드가 공개 전이다 */
  squadPublishedAt: string | null;
  /** 카톡 공유 주소(/s/[shareToken])에 쓰는 추측할 수 없는 값 */
  shareToken: string;
};

export const MATCH_COLUMNS =
  "id, match_date, starts_at, ends_at, quarter_count, venue, opponent, vote_deadline, squad_published_at, share_token";

// DB 의 time 은 "10:00:00" 으로 온다. 화면과 계산은 "10:00" 을 쓴다.
const time = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/)
  .transform((value) => value.slice(0, 5));

const rowSchema = z.object({
  id: z.string(),
  match_date: z.string(),
  starts_at: time,
  ends_at: time,
  quarter_count: z.number().int(),
  venue: z.string().nullable(),
  opponent: z.string().nullable(),
  vote_deadline: z.string().nullable(),
  squad_published_at: z.string().nullable(),
  share_token: z.string(),
});

export const toMatch = (row: unknown): Match => {
  const parsed = rowSchema.parse(row);
  return {
    id: parsed.id,
    date: parsed.match_date,
    startsAt: parsed.starts_at,
    endsAt: parsed.ends_at,
    quarterCount: parsed.quarter_count,
    venue: parsed.venue,
    opponent: parsed.opponent,
    voteDeadline: parsed.vote_deadline,
    squadPublishedAt: parsed.squad_published_at,
    shareToken: parsed.share_token,
  };
};

export const matchTitle = (match: Pick<Match, "opponent">) =>
  match.opponent ? `vs ${match.opponent}` : "상대 미정";
