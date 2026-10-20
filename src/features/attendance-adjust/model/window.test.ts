import { describe, expect, it } from "vitest";
import { readWindowForm } from "./window";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
};

describe("관리자의 당일 시간 고치기", () => {
  it("비어 있으면 처음부터·끝까지(null)", () => {
    expect(readWindowForm(form({ matchId: "m", memberId: "a", arriveAt: "", leaveAt: "" }))).toEqual({
      ok: true,
      value: { matchId: "m", memberId: "a", arriveAt: null, leaveAt: null },
    });
  });

  it("도착이 떠나는 시간보다 늦으면 거부한다 — DB 제약과 같다", () => {
    expect(readWindowForm(form({ matchId: "m", memberId: "a", arriveAt: "12:00", leaveAt: "11:00" }))).toEqual({
      ok: false,
      error: "도착은 떠나는 시간보다 빨라야 해요.",
    });
  });

  it("시각 모양이 아니면 거부한다", () => {
    expect(readWindowForm(form({ matchId: "m", memberId: "a", arriveAt: "noon", leaveAt: "" })).ok).toBe(false);
  });
});
