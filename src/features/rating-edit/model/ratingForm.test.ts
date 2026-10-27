import { describe, expect, it } from "vitest";
import { parseRatingForm } from "./ratingForm";

const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

const ALL = { pace: "7", shooting: "6", passing: "8", dribbling: "5", defending: "", physical: "10", goalkeeping: "" };

describe("능력치 폼 읽기", () => {
  it("항목마다 1~10 을 숫자로, 비운 칸(미평가)은 null 로 읽는다", () => {
    expect(parseRatingForm(form(ALL))).toEqual({
      ok: true,
      values: { pace: 7, shooting: 6, passing: 8, dribbling: 5, defending: null, physical: 10, goalkeeping: null },
    });
  });

  it("1~10 밖이나 숫자가 아니면 막는다 — DB 제약과 같다", () => {
    for (const bad of ["0", "11", "7.5", "abc"]) {
      expect(parseRatingForm(form({ ...ALL, pace: bad }))).toEqual({ ok: false, error: "능력치는 1~10 사이로 골라 주세요." });
    }
  });

  it("빠진 항목은 미평가로 본다", () => {
    expect(parseRatingForm(form({ pace: "3" }))).toMatchObject({ ok: true, values: { pace: 3, shooting: null } });
  });
});
