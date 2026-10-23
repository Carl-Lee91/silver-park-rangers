import { describe, expect, it } from "vitest";
import {
  deadlineFromLocalInput,
  deadlineToLocalInput,
  formatDeadline,
  daysUntil,
  dDayLabel,
  formatMatchDate,
  isVotingOpen,
  matchDateParts,
  seoulToday,
  votingClosesAt,
} from "./matchTime";

describe("한국 날짜", () => {
  it("UTC 15시가 넘으면 한국은 다음 날이다", () => {
    expect(seoulToday(new Date("2026-10-19T14:59:00Z"))).toBe("2026-10-19");
    expect(seoulToday(new Date("2026-10-19T15:00:00Z"))).toBe("2026-10-20");
  });
});

describe("투표 마감 — DB 의 voting_open 과 같다", () => {
  const match = { date: "2026-10-25", startsAt: "10:00", voteDeadline: null };

  it("마감을 안 정했으면 매치 시작(한국 시간)에 마감한다", () => {
    expect(votingClosesAt(match).toISOString()).toBe("2026-10-25T01:00:00.000Z");
  });

  it("마감을 정했으면 그때 마감한다", () => {
    const withDeadline = { ...match, voteDeadline: "2026-10-24T13:00:00+00:00" };
    expect(votingClosesAt(withDeadline).toISOString()).toBe("2026-10-24T13:00:00.000Z");
  });

  it("마감 전에만 열려 있다", () => {
    expect(isVotingOpen(match, new Date("2026-10-25T00:59:59Z"))).toBe(true);
    expect(isVotingOpen(match, new Date("2026-10-25T01:00:00Z"))).toBe(false);
  });
});

describe("표기", () => {
  it("매치 날짜는 월·일·요일로 쓴다", () => {
    expect(formatMatchDate("2026-10-25")).toBe("10월 25일 (일)");
    expect(formatMatchDate("2026-10-24")).toBe("10월 24일 (토)");
  });

  it("일정 칸(풋볼매니저 일정표)에 쓸 월 · 일 · 요일을 나눠 준다", () => {
    expect(matchDateParts("2026-11-01")).toEqual({ month: "11월", day: "1", weekday: "일" });
    expect(matchDateParts("2026-10-24")).toEqual({ month: "10월", day: "24", weekday: "토" });
  });

  it("매치까지 남은 날(D-3)은 한국 날짜로 센다 — 오늘이면 0, 지났으면 음수", () => {
    expect(daysUntil("2026-11-02", "2026-10-30")).toBe(3);
    expect(daysUntil("2026-11-02", "2026-11-02")).toBe(0);
    expect(daysUntil("2026-11-02", "2026-11-03")).toBe(-1);
    expect(daysUntil("2027-01-01", "2026-12-31")).toBe(1);
  });

  it("남은 날 표시는 D-3, 당일은 D-day 다", () => {
    expect(dDayLabel("2026-11-01", "2026-10-29")).toBe("D-3");
    expect(dDayLabel("2026-11-01", "2026-11-01")).toBe("D-day");
  });

  it("투표 마감은 한국 시간으로 쓴다", () => {
    expect(formatDeadline("2026-10-24T13:00:00+00:00")).toBe("10월 24일 (토) 22:00");
  });
});

describe("마감 입력칸(datetime-local) ↔ 저장값", () => {
  it("입력칸 값은 한국 시간으로 읽는다", () => {
    expect(deadlineFromLocalInput("2026-10-24T22:00")).toBe("2026-10-24T22:00:00+09:00");
  });

  it("비어 있으면 마감 없음", () => {
    expect(deadlineFromLocalInput("")).toBeNull();
  });

  it("저장값을 입력칸 값으로 되돌린다", () => {
    expect(deadlineToLocalInput("2026-10-24T13:00:00+00:00")).toBe("2026-10-24T22:00");
    expect(deadlineToLocalInput(null)).toBe("");
  });
});
