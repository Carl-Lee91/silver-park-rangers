import type { Match } from "@/entities/match";
import { DEFAULT_MATCH_FORM, type MatchFormValues } from "./matchSchema";

const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" 에 며칠을 더한다. 날짜만 다루므로 UTC 로 계산해 시간대가 끼어들지 않게 한다. */
const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/**
 * 새 매치 폼을 미리 채운다. 우리 팀은 매주 같은 요일·시간·장소·종류(축구 · 풋살)로 하니까(PLAN.md §1) 가장 늦은 매치를 불러오고,
 * 날짜는 그다음 주 같은 요일(오늘보다 앞이면 오늘 이후의 같은 요일)로 둔다. 상대 팀과 투표 마감은 매번 다르니 비운다.
 * 지난 매치가 없으면 기본값이다.
 */
export const suggestNewMatch = (previous: Match | null, today: string): MatchFormValues => {
  if (previous === null) return DEFAULT_MATCH_FORM;

  let date = addDays(previous.date, 7);
  while (date < today) date = addDays(date, 7);

  return {
    format: previous.format,
    date,
    startsAt: previous.startsAt,
    endsAt: previous.endsAt,
    quarterCount: String(previous.quarterCount),
    venue: previous.venue ?? "",
    opponent: "",
    voteDeadline: "",
  };
};
