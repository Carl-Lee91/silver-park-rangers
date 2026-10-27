import { describe, expect, it } from "vitest";
import { toSharedTeams, toTeamAssignments, toTeamLists } from "./roster";

describe("풋살 팀 명단 읽기", () => {
  it("관리자 화면: 선수 id → 팀 번호", () => {
    expect(toTeamAssignments([{ member_id: "a", team_number: 1 }, { member_id: "b", team_number: 2 }])).toEqual({ a: 1, b: 2 });
  });

  it("팀원 화면: 팀마다 이름 · 등번호, 번호 순(없으면 뒤에 이름순)", () => {
    expect(
      toTeamLists(
        [
          { team_number: 2, members: { real_name: "다", jersey_number: null } },
          { team_number: 1, members: { real_name: "나", jersey_number: 7 } },
          { team_number: 1, members: [{ real_name: "가", jersey_number: 3 }] },
        ],
        2,
      ),
    ).toEqual([
      [
        { name: "가", jerseyNumber: 3 },
        { name: "나", jerseyNumber: 7 },
      ],
      [{ name: "다", jerseyNumber: null }],
    ]);
  });

  it("공유 링크: 매치 정보와 팀 명단. 공개 전이면 null", () => {
    expect(toSharedTeams(null)).toBeNull();
    const shared = toSharedTeams({
      match_id: "m1",
      match_date: "2026-11-01",
      starts_at: "10:00:00",
      ends_at: "12:00:00",
      venue: null,
      opponent: null,
      format: "futsal6",
      team_count: 3,
      members: [
        { team_number: 3, name: "다", jersey_number: null },
        { team_number: 1, name: "가", jersey_number: 1 },
      ],
    });
    expect(shared).toEqual({
      matchId: "m1",
      match: { date: "2026-11-01", startsAt: "10:00", endsAt: "12:00", venue: null, opponent: null, format: "futsal6" },
      teams: [[{ name: "가", jerseyNumber: 1 }], [], [{ name: "다", jerseyNumber: null }]],
    });
  });
});
