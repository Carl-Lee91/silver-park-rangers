import { describe, expect, it } from "vitest";
import { keeperSlotIndex, toFormation } from "./formation";

const row = {
  id: "f1",
  name: "4-3-3",
  is_preset: true,
  slots: [
    { position: "GK", x: 50, y: 92 },
    { position: "CB", x: 37, y: 78 },
  ],
};

describe("DB 행 → 포메이션", () => {
  it("화면이 쓰는 이름으로 바꾼다", () => {
    expect(toFormation(row)).toEqual({
      id: "f1",
      name: "4-3-3",
      isPreset: true,
      slots: [
        { position: "GK", x: 50, y: 92 },
        { position: "CB", x: 37, y: 78 },
      ],
    });
  });

  it("모르는 포지션이나 경기장 밖 좌표는 거부한다", () => {
    expect(() => toFormation({ ...row, slots: [{ position: "ST", x: 50, y: 50 }] })).toThrowError();
    expect(() => toFormation({ ...row, slots: [{ position: "FW", x: 120, y: 50 }] })).toThrowError();
  });
});

describe("키퍼 자리", () => {
  it("첫 GK 슬롯이 키퍼 자리다", () => {
    expect(keeperSlotIndex([{ position: "CB" }, { position: "GK" }])).toBe(1);
  });

  it("GK 슬롯이 없으면 -1", () => {
    expect(keeperSlotIndex([{ position: "CB" }])).toBe(-1);
  });
});
