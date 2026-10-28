import { describe, expect, it } from "vitest";
import type { Goal } from "@/entities/result";
import { summarizeResult } from "@/entities/result";
import { matchReportText } from "./report";

const goal = (quarter: number, scorerName: string | null, assistName: string | null = null): Goal => ({
  id: `${quarter}-${scorerName}-${assistName}`,
  quarter,
  scorerId: scorerName,
  scorerName,
  assistId: assistName,
  assistName,
});

describe("경기 리포트 (PLAN.md §10)", () => {
  const summary = summarizeResult(
    6,
    [
      { number: 1, theirScore: 0 },
      { number: 2, theirScore: 1 },
      { number: 3, theirScore: 0 },
    ],
    [goal(1, "홍길동", "박영희"), goal(3, "홍길동"), goal(3, "김철수", "박영희"), goal(3, null)],
  );

  it("점수 · 쿼터 · 득점 · 도움 · MVP · 참석을 단톡방에 붙일 글로 만든다", () => {
    expect(
      matchReportText({
        title: "11월 2일 (일) vs FC 한강",
        summary,
        mvp: [{ realName: "홍길동", votes: 5 }],
        attendedCount: 18,
        url: "https://spr.example/matches/m1",
      }).split("\n"),
    ).toEqual([
      "[11월 2일 (일) vs FC 한강] 4 : 1 승",
      "쿼터: 1Q 1:0 · 2Q 0:1 · 3Q 3:0",
      "득점: 홍길동 2 · 김철수 1 · 모름 1",
      "도움: 박영희 2",
      "MVP: 홍길동 (5표)",
      "참석 18명 · 모두 수고하셨습니다!",
      "https://spr.example/matches/m1",
    ]);
  });

  it("골 · 도움 · MVP 가 없으면 그 줄을 뺀다", () => {
    const text = matchReportText({
      title: "vs FC 한강",
      summary: summarizeResult(2, [{ number: 1, theirScore: 2 }], []),
      mvp: [],
      attendedCount: 0,
      url: "u",
    });
    expect(text.split("\n")).toEqual(["[vs FC 한강] 0 : 2 패", "쿼터: 1Q 0:2", "모두 수고하셨습니다!", "u"]);
  });

  it("공동 MVP 는 함께 적는다", () => {
    const text = matchReportText({
      title: "t",
      summary,
      mvp: [
        { realName: "홍길동", votes: 3 },
        { realName: "김철수", votes: 3 },
      ],
      attendedCount: 10,
      url: "u",
    });
    expect(text).toContain("MVP: 홍길동 · 김철수 (각 3표)");
  });
});
