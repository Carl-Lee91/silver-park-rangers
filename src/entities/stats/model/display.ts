import type { MemberStats } from "./memberStats";

export type RateScale = "best" | "good" | "fair" | "poor";

/**
 * 비율(참석률 · 응답률)의 색 단계(PLAN.md §7 "테마"). 자리 적합도 색과 같은 네 단계다 — 90% · 75% · 60%.
 * 낼 수 없는 값(null)은 색이 없다.
 */
export const rateScale = (rate: number | null): RateScale | null => {
  if (rate === null) return null;
  if (rate >= 0.9) return "best";
  if (rate >= 0.75) return "good";
  if (rate >= 0.6) return "fair";
  return "poor";
};

/** 득점 순위: 골 많은 순 → 도움 많은 순 → 이름순. 골이 없는 사람은 뺀다 */
export const topScorers = (stats: readonly MemberStats[], limit = 5): MemberStats[] =>
  stats
    .filter((row) => row.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.realName.localeCompare(b.realName, "ko"))
    .slice(0, limit);
