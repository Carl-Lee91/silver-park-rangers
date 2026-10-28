import { describe, expect, it } from "vitest";
import { reminderText } from "./reminder";

describe("독촉 문구 (PLAN.md §4)", () => {
  it("매치 · 아직 안 한 사람 · 마감 · 링크를 단톡방에 붙일 글로 만든다", () => {
    expect(
      reminderText({
        match: "11월 2일 (일) vs FC 한강",
        names: ["김철수", "홍길동"],
        deadline: "11/1(토) 22:00",
        url: "https://spr.example/matches/m1",
      }).split("\n"),
    ).toEqual([
      "[11월 2일 (일) vs FC 한강] 참석 투표 부탁드려요.",
      "아직 안 한 분(2명): 김철수 · 홍길동",
      "마감: 11/1(토) 22:00",
      "https://spr.example/matches/m1",
    ]);
  });

  it("마감이 지났으면 마감 줄을 뺀다", () => {
    expect(reminderText({ match: "vs FC 한강", names: ["김철수"], deadline: null, url: "u" })).not.toContain("마감");
  });
});
