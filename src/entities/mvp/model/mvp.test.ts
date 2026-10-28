import { describe, expect, it } from "vitest";
import { mvpClosesAt, mvpPhase, mvpWinners, toMvpTally } from "./mvp";

const match = { date: "2026-11-01", endsAt: "13:00" };

describe("MVP 투표 기간 (PLAN.md §10 MVP 투표)", () => {
  it("매치가 끝나고 이틀 동안 연다 — 한국 시각", () => {
    expect(mvpClosesAt(match).toISOString()).toBe("2026-11-03T04:00:00.000Z");
  });

  it("끝나기 전 · 여는 중 · 마감", () => {
    expect(mvpPhase(match, new Date("2026-11-01T03:59:00Z"))).toBe("before");
    expect(mvpPhase(match, new Date("2026-11-01T04:00:00Z"))).toBe("open");
    expect(mvpPhase(match, new Date("2026-11-03T03:59:00Z"))).toBe("open");
    expect(mvpPhase(match, new Date("2026-11-03T04:00:00Z"))).toBe("closed");
  });
});

describe("MVP 결과", () => {
  const tally = [
    { candidate_id: "a", real_name: "홍길동", jersey_number: 7, votes: 5 },
    { candidate_id: "b", real_name: "김철수", jersey_number: null, votes: 5 },
    { candidate_id: "c", real_name: "박영희", jersey_number: 10, votes: 2 },
  ].map(toMvpTally);

  it("DB 의 집계를 읽는다", () => {
    expect(tally[0]).toEqual({ memberId: "a", realName: "홍길동", jerseyNumber: 7, votes: 5 });
  });

  it("가장 많이 받은 사람 — 같으면 함께 MVP 다", () => {
    expect(mvpWinners(tally).map((row) => row.realName)).toEqual(["홍길동", "김철수"]);
  });

  it("아무도 투표하지 않았으면 MVP 가 없다", () => {
    expect(mvpWinners([])).toEqual([]);
  });
});
