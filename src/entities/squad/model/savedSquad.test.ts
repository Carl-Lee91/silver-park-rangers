import { describe, expect, it } from "vitest";
import { toSavedQuarters } from "./savedSquad";

describe("DB 행 → 저장된 스쿼드", () => {
  it("쿼터 번호·슬롯 번호 순으로 정리하고 이름을 붙인다", () => {
    const quarters = toSavedQuarters([
      {
        number: 2,
        formation_name: "4-4-2",
        quarter_slots: [{ slot_index: 0, position: "GK", x: 50, y: 92, member_id: null, members: null }],
      },
      {
        number: 1,
        formation_name: "4-3-3",
        quarter_slots: [
          { slot_index: 1, position: "FW", x: 50, y: 18, member_id: "m2", members: { real_name: "이공격", jersey_number: 9 } },
          { slot_index: 0, position: "GK", x: 50, y: 92, member_id: "m1", members: { real_name: "김키퍼", jersey_number: null } },
        ],
      },
    ]);

    expect(quarters.map((quarter) => quarter.number)).toEqual([1, 2]);
    expect(quarters[0].slots).toEqual([
      { slotIndex: 0, position: "GK", x: 50, y: 92, memberId: "m1", memberName: "김키퍼", jerseyNumber: null },
      { slotIndex: 1, position: "FW", x: 50, y: 18, memberId: "m2", memberName: "이공격", jerseyNumber: 9 },
    ]);
    expect(quarters[1].slots[0].memberName).toBeNull();
  });
});
