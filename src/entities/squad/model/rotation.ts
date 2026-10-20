import type { SavedQuarter } from "./savedSquad";

export type RotationMark = "field" | "keeper" | null;

export type RotationRow = {
  memberId: string;
  name: string;
  jerseyNumber: number | null;
  /** 쿼터 순서대로 */
  marks: RotationMark[];
  fieldCount: number;
  keeperCount: number;
};

/**
 * 출전표(PLAN.md §7): 사람 × 쿼터. 6쿼터면 포메이션 그림 6장보다 "나 언제 뛰지?"를 찾기 쉽다.
 * 키퍼로 뛴 쿼터는 따로 표시하고 출전 수에 넣지 않는다(PLAN.md §6).
 */
export const rotationTable = (quarters: readonly SavedQuarter[]): RotationRow[] => {
  const rows = new Map<string, RotationRow>();

  quarters.forEach((quarter, index) => {
    for (const slot of quarter.slots) {
      if (slot.memberId === null || slot.memberName === null) continue;
      const row = rows.get(slot.memberId) ?? {
        memberId: slot.memberId,
        name: slot.memberName,
        jerseyNumber: slot.jerseyNumber,
        marks: quarters.map(() => null),
        fieldCount: 0,
        keeperCount: 0,
      };
      const keeper = slot.position === "GK";
      row.marks[index] = keeper ? "keeper" : "field";
      if (keeper) row.keeperCount++;
      else row.fieldCount++;
      rows.set(slot.memberId, row);
    }
  });

  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
};
