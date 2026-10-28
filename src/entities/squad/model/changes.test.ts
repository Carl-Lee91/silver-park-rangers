import { describe, expect, it } from "vitest";
import { quarterChanges } from "./changes";
import type { SavedQuarter, SavedSlot } from "./savedSquad";

const slot = (slotIndex: number, position: SavedSlot["position"], memberId: string | null): SavedSlot => ({
  slotIndex,
  position,
  x: 0,
  y: 0,
  memberId,
  memberName: memberId,
  jerseyNumber: null,
});
const quarter = (number: number, slots: SavedSlot[]): SavedQuarter => ({ number, formationName: "4-3-3", slots });

describe("쿼터 교체 안내 (PLAN.md §10 현장 모드)", () => {
  const first = quarter(1, [slot(0, "GK", "k"), slot(1, "CB", "a"), slot(2, "MF", "b"), slot(3, "FW", "c")]);
  const second = quarter(2, [slot(0, "GK", "k"), slot(1, "CB", "d"), slot(2, "FW", "b"), slot(3, "MF", null)]);

  it("들어가는 사람 · 나오는 사람 · 자리를 바꾸는 사람을 나눈다", () => {
    const changes = quarterChanges(first, second);
    expect(changes.comingIn.map((entry) => [entry.memberId, entry.position])).toEqual([["d", "CB"]]);
    expect(changes.goingOut.map((entry) => [entry.memberId, entry.position])).toEqual([
      ["a", "CB"],
      ["c", "FW"],
    ]);
    expect(changes.moved.map(({ slot: moved, from }) => [moved.memberId, from, moved.position])).toEqual([["b", "MF", "FW"]]);
  });

  it("빈자리는 사람이 아니다", () => {
    expect(quarterChanges(first, second).comingIn.some((entry) => entry.memberId === null)).toBe(false);
  });

  it("첫 쿼터는 모두 들어가는 사람이다", () => {
    expect(quarterChanges(null, first).comingIn.map((entry) => entry.memberId)).toEqual(["k", "a", "b", "c"]);
  });
});
