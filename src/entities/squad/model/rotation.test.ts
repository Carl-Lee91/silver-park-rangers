import { describe, expect, it } from "vitest";
import { rotationTable } from "./rotation";
import type { SavedQuarter } from "./savedSquad";

const slot = (
  slotIndex: number,
  position: "GK" | "FW" | "CB",
  memberId: string | null,
  memberName: string | null,
  jerseyNumber: number | null = null,
) => ({ slotIndex, position, x: 50, y: 50, memberId, memberName, jerseyNumber });

const quarters: SavedQuarter[] = [
  { number: 1, formationName: "x", slots: [slot(0, "GK", "k", "키퍼", 1), slot(1, "FW", "a", "나공격"), slot(2, "CB", null, null)] },
  { number: 2, formationName: "x", slots: [slot(0, "GK", "a", "나공격"), slot(1, "FW", "b", "가수비")] },
];

describe("출전표", () => {
  it("사람마다 쿼터별로 필드·키퍼를 표시하고 이름순으로 둔다", () => {
    expect(rotationTable(quarters)).toEqual([
      { memberId: "b", name: "가수비", jerseyNumber: null, marks: [null, "field"], fieldCount: 1, keeperCount: 0 },
      { memberId: "a", name: "나공격", jerseyNumber: null, marks: ["field", "keeper"], fieldCount: 1, keeperCount: 1 },
      { memberId: "k", name: "키퍼", jerseyNumber: 1, marks: ["keeper", null], fieldCount: 0, keeperCount: 1 },
    ]);
  });

  it("이름을 볼 수 없는 사람은 뺀다", () => {
    const hidden: SavedQuarter[] = [{ number: 1, formationName: "x", slots: [slot(0, "FW", "z", null)] }];
    expect(rotationTable(hidden)).toEqual([]);
  });
});
