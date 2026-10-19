import { describe, expect, it } from "vitest";
import { quarterSchedule } from "@/entities/match";
import { readVoteForm, validateVote } from "./attendanceVote";

const schedule = quarterSchedule({ startsAt: "10:00", endsAt: "13:00", quarterCount: 6 });

describe("투표 검증", () => {
  it("참석은 고른 시간을 그대로 둔다", () => {
    expect(validateVote({ response: "yes", arriveAt: "", leaveAt: "12:00" }, schedule)).toEqual({
      ok: true,
      value: { response: "yes", arriveAt: null, leaveAt: "12:00" },
    });
  });

  it("불참이면 시간은 버린다", () => {
    expect(validateVote({ response: "no", arriveAt: "11:00", leaveAt: "12:00" }, schedule)).toEqual({
      ok: true,
      value: { response: "no", arriveAt: null, leaveAt: null },
    });
  });

  it("참석 여부를 안 골랐으면 알려준다", () => {
    expect(validateVote({ response: "", arriveAt: "", leaveAt: "" }, schedule)).toEqual({
      ok: false,
      error: "참석 여부를 골라 주세요.",
    });
  });

  it("고를 수 없는 시각은 거부한다", () => {
    expect(validateVote({ response: "yes", arriveAt: "10:45", leaveAt: "" }, schedule).ok).toBe(false);
  });

  it("뛸 수 있는 쿼터가 하나도 없으면 다시 고르게 한다", () => {
    expect(validateVote({ response: "yes", arriveAt: "12:00", leaveAt: "11:00" }, schedule)).toEqual({
      ok: false,
      error: "뛸 수 있는 쿼터가 없어요. 도착·떠나는 시간을 다시 골라 주세요.",
    });
  });

  it("폼 데이터를 읽는다", () => {
    const data = new FormData();
    data.append("response", "maybe");
    data.append("arriveAt", "11:00");
    expect(readVoteForm(data)).toEqual({ response: "maybe", arriveAt: "11:00", leaveAt: "" });
  });
});
