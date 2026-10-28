import { describe, expect, it } from "vitest";
import type { Attendance } from "@/entities/attendance";
import type { SavedQuarter } from "@/entities/squad";
import { arrivalRows } from "./arrival";

const row = (memberId: string, realName: string, overrides: Partial<Attendance> = {}): Attendance => ({
  memberId,
  realName,
  jerseyNumber: null,
  response: "yes",
  arriveAt: null,
  leaveAt: null,
  attended: null,
  ...overrides,
});
const squad: SavedQuarter[] = [
  { number: 1, formationName: "4-3-3", slots: [{ slotIndex: 0, position: "GK", x: 0, y: 0, memberId: "b", memberName: "김철수", jerseyNumber: 1 }] },
  { number: 2, formationName: "4-3-3", slots: [{ slotIndex: 0, position: "GK", x: 0, y: 0, memberId: "a", memberName: "홍길동", jerseyNumber: 7 }] },
];

describe("도착 체크 (PLAN.md §10 현장 모드)", () => {
  it("올 사람: 참석 · 미정으로 투표했거나 스쿼드에 든 사람, 이미 도착한 사람", () => {
    const rows = arrivalRows(
      [row("a", "홍길동"), row("b", "김철수", { response: null }), row("c", "박영희", { response: "maybe" }), row("d", "불참자", { response: "no" })],
      squad,
    );
    expect(rows.map((entry) => entry.memberId).sort()).toEqual(["a", "b", "c"]);
  });

  it("아직 안 온 사람이 위 — 먼저 뛰는 사람부터, 스쿼드에 없으면 뒤. 도착한 사람은 아래 이름순", () => {
    const rows = arrivalRows([row("a", "홍길동"), row("b", "김철수"), row("c", "박영희"), row("e", "강도착", { attended: true })], squad);
    expect(rows.map((entry) => [entry.realName, entry.arrived, entry.firstQuarter])).toEqual([
      ["김철수", false, 1],
      ["홍길동", false, 2],
      ["박영희", false, null],
      ["강도착", true, null],
    ]);
  });

  it("불참으로 확정한 사람은 도착하지 않은 것으로 남긴다", () => {
    expect(arrivalRows([row("a", "홍길동", { attended: false })], squad)[0].arrived).toBe(false);
  });
});
