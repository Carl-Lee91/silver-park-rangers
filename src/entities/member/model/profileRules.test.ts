import { describe, expect, it } from "vitest";
import { profileFieldsSchema, toggleFoot, togglePosition } from "./profileRules";

describe("주발 고르기", () => {
  it("누른 순서와 상관없이 왼발·오른발 순서로 둔다", () => {
    expect(toggleFoot(["right"], "left")).toEqual(["left", "right"]);
  });

  it("다시 누르면 뺀다", () => {
    expect(toggleFoot(["left", "right"], "left")).toEqual(["right"]);
  });
});

describe("선호 포지션 고르기", () => {
  it("누른 순서가 우선순위다", () => {
    expect(togglePosition(togglePosition([], "CB"), "FW")).toEqual(["CB", "FW"]);
  });

  it("3개를 넘게 고를 수 없다", () => {
    expect(togglePosition(["CB", "FW", "WG"], "MF")).toEqual(["CB", "FW", "WG"]);
  });

  it("빼면 뒤 순위가 당겨진다", () => {
    expect(togglePosition(["CB", "FW", "GK"], "CB")).toEqual(["FW", "GK"]);
  });
});

describe("주발·선호 포지션 검증 — DB 제약과 같다", () => {
  it("올바르면 통과한다", () => {
    expect(profileFieldsSchema.safeParse({ feet: ["left"], preferredPositions: ["MF"] }).success).toBe(true);
  });

  it("주발 없음, 포지션 없음·4개·중복은 거부한다", () => {
    const check = (feet: string[], preferredPositions: string[]) =>
      profileFieldsSchema.safeParse({ feet, preferredPositions }).success;
    expect(check([], ["MF"])).toBe(false);
    expect(check(["left"], [])).toBe(false);
    expect(check(["left"], ["FW", "AM", "WG", "MF"])).toBe(false);
    expect(check(["left"], ["FW", "FW"])).toBe(false);
  });
});
