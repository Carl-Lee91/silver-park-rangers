import { describe, expect, it } from "vitest";
import { fieldStrength, RATING_ATTRIBUTES, ratingTone, toRatings } from "./rating";

describe("능력치 항목 (PLAN.md §5 능력치)", () => {
  it("일곱 가지를 이 순서로 둔다 — 피파 카드 여섯 가지 + 골키퍼", () => {
    expect(RATING_ATTRIBUTES.map((attribute) => attribute.label)).toEqual(["속도", "슛", "패스", "개인기", "수비", "피지컬", "골키퍼"]);
  });

  it("항목마다 무엇을 보는지(? 설명)를 갖는다", () => {
    const help = Object.fromEntries(RATING_ATTRIBUTES.map((attribute) => [attribute.label, attribute.help]));
    expect(help["속도"]).toBe("순간 속도, 전력 질주, 뒷공간 침투와 복귀");
    expect(help["피지컬"]).toContain("체력(6쿼터를 버티는지)");
    expect(help["골키퍼"]).toContain("키퍼를 볼 수 있는 사람만");
  });
});

describe("능력치 색 단계", () => {
  it("9~10 최고 · 7~8 잘함 · 4~6 평균 · 1~3 약함 — 자리 적합도와 같은 네 단계", () => {
    expect([10, 9].map(ratingTone)).toEqual(["best", "best"]);
    expect([8, 7].map(ratingTone)).toEqual(["good", "good"]);
    expect([6, 5, 4].map(ratingTone)).toEqual(["fair", "fair", "fair"]);
    expect([3, 1].map(ratingTone)).toEqual(["poor", "poor"]);
  });

  it("매기지 않은 칸은 색이 없다", () => {
    expect(ratingTone(null)).toBeNull();
  });
});

describe("능력치 읽기", () => {
  it("DB 줄을 항목별 값으로 바꾼다. 매기지 않은 칸은 null", () => {
    expect(
      toRatings({
        member_id: "m1",
        pace: 7,
        shooting: 6,
        passing: 8,
        dribbling: 5,
        defending: null,
        physical: 7,
        goalkeeping: null,
        updated_at: "2026-10-27T01:00:00Z",
      }),
    ).toEqual({
      values: { pace: 7, shooting: 6, passing: 8, dribbling: 5, defending: null, physical: 7, goalkeeping: null },
      updatedAt: "2026-10-27T01:00:00Z",
    });
  });

  it("아직 한 번도 매기지 않았으면 모두 비어 있다", () => {
    expect(toRatings(null)).toEqual({
      values: { pace: null, shooting: null, passing: null, dribbling: null, defending: null, physical: null, goalkeeping: null },
      updatedAt: null,
    });
  });
});

describe("선수 전력 (PLAN.md §6 자동 배치 스타일)", () => {
  const none = { pace: null, shooting: null, passing: null, dribbling: null, defending: null, physical: null, goalkeeping: null };

  it("필드 능력치 6개의 평균이다 — 골키퍼는 넣지 않는다", () => {
    expect(fieldStrength({ pace: 9, shooting: 7, passing: 5, dribbling: 6, defending: 4, physical: 5, goalkeeping: 10 })).toBe(6);
  });

  it("미평가 항목은 빼고 평균한다", () => {
    expect(fieldStrength({ ...none, pace: 8, shooting: 6 })).toBe(7);
  });

  it("하나도 매기지 않았으면 전력을 모른다(null) — 골키퍼만 매겨도 마찬가지다", () => {
    expect(fieldStrength(none)).toBeNull();
    expect(fieldStrength({ ...none, goalkeeping: 9 })).toBeNull();
  });
});
