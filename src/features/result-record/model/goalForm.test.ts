import { describe, expect, it } from "vitest";
import { readGoalForm, readScoreForm } from "./goalForm";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
};

describe("골 기록 입력", () => {
  it("득점자·도움이 비어 있으면 모름(null)", () => {
    expect(readGoalForm(form({ matchId: "m", quarter: "2", scorerId: "", assistId: "" }))).toEqual({
      ok: true,
      value: { matchId: "m", quarter: 2, scorerId: null, assistId: null },
    });
  });

  it("득점자와 도움이 같으면 거부한다 — DB 제약과 같다", () => {
    expect(readGoalForm(form({ matchId: "m", quarter: "1", scorerId: "a", assistId: "a" }))).toEqual({
      ok: false,
      error: "득점과 도움은 다른 사람이어야 해요.",
    });
  });

  it("쿼터 번호가 이상하면 거부한다", () => {
    expect(readGoalForm(form({ matchId: "m", quarter: "x", scorerId: "", assistId: "" })).ok).toBe(false);
  });
});

describe("상대 점수 입력", () => {
  it("0~99 사이 정수", () => {
    expect(readScoreForm(form({ matchId: "m", quarter: "1", theirScore: "3" }))).toEqual({
      ok: true,
      value: { matchId: "m", quarter: 1, theirScore: 3 },
    });
    expect(readScoreForm(form({ matchId: "m", quarter: "1", theirScore: "-1" })).ok).toBe(false);
  });
});
