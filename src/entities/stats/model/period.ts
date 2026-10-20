export type StatsPeriod = "recent4w" | "season" | "all";

export const PERIOD_LABELS: Record<StatsPeriod, string> = {
  recent4w: "최근 4주",
  season: "올해",
  all: "전체",
};

const PERIODS = Object.keys(PERIOD_LABELS) as StatsPeriod[];

/** 주소(?period=)에서 읽는다. 모르는 값이면 올해다. */
export const parsePeriod = (value: string | undefined): StatsPeriod =>
  PERIODS.find((period) => period === value) ?? "season";

const daysBefore = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);

/**
 * 기간의 시작·끝(한국 날짜). 끝은 오늘이지만, DB 는 오늘 이전(지난) 매치만 준다.
 * "올해"를 시즌으로 본다 — 따로 시즌을 정하지 않았다.
 */
export const periodRange = (period: StatsPeriod, today: string) => {
  if (period === "recent4w") return { from: daysBefore(today, 28), to: today };
  if (period === "season") return { from: `${today.slice(0, 4)}-01-01`, to: today };
  return { from: "2000-01-01", to: today };
};
