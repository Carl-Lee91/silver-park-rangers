import { describe, expect, it } from "vitest";
import { POSITIONS } from "@/entities/position";
import { RATING_KEYS, type RatingValues } from "./rating";
import { playerStrength, POSITION_WEIGHTS, positionScore } from "./positionScore";

const values: RatingValues = { pace: 7, shooting: 5, passing: 7, dribbling: 5, defending: 10, physical: 10, goalkeeping: null };

describe("포지션 가중치(PLAN.md §6 포지션 점수)", () => {
  it("필드 포지션은 필드 능력치 6개에 0~5 가중치를 두고, 골키퍼는 골키퍼 능력치만 본다", () => {
    for (const { code } of POSITIONS) {
      const weights = POSITION_WEIGHTS[code];
      const used = RATING_KEYS.filter((key) => (weights[key] ?? 0) > 0);
      for (const key of RATING_KEYS) expect(weights[key] ?? 0).toBeGreaterThanOrEqual(0);
      for (const key of RATING_KEYS) expect(weights[key] ?? 0).toBeLessThanOrEqual(5);
      if (code === "GK") expect(used).toEqual(["goalkeeping"]);
      else expect(used).not.toContain("goalkeeping");
    }
  });

  it("수비형 미드는 중앙 미드보다, 풀백은 윙백보다 수비를 더 본다", () => {
    expect(POSITION_WEIGHTS.DM.defending!).toBeGreaterThan(POSITION_WEIGHTS.MF.defending!);
    expect(POSITION_WEIGHTS.FB.defending!).toBeGreaterThan(POSITION_WEIGHTS.WB.defending!);
  });
});

describe("포지션 점수", () => {
  it("가중 평균이다 — 같은 사람도 포지션마다 다르다", () => {
    // 센터백: (3·7 + 0·5 + 2·7 + 1·5 + 5·10 + 5·10) / 16
    expect(positionScore(values, "CB")).toBeCloseTo(8.75);
    // 공격수: (3·7 + 5·5 + 1·7 + 3·5 + 0·10 + 4·10) / 16
    expect(positionScore(values, "FW")).toBeCloseTo(6.75);
  });

  it("매기지 않은 항목은 빼고 평균한다", () => {
    expect(positionScore({ ...values, defending: null }, "CB")).toBeCloseTo((3 * 7 + 2 * 7 + 1 * 5 + 5 * 10) / 11);
  });

  it("볼 항목을 하나도 안 매겼으면 null 이다. 골키퍼는 골키퍼 능력치다", () => {
    expect(positionScore({ ...values, pace: null, passing: null, dribbling: null, defending: null, physical: null }, "CB")).toBeNull();
    expect(positionScore(values, "GK")).toBeNull();
    expect(positionScore({ ...values, goalkeeping: 6 }, "GK")).toBe(6);
  });
});

describe("선수 전력(자동 배치 스타일)", () => {
  it("1순위 포지션의 포지션 점수다", () => {
    expect(playerStrength(values, ["CB", "FB", "DM"])).toBeCloseTo(8.75);
    expect(playerStrength(values, ["FW", "AM", "WG"])).toBeCloseTo(6.75);
  });

  it("1순위가 골키퍼거나 그 포지션 점수를 낼 수 없으면 필드 능력치 평균이다", () => {
    expect(playerStrength(values, ["GK"])).toBeCloseTo((7 + 5 + 7 + 5 + 10 + 10) / 6);
    expect(playerStrength({ ...values, shooting: null, pace: null, dribbling: null, passing: null, physical: null }, ["FW"])).toBe(10);
  });
});
