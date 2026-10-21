import { describe, expect, it } from "vitest";
import { readOnboardingForm, validateOnboarding } from "./onboardingSchema";

const form = (entries: [string, string][]) => {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
};

describe("온보딩 입력 검증 (PLAN.md §5)", () => {
  const valid = { realName: "김운영", feet: ["right"], preferredPositions: ["MF", "CB", "WB"], jerseyNumber: "" };

  it("올바르면 앞뒤 공백을 지운 값을 돌려준다", () => {
    expect(validateOnboarding({ ...valid, realName: "  김운영 " })).toEqual({
      ok: true,
      value: { realName: "김운영", feet: ["right"], preferredPositions: ["MF", "CB", "WB"], jerseyNumber: null },
    });
  });

  it("등번호를 고르면 숫자로 돌려준다", () => {
    const result = validateOnboarding({ ...valid, jerseyNumber: "7" });
    expect(result.ok && result.value.jerseyNumber).toBe(7);
    expect(validateOnboarding({ ...valid, jerseyNumber: "100" })).toEqual({
      ok: false,
      errors: { jerseyNumber: "등번호는 0~99 사이로 골라 주세요." },
    });
  });

  it("실명이 비면 알려준다", () => {
    expect(validateOnboarding({ ...valid, realName: "   " })).toEqual({
      ok: false,
      errors: { realName: "실명을 입력해 주세요." },
    });
  });

  it("실명은 20자까지다 — DB 제약과 같다", () => {
    const result = validateOnboarding({ ...valid, realName: "가".repeat(21) });
    expect(result).toEqual({ ok: false, errors: { realName: "실명은 20자까지 입력할 수 있어요." } });
  });

  it("주발은 하나 이상 고른다", () => {
    expect(validateOnboarding({ ...valid, feet: [] })).toEqual({
      ok: false,
      errors: { feet: "주로 쓰는 발을 골라 주세요." },
    });
  });

  it("주발은 양발까지 고를 수 있다", () => {
    expect(validateOnboarding({ ...valid, feet: ["left", "right"] }).ok).toBe(true);
  });

  it("선호 포지션은 3개다 — 1순위가 골키퍼면 하나", () => {
    expect(validateOnboarding({ ...valid, preferredPositions: [] })).toEqual({
      ok: false,
      errors: { preferredPositions: "선호 포지션을 3개 골라 주세요." },
    });
    expect(validateOnboarding({ ...valid, preferredPositions: ["FW", "AM", "WG", "MF"] }).ok).toBe(false);
    expect(validateOnboarding({ ...valid, preferredPositions: ["GK"] }).ok).toBe(true);
  });

  it("같은 값을 두 번 고를 수 없다", () => {
    expect(validateOnboarding({ ...valid, preferredPositions: ["FW", "FW", "CB"] }).ok).toBe(false);
    expect(validateOnboarding({ ...valid, feet: ["left", "left"] }).ok).toBe(false);
  });

  it("모르는 값은 거부한다", () => {
    expect(validateOnboarding({ ...valid, preferredPositions: ["ST"] }).ok).toBe(false);
    expect(validateOnboarding({ ...valid, feet: ["both"] }).ok).toBe(false);
  });

  it("틀린 곳이 여럿이면 전부 알려준다", () => {
    const result = validateOnboarding({ realName: "", feet: [], preferredPositions: [], jerseyNumber: "" });
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(["feet", "preferredPositions", "realName"]);
  });
});

describe("폼 데이터 읽기", () => {
  it("선호 포지션은 고른 순서(폼에 들어간 순서)를 그대로 지킨다", () => {
    const data = form([
      ["realName", "김운영"],
      ["feet", "left"],
      ["preferredPositions", "CB"],
      ["preferredPositions", "FW"],
      ["jerseyNumber", "9"],
    ]);
    expect(readOnboardingForm(data)).toEqual({
      realName: "김운영",
      feet: ["left"],
      preferredPositions: ["CB", "FW"],
      jerseyNumber: "9",
    });
  });

  it("값이 없으면 빈 값으로 읽는다", () => {
    expect(readOnboardingForm(form([]))).toEqual({ realName: "", feet: [], preferredPositions: [], jerseyNumber: "" });
  });
});
