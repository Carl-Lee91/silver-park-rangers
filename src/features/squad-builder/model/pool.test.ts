import { describe, expect, it } from "vitest";
import type { Attendance } from "@/entities/attendance";
import { quarterSchedule } from "@/entities/match";
import type { AdminMember } from "@/entities/member";
import type { Builder } from "./builder";
import { buildPool, placementIssues, sortByFit, squadPlayersFor } from "./pool";

const schedule = quarterSchedule({ startsAt: "10:00", endsAt: "13:00", quarterCount: 6 });

const member = (id: string, realName: string, extra: Partial<AdminMember> = {}): AdminMember => ({
  id,
  realName,
  feet: ["right"],
  preferredPositions: ["MF", "CB", "WB"],
  role: "user",
  status: "approved",
  memberType: "member",
  jerseyNumber: null,
  guestMatchId: null,
  email: null,
  createdAt: "2026-10-19T00:00:00Z",
  ...extra,
});

const vote = (memberId: string, response: Attendance["response"], extra: Partial<Attendance> = {}): Attendance => ({
  memberId,
  realName: memberId,
  response,
  arriveAt: null,
  leaveAt: null,
  attended: null,
  ...extra,
});

const members = [
  member("a", "가참석"),
  member("b", "나미정"),
  member("c", "다불참"),
  member("d", "라일찍", { memberType: "guest", jerseyNumber: 9 }),
];

describe("빌더 후보 명단", () => {
  it("참석·미정만 넣고, 참석이 먼저다. 뛸 수 있는 쿼터를 시간에서 계산한다", () => {
    const pool = buildPool(
      [vote("b", "maybe"), vote("a", "yes"), vote("c", "no"), vote("d", "yes", { leaveAt: "12:00" })],
      members,
      schedule,
      new Set(),
    );
    expect(pool.map((player) => player.id)).toEqual(["a", "d", "b"]);
    expect(pool.find((player) => player.id === "d")).toMatchObject({
      memberType: "guest",
      jerseyNumber: 9,
      availableQuarters: [0, 1, 2, 3],
    });
  });

  it("저장된 스쿼드에 있는데 불참으로 바꾼 사람도 명단에 남긴다(빼야 한다는 걸 보이려고)", () => {
    const pool = buildPool([vote("c", "no")], members, schedule, new Set(["c"]));
    expect(pool.map((player) => player.response)).toEqual(["no"]);
  });
});

describe("자동 배치·점검에 넘길 선수", () => {
  const pool = buildPool([vote("a", "yes"), vote("b", "maybe")], members, schedule, new Set());
  const empty: Builder = [{ formationName: "x", slots: [{ position: "MF", x: 50, y: 50, memberId: null }] }];

  it("참석한 사람만 넘긴다", () => {
    expect(squadPlayersFor(pool, empty).map((player) => player.id)).toEqual(["a"]);
  });

  it("미정이어도 관리자가 넣은 사람은 넘긴다", () => {
    const placed: Builder = [{ formationName: "x", slots: [{ position: "MF", x: 50, y: 50, memberId: "b" }] }];
    expect(squadPlayersFor(pool, placed).map((player) => player.id)).toEqual(["a", "b"]);
  });

  it("선수 전력(능력치)을 실어 넘긴다. 없는 사람은 null 이다 — 자동 배치 스타일이 평균으로 본다", () => {
    const placed: Builder = [{ formationName: "x", slots: [{ position: "MF", x: 50, y: 50, memberId: "b" }] }];
    expect(squadPlayersFor(pool, placed, { a: 7.5 }).map((player) => [player.id, player.strength])).toEqual([
      ["a", 7.5],
      ["b", null],
    ]);
  });
});

describe("배치 문제", () => {
  it("불참으로 바꾼 사람과 못 오는 쿼터에 들어간 사람을 알려준다", () => {
    const pool = buildPool(
      [vote("c", "no"), vote("d", "yes", { leaveAt: "12:00" })],
      members,
      schedule,
      new Set(["c", "d"]),
    );
    const builder: Builder = Array.from({ length: 6 }, (_, quarter) => ({
      formationName: "x",
      slots: [
        { position: "MF" as const, x: 50, y: 50, memberId: quarter === 0 ? "c" : null },
        { position: "FW" as const, x: 50, y: 20, memberId: quarter === 5 ? "d" : null },
      ],
    }));
    expect(placementIssues(pool, builder)).toEqual([
      "다불참님은 불참으로 바꿨어요.",
      "라일찍님은 6쿼터에 못 와요.",
    ]);
  });

  it("같은 매치에 같은 등번호가 둘 이상이면 알린다 — 그날 용병은 멤버 번호와 겹칠 수 있다(PLAN.md §4)", () => {
    const numbered = [
      member("a", "가참석", { jerseyNumber: 7 }),
      member("e", "마용병", { jerseyNumber: 7, memberType: "guest", guestMatchId: "m1" }),
      member("f", "바불참", { jerseyNumber: 7 }),
      member("g", "사미정", { jerseyNumber: 7 }),
    ];
    const pool = buildPool(
      [vote("a", "yes"), vote("e", "yes"), vote("f", "no"), vote("g", "maybe")],
      numbered,
      schedule,
      new Set(),
    );
    const empty: Builder = [{ formationName: "x", slots: [{ position: "MF", x: 50, y: 50, memberId: null }] }];
    expect(placementIssues(pool, empty)).toEqual(["7번을 가참석·마용병님이 같이 써요."]);
  });
});

describe("자리에 맞는 순서", () => {
  it("고른 자리를 선호 1 · 2 · 3순위로 둔 사람부터, 같으면 원래 순서대로 놓는다", () => {
    const players = [
      { id: "a", preferredPositions: ["FW"] },
      { id: "b", preferredPositions: ["MF", "CB"] },
      { id: "c", preferredPositions: ["MF", "WB", "CB"] },
      { id: "d", preferredPositions: ["CB"] },
      { id: "e", preferredPositions: ["WG"] },
    ] as const;
    expect(sortByFit(players, "CB").map((player) => player.id)).toEqual(["d", "b", "c", "a", "e"]);
  });

  it("고른 자리가 없으면 원래 순서 그대로다", () => {
    const players = [{ id: "a", preferredPositions: ["FW"] }, { id: "d", preferredPositions: ["CB"] }] as const;
    expect(sortByFit(players, null).map((player) => player.id)).toEqual(["a", "d"]);
  });
});
