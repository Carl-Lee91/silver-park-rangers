import { describe, expect, it } from "vitest";
import type { MemberStats } from "./memberStats";
import { rateScale, topScorers } from "./display";

describe("비율 색 단계 (PLAN.md §7 테마 › 값에 붙는 색)", () => {
  it("90% · 75% · 60% 를 기준으로 네 단계다 — 자리 적합도 색과 같은 단계", () => {
    expect(rateScale(1)).toBe("best");
    expect(rateScale(0.9)).toBe("best");
    expect(rateScale(0.89)).toBe("good");
    expect(rateScale(0.75)).toBe("good");
    expect(rateScale(0.6)).toBe("fair");
    expect(rateScale(0.59)).toBe("poor");
    expect(rateScale(0)).toBe("poor");
  });

  it("낼 수 없는 값(null)은 색이 없다", () => {
    expect(rateScale(null)).toBeNull();
  });
});

const row = (realName: string, goals: number, assists: number) => ({ memberId: realName, realName, goals, assists }) as MemberStats;

describe("득점 순위", () => {
  it("골이 많은 순, 같으면 도움이 많은 순, 그래도 같으면 이름순이다", () => {
    const ranked = topScorers([row("다", 3, 0), row("가", 5, 1), row("나", 3, 2), row("라", 3, 2)]);
    expect(ranked.map((scorer) => scorer.realName)).toEqual(["가", "나", "라", "다"]);
  });

  it("골이 없는 사람은 넣지 않고, 5명까지만 둔다", () => {
    const ranked = topScorers([row("영", 0, 3), ...Array.from({ length: 7 }, (_, index) => row(`p${index}`, 7 - index, 0))]);
    expect(ranked).toHaveLength(5);
    expect(ranked.some((scorer) => scorer.realName === "영")).toBe(false);
  });
});
