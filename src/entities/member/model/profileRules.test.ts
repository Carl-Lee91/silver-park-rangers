import { describe, expect, it } from "vitest";
import {
  isPositionChoiceComplete,
  isPositionLocked,
  jerseyNumberField,
  profileFieldsSchema,
  realNameField,
  toggleFoot,
  togglePosition,
} from "./profileRules";

describe("주발 고르기", () => {
  it("누른 순서와 상관없이 왼발·오른발 순서로 둔다", () => {
    expect(toggleFoot(["right"], "left")).toEqual(["left", "right"]);
  });

  it("다시 누르면 뺀다", () => {
    expect(toggleFoot(["left", "right"], "left")).toEqual(["right"]);
  });
});

describe("선호 포지션 고르기 (PLAN.md §5)", () => {
  it("누른 순서가 우선순위다", () => {
    expect(togglePosition(togglePosition([], "CB"), "FW")).toEqual(["CB", "FW"]);
  });

  it("3개를 넘게 고를 수 없다", () => {
    expect(togglePosition(["CB", "FW", "WG"], "MF")).toEqual(["CB", "FW", "WG"]);
  });

  it("빼면 뒤 순위가 당겨진다", () => {
    expect(togglePosition(["CB", "FW", "WG"], "CB")).toEqual(["FW", "WG"]);
  });

  it("1순위로 골키퍼를 고르면 다른 포지션은 더 고를 수 없다", () => {
    expect(togglePosition(["GK"], "CB")).toEqual(["GK"]);
  });

  it("골키퍼를 2·3순위로는 고를 수 있다", () => {
    expect(togglePosition(["CB"], "GK")).toEqual(["CB", "GK"]);
    expect(togglePosition(["CB", "MF"], "GK")).toEqual(["CB", "MF", "GK"]);
  });

  it("앞 순위를 빼서 골키퍼가 1순위가 되면 골키퍼 하나만 남는다", () => {
    expect(togglePosition(["CB", "GK", "MF"], "CB")).toEqual(["GK"]);
  });

  it("막힌 포지션: 3개를 다 골랐거나 1순위가 골키퍼면 나머지는 막힌다", () => {
    expect(isPositionLocked(["GK"], "CB")).toBe(true);
    expect(isPositionLocked(["GK"], "GK")).toBe(false);
    expect(isPositionLocked(["CB", "FW", "WG"], "MF")).toBe(true);
    expect(isPositionLocked(["CB", "FW", "WG"], "FW")).toBe(false);
    expect(isPositionLocked(["CB"], "GK")).toBe(false);
  });

  it("다 고른 것: 3개, 또는 1순위 골키퍼 하나", () => {
    expect(isPositionChoiceComplete(["CB", "FW", "WG"])).toBe(true);
    expect(isPositionChoiceComplete(["GK"])).toBe(true);
    expect(isPositionChoiceComplete(["CB", "GK"])).toBe(false);
    expect(isPositionChoiceComplete([])).toBe(false);
  });
});

describe("주발·선호 포지션 검증 — DB 제약과 같다", () => {
  const check = (feet: string[], preferredPositions: string[]) =>
    profileFieldsSchema.safeParse({ feet, preferredPositions });

  it("3개 또는 골키퍼 하나면 통과한다", () => {
    expect(check(["left"], ["MF", "CB", "WB"]).success).toBe(true);
    expect(check(["left"], ["MF", "GK", "WB"]).success).toBe(true);
    expect(check(["left", "right"], ["GK"]).success).toBe(true);
  });

  it("3개보다 적으면 3개를 고르라고 한다", () => {
    const result = check(["left"], ["MF", "CB"]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("선호 포지션을 3개 골라 주세요.");
  });

  it("1순위 골키퍼에 다른 포지션을 더하면 거부한다", () => {
    const result = check(["left"], ["GK", "CB", "MF"]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("1순위가 골키퍼면 골키퍼 하나만 골라요.");
  });

  it("주발 없음, 포지션 없음·4개·중복·모르는 값은 거부한다", () => {
    expect(check([], ["MF", "CB", "WB"]).success).toBe(false);
    expect(check(["left"], []).success).toBe(false);
    expect(check(["left"], ["FW", "AM", "WG", "MF"]).success).toBe(false);
    expect(check(["left"], ["FW", "FW", "CB"]).success).toBe(false);
    expect(check(["left"], ["ST", "FW", "CB"]).success).toBe(false);
    expect(check(["left", "left"], ["MF", "CB", "WB"]).success).toBe(false);
  });
});

describe("실명 검증 — DB 제약과 같다", () => {
  it("앞뒤 공백을 지운다", () => {
    expect(realNameField.parse("  김운영 ")).toBe("김운영");
  });

  it("비거나 20자를 넘으면 거부한다", () => {
    expect(realNameField.safeParse("   ").error?.issues[0].message).toBe("실명을 입력해 주세요.");
    expect(realNameField.safeParse("가".repeat(21)).error?.issues[0].message).toBe("실명은 20자까지 입력할 수 있어요.");
  });
});

describe("등번호 검증 — 폼 값(문자열)을 읽는다", () => {
  it("비우면 없음(null)이다", () => {
    expect(jerseyNumberField.parse("")).toBeNull();
  });

  it("0~99 정수만 받는다", () => {
    expect(jerseyNumberField.parse("0")).toBe(0);
    expect(jerseyNumberField.parse("99")).toBe(99);
    expect(jerseyNumberField.safeParse("100").error?.issues[0].message).toBe("등번호는 0~99 사이로 골라 주세요.");
    expect(jerseyNumberField.safeParse("7.5").success).toBe(false);
    expect(jerseyNumberField.safeParse("칠").success).toBe(false);
  });
});
