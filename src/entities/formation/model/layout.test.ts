import { describe, expect, it } from "vitest";
import type { Position } from "@/entities/position";
import { compositionLabel, countsOf, layoutFormation, type PositionCounts } from "./layout";

const counts = (partial: Partial<Record<Position, number>>): PositionCounts => ({
  FW: 0,
  AM: 0,
  WG: 0,
  MF: 0,
  WM: 0,
  DM: 0,
  WB: 0,
  CB: 0,
  FB: 0,
  GK: 0,
  ...partial,
});

describe("포지션별 인원수로 자리 잡기", () => {
  it("3-5-2: 키퍼 → 수비 → 미드 → 공격 순(뒤 줄부터)으로, 줄 안에서는 왼쪽부터 놓는다", () => {
    const slots = layoutFormation(counts({ GK: 1, CB: 3, DM: 1, WB: 2, MF: 2, FW: 2 }));
    expect(slots.map((slot) => slot.position)).toEqual(["GK", "CB", "CB", "CB", "DM", "WB", "WB", "MF", "MF", "FW", "FW"]);
    expect(slots[0]).toEqual({ position: "GK", x: 50, y: 92 });
    expect(slots.filter((slot) => slot.position === "CB").map((slot) => slot.x)).toEqual([28, 50, 72]);
    expect(slots.filter((slot) => slot.position === "FW").map((slot) => slot.x)).toEqual([37.5, 62.5]);
  });

  it("측면 포지션(풀백 · 윙백 · 와이드 미드 · 윙)은 양쪽 끝부터 채운다", () => {
    const slots = layoutFormation(counts({ GK: 1, FB: 2, WB: 2, WM: 2, WG: 2 }));
    expect(slots.filter((slot) => slot.position === "FB").map((slot) => slot.x)).toEqual([10, 90]);
    expect(slots.filter((slot) => slot.position === "WB").map((slot) => slot.x)).toEqual([10, 90]);
    expect(slots.filter((slot) => slot.position === "WM").map((slot) => slot.x)).toEqual([12, 88]);
    expect(slots.filter((slot) => slot.position === "WG").map((slot) => slot.x)).toEqual([15, 85]);
  });

  it("같은 줄이라도 측면이 중앙보다 조금 앞이고(풀백 > 센터백), 수비형 미드는 중앙 미드보다 뒤다", () => {
    const y = (position: Position) => layoutFormation(counts({ [position]: 1 }))[0].y;
    expect(y("FB")).toBeLessThan(y("CB"));
    expect(y("DM")).toBeGreaterThan(y("MF"));
    expect(y("WB")).toBeLessThan(y("FB"));
    expect(y("WM")).toBeGreaterThan(y("WG"));
  });

  it("가운데 줄은 사람이 많아도 경기장 안에 들어온다", () => {
    const xs = layoutFormation(counts({ CB: 5 })).map((slot) => slot.x);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(15);
    expect(Math.max(...xs)).toBeLessThanOrEqual(85);
  });

  it("자리에서 인원수를 다시 센다", () => {
    const shape = counts({ GK: 1, CB: 2, FB: 2, DM: 1, MF: 2, WG: 2, FW: 1 });
    expect(countsOf(layoutFormation(shape))).toEqual(shape);
  });
});

describe("구성 표기", () => {
  it("키퍼를 빼고 수비부터 공격 순으로 짧게 쓴다", () => {
    expect(compositionLabel(layoutFormation(counts({ GK: 1, CB: 3, DM: 1, WB: 2, MF: 2, FW: 2 })))).toBe(
      "CB 3 · DM 1 · WB 2 · MF 2 · FW 2",
    );
  });
});
