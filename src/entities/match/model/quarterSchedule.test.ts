import { describe, expect, it } from "vitest";
import { availableQuarters, quarterSchedule, timeWindowOptions } from "./quarterSchedule";

const DEFAULT_MATCH = { startsAt: "10:00", endsAt: "13:00", quarterCount: 6 };

describe("쿼터 시각", () => {
  it("기본값(10:00~13:00, 6쿼터)이면 30분 간격으로 시작한다", () => {
    expect(quarterSchedule(DEFAULT_MATCH).map((quarter) => quarter.startsAt)).toEqual([
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
    ]);
  });

  it("쿼터는 다음 쿼터가 시작할 때 끝나고, 마지막 쿼터는 매치가 끝날 때 끝난다", () => {
    const schedule = quarterSchedule(DEFAULT_MATCH);
    expect(schedule[0].endsAt).toBe("10:30");
    expect(schedule[5].endsAt).toBe("13:00");
  });

  it("나누어 떨어지지 않으면 분 단위로 내림한다", () => {
    const schedule = quarterSchedule({ ...DEFAULT_MATCH, quarterCount: 7 });
    expect(schedule.map((quarter) => quarter.startsAt)).toEqual([
      "10:00",
      "10:25",
      "10:51",
      "11:17",
      "11:42",
      "12:08",
      "12:34",
    ]);
  });

  it("DB 가 돌려주는 초 단위 시각(10:00:00)도 읽는다", () => {
    const schedule = quarterSchedule({ startsAt: "10:00:00", endsAt: "13:00:00", quarterCount: 6 });
    expect(schedule[1].startsAt).toBe("10:30");
  });
});

describe("뛸 수 있는 쿼터", () => {
  const schedule = quarterSchedule(DEFAULT_MATCH);

  it("도착·떠나는 시간이 없으면 처음부터 끝까지 뛴다", () => {
    expect(availableQuarters(schedule, { arriveAt: null, leaveAt: null })).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("12:00 에 떠나면 11:30 쿼터까지 뛴다", () => {
    expect(availableQuarters(schedule, { arriveAt: null, leaveAt: "12:00" })).toEqual([0, 1, 2, 3]);
  });

  it("11:00 에 도착하면 11:00 쿼터부터 뛴다", () => {
    expect(availableQuarters(schedule, { arriveAt: "11:00", leaveAt: null })).toEqual([2, 3, 4, 5]);
  });

  it("둘 다 있으면 그 사이 쿼터만 뛴다", () => {
    expect(availableQuarters(schedule, { arriveAt: "11:00", leaveAt: "12:00" })).toEqual([2, 3]);
  });

  it("쿼터 중간에 도착하면 다음 쿼터부터 뛴다", () => {
    expect(availableQuarters(schedule, { arriveAt: "11:10", leaveAt: null })).toEqual([3, 4, 5]);
  });

  it("쿼터가 끝나기 전에 떠나면 그 쿼터는 못 뛴다", () => {
    expect(availableQuarters(schedule, { arriveAt: null, leaveAt: "11:50" })).toEqual([0, 1, 2]);
  });
});

describe("도착·떠나는 시간 고르기 (PLAN.md §6 참석 투표)", () => {
  it("도착은 처음부터 또는 두 번째 쿼터부터의 시작 시각", () => {
    expect(timeWindowOptions(quarterSchedule(DEFAULT_MATCH)).arrive).toEqual([
      { value: "", label: "처음부터" },
      { value: "10:30", label: "10:30 도착" },
      { value: "11:00", label: "11:00 도착" },
      { value: "11:30", label: "11:30 도착" },
      { value: "12:00", label: "12:00 도착" },
      { value: "12:30", label: "12:30 도착" },
    ]);
  });

  it("떠나는 시간은 끝까지 또는 마지막 전 쿼터까지의 끝 시각", () => {
    expect(timeWindowOptions(quarterSchedule(DEFAULT_MATCH)).leave).toEqual([
      { value: "", label: "끝까지" },
      { value: "10:30", label: "10:30 출발" },
      { value: "11:00", label: "11:00 출발" },
      { value: "11:30", label: "11:30 출발" },
      { value: "12:00", label: "12:00 출발" },
      { value: "12:30", label: "12:30 출발" },
    ]);
  });
});
