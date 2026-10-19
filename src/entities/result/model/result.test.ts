import { describe, expect, it } from "vitest";
import { summarizeResult, toGoals, toQuarterScores } from "./result";

const goals = toGoals([
  { id: "g1", quarter_number: 1, scorer_id: "a", assist_id: "b", scorer: { real_name: "가공격" }, assist: { real_name: "나도움" } },
  { id: "g2", quarter_number: 1, scorer_id: null, assist_id: null, scorer: null, assist: null },
  { id: "g3", quarter_number: 3, scorer_id: "a", assist_id: null, scorer: { real_name: "가공격" }, assist: null },
]);
const scores = toQuarterScores([
  { number: 1, their_score: 1 },
  { number: 2, their_score: 2 },
  { number: 3, their_score: 1 },
]);

describe("경기 결과 읽기", () => {
  it("골은 득점자·도움 이름과 함께 읽는다. 모르면 null", () => {
    expect(goals[0]).toEqual({ id: "g1", quarter: 1, scorerId: "a", scorerName: "가공격", assistId: "b", assistName: "나도움" });
    expect(goals[1]).toMatchObject({ scorerId: null, scorerName: null });
  });
});

describe("경기 결과 요약", () => {
  const summary = summarizeResult(6, scores, goals);

  it("우리 점수는 골 기록 수, 상대 점수는 기록한 값이다", () => {
    expect(summary.quarters.map((q) => [q.number, q.ours, q.theirs])).toEqual([
      [1, 2, 1],
      [2, 0, 2],
      [3, 1, 1],
    ]);
  });

  it("점수나 골을 남긴 쿼터만 친다", () => {
    expect(summary.quarters).toHaveLength(3);
  });

  it("합계와 쿼터 전적(승·무·패)을 낸다", () => {
    expect(summary.total).toEqual({ ours: 3, theirs: 4 });
    expect(summary.record).toEqual({ win: 1, draw: 1, loss: 1 });
  });

  it("골은 쿼터별로 묶는다", () => {
    expect(summary.quarters[0].goals.map((goal) => goal.id)).toEqual(["g1", "g2"]);
  });

  it("아무것도 안 남겼으면 비어 있다", () => {
    expect(summarizeResult(6, [], [])).toEqual({ quarters: [], total: { ours: 0, theirs: 0 }, record: { win: 0, draw: 0, loss: 0 } });
  });
});
