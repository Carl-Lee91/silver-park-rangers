import { describe, expect, it } from "vitest";
import { readProfileForm, toProfileUpdate, toRegisterRpcArgs, validateProfile, validateRegister } from "./registerSchema";

const valid = { realName: " 홍길동 ", feet: ["right"], preferredPositions: ["CB", "FB", "DM"], jerseyNumber: "4", kind: "member" };

describe("선수 등록 (PLAN.md §4 관리자 등록)", () => {
  it("가입 신청과 같은 규칙에 멤버 / 용병을 더한다", () => {
    const result = validateRegister(valid);
    expect(result).toEqual({
      ok: true,
      value: { realName: "홍길동", feet: ["right"], preferredPositions: ["CB", "FB", "DM"], jerseyNumber: 4, kind: "member" },
    });
  });

  it("멤버인지 용병인지 고르지 않으면 막는다", () => {
    const result = validateRegister({ ...valid, kind: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.kind).toBe("멤버인지 용병인지 골라 주세요.");
  });

  it("선호 포지션 규칙은 가입 신청과 같다 — 1순위 골키퍼면 하나만", () => {
    expect(validateRegister({ ...valid, preferredPositions: ["GK"] }).ok).toBe(true);
    const result = validateRegister({ ...valid, preferredPositions: ["GK", "CB", "FB"] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.preferredPositions).toBe("1순위가 골키퍼면 골키퍼 하나만 골라요.");
  });

  it("DB 함수(register_member)의 인자로 바꾼다", () => {
    const result = validateRegister({ ...valid, kind: "guest", jerseyNumber: "" });
    if (!result.ok) throw new Error("valid");
    expect(toRegisterRpcArgs(result.value)).toEqual({
      member_name: "홍길동",
      member_feet: ["right"],
      member_positions: ["CB", "FB", "DM"],
      member_number: null,
      kind: "guest",
    });
  });
});

describe("관리자가 프로필 고치기", () => {
  it("구분 없이 이름 · 주발 · 포지션 · 등번호만 본다", () => {
    const result = validateProfile({ ...valid, kind: "" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(toProfileUpdate(result.value)).toEqual({
        real_name: "홍길동",
        feet: ["right"],
        preferred_positions: ["CB", "FB", "DM"],
        jersey_number: 4,
      });
    }
  });

  it("폼에서 읽을 때 선호 포지션은 들어간 순서 그대로다", () => {
    const formData = new FormData();
    formData.set("realName", "김철수");
    formData.append("feet", "left");
    for (const code of ["FW", "WG", "AM"]) formData.append("preferredPositions", code);
    formData.set("jerseyNumber", "9");
    formData.set("kind", "guest");
    expect(readProfileForm(formData)).toEqual({
      realName: "김철수",
      feet: ["left"],
      preferredPositions: ["FW", "WG", "AM"],
      jerseyNumber: "9",
      kind: "guest",
    });
  });
});
