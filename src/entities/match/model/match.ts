import { z } from "zod";

/** 매치 종류(PLAN.md §6 "풋살"). 풋살은 쿼터 · 스쿼드 대신 팀 나누기다 */
export type MatchFormat = "football" | "futsal5" | "futsal6";

export const MATCH_FORMATS: readonly MatchFormat[] = ["football", "futsal5", "futsal6"];

export const FORMAT_LABELS: Record<MatchFormat, string> = { football: "축구", futsal5: "풋살 5:5", futsal6: "풋살 6:6" };

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
  format: MatchFormat;
  /** 풋살 팀 수(2 · 3). 축구에서는 쓰지 않는다 */
  teamCount: number;
};

export const MATCH_COLUMNS =
  "id, match_date, starts_at, ends_at, quarter_count, venue, opponent, vote_deadline, squad_published_at, share_token, format, team_count";

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
  format: z.enum(MATCH_FORMATS).default("football"),
  team_count: z.number().int().default(2),
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
    format: parsed.format,
    teamCount: parsed.team_count,
  };
};

export const matchTitle = (match: Pick<Match, "opponent">) =>
  match.opponent ? `vs ${match.opponent}` : "상대 미정";

/** 팀 이름 앞에 흔히 붙는 영문 머리말. 이것만 보면 어느 팀인지 알 수 없어서 건너뛴다 */
const CLUB_PREFIX = /^(FC|SC|AFC|CF|FK|AC|SV)$/i;

/** 엠블럼이 없는 상대를 동그라미 안에 한 글자로 보인다. "FC 한강" → "한", 상대를 안 정했으면 "?" */
export const opponentInitial = (opponent: string | null) => {
  const words = (opponent ?? "").trim().split(/\s+/).filter(Boolean);
  const name = words.length > 1 && CLUB_PREFIX.test(words[0]) ? words[1] : words[0];
  return name ? name[0].toUpperCase() : "?";
};

export const isFutsal = (match: Pick<Match, "format">) => match.format !== "football";

/** 한쪽 경기 인원: 축구 11명, 풋살 5 · 6명. 풋살 팀이 이보다 적으면 경고한다 */
export const playersPerSide = (format: MatchFormat) => (format === "futsal5" ? 5 : format === "futsal6" ? 6 : 11);

/** 매치 모양: 축구면 "6쿼터", 풋살이면 "풋살 5:5" */
export const matchShape = (match: Pick<Match, "format" | "quarterCount">) =>
  isFutsal(match) ? FORMAT_LABELS[match.format] : `${match.quarterCount}쿼터`;
