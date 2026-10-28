import { describe, expect, it } from "vitest";
import { liveQuarter, seoulClock } from "./liveClock";
import { quarterSchedule } from "./quarterSchedule";

const schedule = quarterSchedule({ startsAt: "10:00", endsAt: "13:00", quarterCount: 6 });

describe("현장 모드 지금 쿼터 (PLAN.md §10 현장 모드)", () => {
  it("시작 전이면 몇 분 남았는지", () => {
    expect(liveQuarter(schedule, "09:42")).toEqual({ state: "before", startsIn: 18 });
  });

  it("경기 중이면 몇 쿼터이고 몇 분 남았는지 — 쿼터 시작 시각부터 그 쿼터다", () => {
    expect(liveQuarter(schedule, "10:00")).toEqual({ state: "playing", index: 0, remaining: 30 });
    expect(liveQuarter(schedule, "10:42")).toEqual({ state: "playing", index: 1, remaining: 18 });
    expect(liveQuarter(schedule, "12:59")).toEqual({ state: "playing", index: 5, remaining: 1 });
  });

  it("끝 시각부터는 끝났다", () => {
    expect(liveQuarter(schedule, "13:00")).toEqual({ state: "after" });
  });

  it("한국 시각을 HH:MM 으로", () => {
    expect(seoulClock(new Date("2026-10-28T01:05:00Z"))).toBe("10:05");
  });
});
