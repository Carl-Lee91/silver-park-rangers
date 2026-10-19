import { describe, expect, it } from "vitest";
import type { Attendance } from "@/entities/attendance";
import { addableMembers, confirmRows, squadDefaults } from "./confirm";

const vote = (memberId: string, response: Attendance["response"], attended: boolean | null = null): Attendance => ({
  memberId,
  realName: memberId,
  response,
  arriveAt: null,
  leaveAt: null,
  attended,
});

const members = [
  { id: "a", realName: "가" },
  { id: "b", realName: "나" },
  { id: "c", realName: "다" },
  { id: "d", realName: "라" },
  { id: "e", realName: "마" },
];

describe("실제 출석 확정 명단", () => {
  it("참석·미정 투표자, 스쿼드에 든 사람, 이미 출석이 기록된 사람을 이름순으로 모은다", () => {
    const rows = confirmRows(
      [vote("b", "yes"), vote("a", "maybe"), vote("c", "no"), vote("d", null, true)],
      new Set(["e"]),
      members,
    );
    expect(rows.map((row) => row.memberId)).toEqual(["a", "b", "d", "e"]);
    expect(rows.find((row) => row.memberId === "e")).toMatchObject({ inSquad: true, response: null, attended: null });
  });

  it("불참 투표자도 출석이 기록돼 있으면 남긴다(투표와 달리 왔다)", () => {
    const rows = confirmRows([vote("c", "no", true)], new Set(), members);
    expect(rows.map((row) => row.memberId)).toEqual(["c"]);
  });
});

describe("스쿼드대로 확정", () => {
  it("스쿼드에 든 사람은 출석, 아닌 사람은 불참", () => {
    const rows = confirmRows([vote("a", "yes"), vote("b", "maybe")], new Set(["a"]), members);
    expect(squadDefaults(rows)).toEqual([
      { memberId: "a", attended: true },
      { memberId: "b", attended: false },
    ]);
  });
});

describe("명단에 없는 사람 추가", () => {
  it("명단에 없는 승인 멤버만 고를 수 있다", () => {
    const rows = confirmRows([vote("a", "yes")], new Set(["b"]), members);
    expect(addableMembers(members, rows).map((member) => member.id)).toEqual(["c", "d", "e"]);
  });
});
