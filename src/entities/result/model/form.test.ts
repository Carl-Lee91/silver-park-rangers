import { describe, expect, it } from "vitest";
import { groupResultsByMatch, outcomeOf, recentResults } from "./form";

const match = (id: string, date: string, quarters: { ours: number; theirs: number }[], opponent: string | null = `상대${id}`) => ({
  id,
  date,
  opponent,
  quarters,
});

describe("매치 결과 (PLAN.md §7 테마 › 매치 결과)", () => {
  it("그날 쿼터 점수를 더한 합계로 승 · 무 · 패를 정한다", () => {
    expect(outcomeOf({ ours: 4, theirs: 2 })).toBe("win");
    expect(outcomeOf({ ours: 2, theirs: 2 })).toBe("draw");
    expect(outcomeOf({ ours: 1, theirs: 3 })).toBe("loss");
  });

  it("최근 매치부터, 결과를 남긴 매치만 고른다", () => {
    const results = recentResults([
      match("a", "2026-10-05", [{ ours: 1, theirs: 0 }, { ours: 2, theirs: 1 }]),
      match("b", "2026-10-26", [{ ours: 0, theirs: 1 }, { ours: 4, theirs: 1 }]),
      match("c", "2026-10-19", []),
      match("d", "2026-10-12", [{ ours: 2, theirs: 2 }]),
    ]);
    expect(results.map((result) => result.matchId)).toEqual(["b", "d", "a"]);
    expect(results[0]).toEqual({ matchId: "b", date: "2026-10-26", opponent: "상대b", ours: 4, theirs: 2, outcome: "win" });
    expect(results.map((result) => result.outcome)).toEqual(["win", "draw", "win"]);
  });

  it("5개까지만 고른다", () => {
    const many = Array.from({ length: 8 }, (_, index) =>
      match(`m${index}`, `2026-09-${String(10 + index).padStart(2, "0")}`, [{ ours: 1, theirs: 0 }]),
    );
    expect(recentResults(many)).toHaveLength(5);
    expect(recentResults(many)[0].matchId).toBe("m7");
    expect(recentResults(many, 3)).toHaveLength(3);
  });
});

describe("여러 매치의 점수 · 골 기록 나누기", () => {
  it("매치마다 쿼터 점수와 골을 모은다. 기록이 없는 매치도 빈 값으로 둔다", () => {
    const grouped = groupResultsByMatch(
      ["m1", "m2", "m3"],
      [
        { match_id: "m1", number: 1, their_score: 0 },
        { match_id: "m2", number: 2, their_score: 3 },
      ],
      [
        { match_id: "m1", id: "g1", quarter_number: 1, scorer_id: "p1", assist_id: null, scorer: { real_name: "김민준" }, assist: null },
        { match_id: "m1", id: "g2", quarter_number: 1, scorer_id: null, assist_id: null, scorer: null, assist: null },
      ],
    );
    expect(grouped.m1.scores).toEqual([{ number: 1, theirScore: 0 }]);
    expect(grouped.m1.goals.map((goal) => goal.id)).toEqual(["g1", "g2"]);
    expect(grouped.m2).toEqual({ scores: [{ number: 2, theirScore: 3 }], goals: [] });
    expect(grouped.m3).toEqual({ scores: [], goals: [] });
  });
});
