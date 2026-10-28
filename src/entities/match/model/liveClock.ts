import type { QuarterTime } from "./quarterSchedule";

/**
 * 현장 모드의 지금 쿼터(PLAN.md §10 현장 모드). 쿼터 시작 시각부터 그 쿼터이고, 끝 시각부터 끝났다.
 * 쿼터 시각은 매치 시간을 똑같이 나눈 것이라(6장) 쿼터 사이에 쉬는 틈이 없다.
 */
export type LiveQuarter =
  | { state: "before"; startsIn: number }
  | { state: "playing"; index: number; remaining: number }
  | { state: "after" };

const minutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

export const liveQuarter = (schedule: readonly QuarterTime[], now: string): LiveQuarter => {
  const at = minutes(now);
  const first = schedule[0];
  if (first === undefined || at >= minutes(schedule[schedule.length - 1].endsAt)) return { state: "after" };
  if (at < minutes(first.startsAt)) return { state: "before", startsIn: minutes(first.startsAt) - at };
  const index = schedule.findIndex((quarter) => at < minutes(quarter.endsAt));
  return { state: "playing", index, remaining: minutes(schedule[index].endsAt) - at };
};

const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** 한국 시각 "HH:MM" */
export const seoulClock = (now: Date = new Date()) => clock.format(now);
