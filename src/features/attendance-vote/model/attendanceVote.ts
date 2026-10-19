import type { AttendanceResponse } from "@/entities/attendance";
import { availableQuarters, type QuarterTime } from "@/entities/match";

export type Vote = {
  response: AttendanceResponse;
  arriveAt: string | null;
  leaveAt: string | null;
};

export type VoteState = { error?: string };

export type TimeOption = { value: string; label: string };

/**
 * 도착·떠나는 시간 선택지(PLAN.md §6). 쿼터 경계에서만 고른다 — 쿼터 중간에 오가는 것은
 * 그 쿼터를 못 뛰는 것과 같다. 첫 쿼터 시작 도착은 "처음부터", 마지막 쿼터 끝 출발은 "끝까지"다.
 */
export const attendanceTimeOptions = (schedule: readonly QuarterTime[]) => ({
  arrive: [
    { value: "", label: "처음부터" },
    ...schedule.slice(1).map((quarter) => ({ value: quarter.startsAt, label: `${quarter.startsAt} 도착` })),
  ],
  leave: [
    { value: "", label: "끝까지" },
    ...schedule.slice(0, -1).map((quarter) => ({ value: quarter.endsAt, label: `${quarter.endsAt} 출발` })),
  ],
});

/** 고른 시간에 뛸 수 있는 쿼터 번호 */
export const playableQuarters = (
  schedule: readonly QuarterTime[],
  arriveAt: string,
  leaveAt: string,
) => availableQuarters(schedule, { arriveAt: arriveAt || null, leaveAt: leaveAt || null });

const RESPONSES: AttendanceResponse[] = ["yes", "maybe", "no"];

export const validateVote = (
  input: { response: string; arriveAt: string; leaveAt: string },
  schedule: readonly QuarterTime[],
): { ok: true; value: Vote } | { ok: false; error: string } => {
  const response = RESPONSES.find((candidate) => candidate === input.response);
  if (response === undefined) return { ok: false, error: "참석 여부를 골라 주세요." };
  // 안 오는 사람의 시간은 의미가 없다.
  if (response === "no") return { ok: true, value: { response, arriveAt: null, leaveAt: null } };

  const options = attendanceTimeOptions(schedule);
  const known = (list: TimeOption[], value: string) => list.some((option) => option.value === value);
  if (!known(options.arrive, input.arriveAt) || !known(options.leave, input.leaveAt)) {
    return { ok: false, error: "시간을 다시 골라 주세요." };
  }
  if (playableQuarters(schedule, input.arriveAt, input.leaveAt).length === 0) {
    return { ok: false, error: "뛸 수 있는 쿼터가 없어요. 도착·떠나는 시간을 다시 골라 주세요." };
  }
  return {
    ok: true,
    value: { response, arriveAt: input.arriveAt || null, leaveAt: input.leaveAt || null },
  };
};

export const readVoteForm = (formData: FormData) => ({
  response: String(formData.get("response") ?? ""),
  arriveAt: String(formData.get("arriveAt") ?? ""),
  leaveAt: String(formData.get("leaveAt") ?? ""),
});
