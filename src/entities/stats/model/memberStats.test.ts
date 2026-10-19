import { describe, expect, it } from "vitest";
import { computeMemberStats, computeTeamSummary } from "./memberStats";
import type { StatsEntry, StatsMatch, StatsMember, StatsSource } from "./source";

const match = (id: string, date: string, confirmed = true): StatsMatch => ({
  id,
  date,
  opponent: null,
  confirmed,
  hasSquad: true,
});
const member = (id: string, extra: Partial<StatsMember> = {}): StatsMember => ({
  id,
  realName: id,
  status: "approved",
  memberType: "member",
  preferredPositions: ["MF"],
  joinedOn: "2026-01-01",
  ...extra,
});
const entry = (matchId: string, memberId: string, extra: Partial<StatsEntry> = {}): StatsEntry => ({
  matchId,
  memberId,
  response: null,
  attended: null,
  fieldQuarters: 0,
  keeperQuarters: 0,
  positions: [],
  ...extra,
});

const statsOf = (source: StatsSource, id: string) => computeMemberStats(source).find((row) => row.memberId === id)!;

describe("멤버 통계 (PLAN.md §10 2차)", () => {
  const matches = [match("m1", "2026-10-04"), match("m2", "2026-10-11"), match("m3", "2026-10-18", false)];

  it("참석률 = 출석을 확정한 매치 중 실제로 온 비율. 확정 안 된 매치는 넣지 않는다", () => {
    const source: StatsSource = {
      matches,
      members: [member("a")],
      entries: [entry("m1", "a", { attended: true }), entry("m2", "a", { attended: false }), entry("m3", "a")],
    };
    expect(statsOf(source, "a")).toMatchObject({ confirmed: 2, attended: 1, attendanceRate: 0.5 });
  });

  it("확정된 매치에 출석 기록이 없으면 안 온 것이다", () => {
    const source: StatsSource = { matches, members: [member("a")], entries: [] };
    expect(statsOf(source, "a")).toMatchObject({ confirmed: 2, attended: 0, attendanceRate: 0 });
  });

  it("응답률 = 지난 매치 중 투표한 비율", () => {
    const source: StatsSource = {
      matches,
      members: [member("a")],
      entries: [entry("m1", "a", { response: "yes" }), entry("m3", "a", { response: "no" })],
    };
    expect(statsOf(source, "a")).toMatchObject({ eligible: 3, responded: 2 });
    expect(statsOf(source, "a").responseRate).toBeCloseTo(2 / 3);
  });

  it("가입하기 전 매치는 세지 않는다", () => {
    const source: StatsSource = { matches, members: [member("a", { joinedOn: "2026-10-10" })], entries: [] };
    expect(statsOf(source, "a")).toMatchObject({ eligible: 2, confirmed: 1 });
  });

  it("노쇼율 = 참석으로 투표한 확정 매치 중 안 온 비율", () => {
    const source: StatsSource = {
      matches,
      members: [member("a")],
      entries: [
        entry("m1", "a", { response: "yes", attended: true }),
        entry("m2", "a", { response: "yes", attended: false }),
        entry("m3", "a", { response: "yes" }),
      ],
    };
    expect(statsOf(source, "a")).toMatchObject({ yesConfirmed: 2, noShows: 1, noShowRate: 0.5 });
  });

  it("출전은 필드 쿼터만 세고, 키퍼 쿼터는 따로. 평균은 스쿼드에 든 매치당", () => {
    const source: StatsSource = {
      matches,
      members: [member("a", { preferredPositions: ["MF", "CB"] })],
      entries: [
        entry("m1", "a", { fieldQuarters: 3, positions: ["MF", "MF", "FW"] }),
        entry("m2", "a", { fieldQuarters: 1, keeperQuarters: 1, positions: ["CB"] }),
      ],
    };
    expect(statsOf(source, "a")).toMatchObject({
      squadMatches: 2,
      fieldQuarters: 4,
      keeperQuarters: 1,
      avgFieldQuarters: 2,
      positionCounts: { MF: 2, FW: 1, CB: 1 },
      preferredShare: 0.75,
    });
  });

  it("비율을 낼 수 없으면 null 이다(0 으로 보이면 오해한다)", () => {
    const source: StatsSource = { matches: [], members: [member("a")], entries: [] };
    expect(statsOf(source, "a")).toMatchObject({
      attendanceRate: null,
      responseRate: null,
      noShowRate: null,
      avgFieldQuarters: null,
      preferredShare: null,
    });
  });

  it("용병은 멤버 통계에서 뺀다", () => {
    const source: StatsSource = { matches, members: [member("g", { memberType: "guest" }), member("a")], entries: [] };
    expect(computeMemberStats(source).map((row) => row.memberId)).toEqual(["a"]);
  });
});

describe("팀 요약과 매치별 추이", () => {
  const source: StatsSource = {
    matches: [match("m1", "2026-10-04"), match("m2", "2026-10-11", false)],
    members: [member("a"), member("b"), member("g", { memberType: "guest" })],
    entries: [
      entry("m1", "a", { response: "yes", attended: true }),
      entry("m1", "b", { response: "yes", attended: false }),
      entry("m1", "g", { response: "yes", attended: true }),
      entry("m2", "a", { response: "yes" }),
    ],
  };

  it("매치마다 참석 투표 수와 실제 출석 수(용병 포함)를 낸다. 확정 전이면 출석은 null", () => {
    const { trend } = computeTeamSummary(source);
    expect(trend).toEqual([
      { matchId: "m1", date: "2026-10-04", opponent: null, yes: 3, attended: 2, guestsAttended: 1 },
      { matchId: "m2", date: "2026-10-11", opponent: null, yes: 1, attended: null, guestsAttended: null },
    ]);
  });

  it("확정한 매치 수와 매치당 평균 출석 인원을 낸다", () => {
    expect(computeTeamSummary(source)).toMatchObject({ matchCount: 2, confirmedCount: 1, avgAttended: 2 });
  });
});
