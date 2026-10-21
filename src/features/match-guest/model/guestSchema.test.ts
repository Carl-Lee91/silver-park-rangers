import { describe, expect, it } from "vitest";
import { readGuestForm, toGuestRpcArgs, validateGuest } from "./guestSchema";

const valid = { realName: " 오늘용병 ", feet: ["right"], preferredPositions: ["CB", "MF", "WB"], jerseyNumber: "7" };

describe("그날 용병 입력 검증 (PLAN.md §4) — 가입한 멤버와 같은 규칙", () => {
  it("올바르면 다듬은 값을 돌려준다", () => {
    expect(validateGuest(valid)).toEqual({
      ok: true,
      value: { realName: "오늘용병", feet: ["right"], preferredPositions: ["CB", "MF", "WB"], jerseyNumber: 7 },
    });
  });

  it("포지션 3개, 1순위 골키퍼면 하나", () => {
    expect(validateGuest({ ...valid, preferredPositions: ["GK"] }).ok).toBe(true);
    expect(validateGuest({ ...valid, preferredPositions: ["CB"] })).toEqual({
      ok: false,
      errors: { preferredPositions: "선호 포지션을 3개 골라 주세요." },
    });
  });

  it("이름과 주발은 꼭 넣는다", () => {
    const result = validateGuest({ ...valid, realName: "", feet: [] });
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(["feet", "realName"]);
  });
});

describe("DB 함수에 넘길 값", () => {
  it("add_match_guest · update_match_guest 의 인자 이름으로 바꾼다", () => {
    expect(
      toGuestRpcArgs({ realName: "오늘용병", feet: ["left"], preferredPositions: ["GK"], jerseyNumber: null }),
    ).toEqual({ guest_name: "오늘용병", guest_feet: ["left"], guest_positions: ["GK"], guest_number: null });
  });
});

describe("폼 데이터 읽기", () => {
  it("선호 포지션은 고른 순서를 지킨다", () => {
    const data = new FormData();
    data.append("realName", "용병");
    data.append("feet", "left");
    data.append("preferredPositions", "WG");
    data.append("preferredPositions", "FW");
    data.append("jerseyNumber", "");
    expect(readGuestForm(data)).toEqual({ realName: "용병", feet: ["left"], preferredPositions: ["WG", "FW"], jerseyNumber: "" });
  });
});
