import type { Position } from "@/entities/position";
import type { SavedQuarter, SavedSlot } from "./savedSquad";

export type QuarterChange = {
  /** 이번 쿼터에 새로 들어가는 사람(그 자리) */
  comingIn: SavedSlot[];
  /** 앞 쿼터에 뛰고 이번 쿼터에 나오는 사람(앞 쿼터 자리) */
  goingOut: SavedSlot[];
  /** 두 쿼터 다 뛰는데 자리가 바뀌는 사람 */
  moved: { slot: SavedSlot; from: Position }[];
};

const people = (quarter: SavedQuarter | null) =>
  new Map((quarter?.slots ?? []).flatMap((slot) => (slot.memberId === null ? [] : [[slot.memberId, slot] as const])));

/**
 * 앞 쿼터 → 이번 쿼터의 교체(PLAN.md §10 현장 모드). 구장에서 "3쿼터: A 들어감 · B 나옴"을 바로 읽게 한다.
 * 첫 쿼터(앞 쿼터 없음)는 모두 들어가는 사람이다. 빈자리는 사람이 아니라서 넣지 않는다. 슬롯 순서대로다.
 */
export const quarterChanges = (previous: SavedQuarter | null, next: SavedQuarter): QuarterChange => {
  const before = people(previous);
  const after = people(next);
  return {
    comingIn: [...after.values()].filter((slot) => !before.has(slot.memberId!)),
    goingOut: [...before.values()].filter((slot) => !after.has(slot.memberId!)),
    moved: [...after.values()].flatMap((slot) => {
      const from = before.get(slot.memberId!)?.position;
      return from === undefined || from === slot.position ? [] : [{ slot, from }];
    }),
  };
};
