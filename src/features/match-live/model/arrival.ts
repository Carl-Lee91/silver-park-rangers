import type { Attendance } from "@/entities/attendance";
import type { SavedQuarter } from "@/entities/squad";

export type ArrivalRow = {
  memberId: string;
  realName: string;
  jerseyNumber: number | null;
  arrived: boolean;
  /** 스쿼드에서 처음 뛰는 쿼터 번호(1부터). 스쿼드에 없으면 null */
  firstQuarter: number | null;
};

const byName = (a: ArrivalRow, b: ArrivalRow) => a.realName.localeCompare(b.realName, "ko");

/**
 * 현장 모드의 도착 체크(PLAN.md §10). 올 사람은 참석 · 미정으로 투표했거나 스쿼드에 든 사람(이미 도착한 사람 포함).
 * 아직 안 온 사람이 위에 오고, 그 안에서는 먼저 뛰는 사람부터다(스쿼드에 없으면 뒤). 도착한 사람은 아래 이름순.
 * 도착은 실제 출석(attended = true)이다 — 매치가 끝나고 출석을 다시 정하지 않아도 된다.
 */
export const arrivalRows = (attendance: readonly Attendance[], squad: readonly SavedQuarter[]): ArrivalRow[] => {
  const first = new Map<string, number>();
  for (const quarter of [...squad].sort((a, b) => a.number - b.number)) {
    for (const slot of quarter.slots) {
      if (slot.memberId !== null && !first.has(slot.memberId)) first.set(slot.memberId, quarter.number);
    }
  }

  const rows = attendance.flatMap((row): ArrivalRow[] => {
    const expected = row.response === "yes" || row.response === "maybe" || first.has(row.memberId) || row.attended === true;
    if (!expected || row.realName === null) return [];
    return [
      {
        memberId: row.memberId,
        realName: row.realName,
        jerseyNumber: row.jerseyNumber,
        arrived: row.attended === true,
        firstQuarter: first.get(row.memberId) ?? null,
      },
    ];
  });
  const waiting = rows
    .filter((row) => !row.arrived)
    .sort((a, b) => (a.firstQuarter ?? Infinity) - (b.firstQuarter ?? Infinity) || byName(a, b));
  return [...waiting, ...rows.filter((row) => row.arrived).sort(byName)];
};
