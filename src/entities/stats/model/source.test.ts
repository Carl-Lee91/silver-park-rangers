import { describe, expect, it } from "vitest";
import { toStatsSource } from "./source";

describe("통계 원본 읽기", () => {
  it("RPC 가 준 모양을 화면이 쓰는 이름으로 바꾼다", () => {
    const source = toStatsSource({
      matches: [{ id: "m1", match_date: "2026-10-11", opponent: null, confirmed: true, has_squad: true }],
      members: [
        {
          id: "a",
          real_name: "가",
          status: "approved",
          member_type: "member",
          preferred_positions: ["MF"],
          joined_on: "2026-01-01",
        },
      ],
      entries: [
        {
          match_id: "m1",
          member_id: "a",
          response: "yes",
          attended: true,
          field_quarters: 3,
          keeper_quarters: 0,
          positions: ["MF", "MF", "CB"],
        },
      ],
    });
    expect(source.matches[0]).toEqual({ id: "m1", date: "2026-10-11", opponent: null, confirmed: true, hasSquad: true });
    expect(source.members[0]).toMatchObject({ realName: "가", memberType: "member", joinedOn: "2026-01-01" });
    expect(source.entries[0]).toMatchObject({ fieldQuarters: 3, positions: ["MF", "MF", "CB"] });
  });
});
