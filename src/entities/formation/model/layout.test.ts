import { describe, expect, it } from "vitest";
import { compositionLabel, countsOf, layoutFormation } from "./layout";

describe("포지션별 인원수로 자리 잡기", () => {
  it("3-5-2: 키퍼 → 수비 → 미드 → 공격 순으로, 줄 안에서는 왼쪽부터 놓는다", () => {
    const slots = layoutFormation({ GK: 1, CB: 3, WB: 2, MF: 3, AM: 0, WG: 0, FW: 2 });
    expect(slots.map((slot) => slot.position)).toEqual([
      "GK",
      "CB",
      "CB",
      "CB",
      "WB",
      "WB",
      "MF",
      "MF",
      "MF",
      "FW",
      "FW",
    ]);
    expect(slots[0]).toEqual({ position: "GK", x: 50, y: 92 });
    expect(slots.filter((slot) => slot.position === "CB").map((slot) => slot.x)).toEqual([25, 50, 75]);
    expect(slots.filter((slot) => slot.position === "FW").map((slot) => slot.x)).toEqual([37.5, 62.5]);
  });

  it("윙백·윙은 양쪽 측면부터 채운다", () => {
    const slots = layoutFormation({ GK: 1, CB: 0, WB: 2, MF: 0, AM: 0, WG: 2, FW: 0 });
    expect(slots.filter((slot) => slot.position === "WB").map((slot) => slot.x)).toEqual([12, 88]);
    expect(slots.filter((slot) => slot.position === "WG").map((slot) => slot.x)).toEqual([15, 85]);
  });

  it("가운데 줄은 사람이 많아도 경기장 안에 들어온다", () => {
    const xs = layoutFormation({ GK: 0, CB: 5, WB: 0, MF: 0, AM: 0, WG: 0, FW: 0 }).map((slot) => slot.x);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(15);
    expect(Math.max(...xs)).toBeLessThanOrEqual(85);
  });

  it("자리에서 인원수를 다시 센다", () => {
    expect(countsOf(layoutFormation({ GK: 1, CB: 2, WB: 2, MF: 3, AM: 0, WG: 2, FW: 1 }))).toEqual({
      GK: 1,
      CB: 2,
      WB: 2,
      MF: 3,
      AM: 0,
      WG: 2,
      FW: 1,
    });
  });
});

describe("구성 표기", () => {
  it("키퍼를 빼고 수비부터 공격 순으로 짧게 쓴다", () => {
    expect(compositionLabel(layoutFormation({ GK: 1, CB: 3, WB: 2, MF: 3, AM: 0, WG: 0, FW: 2 }))).toBe(
      "CB 3 · WB 2 · MF 3 · FW 2",
    );
  });
});
