import { describe, expect, it } from "vitest";
import { toSharedSquad } from "./sharedSquad";

const json = {
  match_id: "m1",
  match_date: "2026-10-25",
  starts_at: "10:00:00",
  ends_at: "13:00:00",
  quarter_count: 6,
  venue: null,
  opponent: "FC 서울",
  quarters: [
    {
      number: 1,
      formation_name: "4-3-3",
      slots: [
        { slot_index: 0, position: "GK", x: 50, y: 92, member_key: "abc", name: "김키퍼", jersey_number: 1 },
        { slot_index: 1, position: "FW", x: 50, y: 18, member_key: null, name: null, jersey_number: null },
      ],
    },
  ],
};

describe("공유 링크용 스쿼드", () => {
  it("매치 정보와 쿼터를 읽는다 — 사람은 가짜 키로 묶는다", () => {
    const squad = toSharedSquad(json);
    expect(squad?.matchId).toBe("m1");
    expect(squad?.match).toEqual({
      date: "2026-10-25",
      startsAt: "10:00",
      endsAt: "13:00",
      quarterCount: 6,
      venue: null,
      opponent: "FC 서울",
    });
    expect(squad?.quarters[0].slots[0]).toEqual({
      slotIndex: 0,
      position: "GK",
      x: 50,
      y: 92,
      memberId: "abc",
      memberName: "김키퍼",
      jerseyNumber: 1,
    });
  });

  it("공개 전이거나 틀린 토큰이면(null) null 이다", () => {
    expect(toSharedSquad(null)).toBeNull();
  });

  it("뛰는 사람 수를 센다", async () => {
    const { countPlayers } = await import("./sharedSquad");
    expect(countPlayers(toSharedSquad(json)!.quarters)).toBe(1);
  });
});

describe("저장된 스쿼드로 그리는 이미지 (공개 전, 관리자만)", () => {
  const match = {
    id: "m1",
    date: "2026-10-25",
    startsAt: "10:00",
    endsAt: "13:00",
    quarterCount: 2,
    venue: "구장",
    opponent: "FC 서울",
  };
  const quarter = (number: number) => ({
    number,
    formationName: "4-3-3",
    slots: [{ slotIndex: 0, position: "GK" as const, x: 50, y: 92, memberId: "p1", memberName: "김키퍼", jerseyNumber: 1 }],
  });

  it("공유 링크와 같은 모양으로 만든다 — 같은 이미지 컴포넌트가 그린다", async () => {
    const { squadForImage } = await import("./sharedSquad");
    expect(squadForImage(match, [quarter(1)])).toEqual({
      matchId: "m1",
      match: { date: "2026-10-25", startsAt: "10:00", endsAt: "13:00", quarterCount: 2, venue: "구장", opponent: "FC 서울" },
      quarters: [quarter(1)],
    });
  });

  it("매치 쿼터 수를 줄여서 남은 뒤 쿼터는 그리지 않고, 쿼터 순서대로 둔다", async () => {
    const { squadForImage } = await import("./sharedSquad");
    expect(squadForImage(match, [quarter(3), quarter(2), quarter(1)])?.quarters.map((q) => q.number)).toEqual([1, 2]);
  });

  it("저장된 쿼터가 없으면 null 이다", async () => {
    const { squadForImage } = await import("./sharedSquad");
    expect(squadForImage(match, [])).toBeNull();
  });
});

