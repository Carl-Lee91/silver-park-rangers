import { describe, expect, it } from "vitest";
import { adminSquadImagePath, squadImagePath, squadImageVersion } from "./imagePath";

describe("스쿼드 이미지 주소", () => {
  it("공유 링크 이미지: 카드는 og, 나머지는 image?view= — 내용 해시(v)를 붙인다", () => {
    expect(squadImagePath("t1", "card", "abc")).toBe("/s/t1/og?v=abc");
    expect(squadImagePath("t1", "rotation", "abc")).toBe("/s/t1/image?view=rotation&v=abc");
  });

  it("관리자 이미지: 공개 전에도 저장한 스쿼드를 그린다 — 관리 화면 아래 주소다", () => {
    expect(adminSquadImagePath("m1", "quarters", "abc")).toBe("/admin/matches/m1/squad/image?view=quarters&v=abc");
  });
});

describe("이미지 버전 — 그려지는 내용이 바뀌면 주소가 바뀐다(그래서 오래 캐시해도 된다)", () => {
  const match = { date: "2026-10-25", startsAt: "10:00", endsAt: "13:00", quarterCount: 6, venue: "구장", opponent: "FC 서울" };
  const slot = { slotIndex: 0, position: "GK" as const, x: 50, y: 92, memberId: "id-1", memberName: "김키퍼", jerseyNumber: 1 };
  const squad = (overrides: { match?: Partial<typeof match>; slot?: Partial<typeof slot> } = {}) => ({
    match: { ...match, ...overrides.match },
    quarters: [{ number: 1, formationName: "4-3-3", slots: [{ ...slot, ...overrides.slot }] }],
  });

  it("같은 내용이면 같은 버전이다", () => {
    expect(squadImageVersion(squad())).toBe(squadImageVersion(squad()));
  });

  it("이미지 위쪽에 쓰이는 매치 정보가 바뀌면 바뀐다", () => {
    expect(squadImageVersion(squad({ match: { startsAt: "11:00" } }))).not.toBe(squadImageVersion(squad()));
    expect(squadImageVersion(squad({ match: { venue: "다른 구장" } }))).not.toBe(squadImageVersion(squad()));
  });

  it("이름·등번호·자리가 바뀌면 바뀐다", () => {
    expect(squadImageVersion(squad({ slot: { memberName: "이키퍼" } }))).not.toBe(squadImageVersion(squad()));
    expect(squadImageVersion(squad({ slot: { jerseyNumber: 21 } }))).not.toBe(squadImageVersion(squad()));
    expect(squadImageVersion(squad({ slot: { x: 40 } }))).not.toBe(squadImageVersion(squad()));
  });

  it("사람을 가리키는 값(멤버 id·공유용 키)은 보지 않는다 — 관리자·팀원·공유 링크가 같은 이미지에 같은 주소를 쓴다", () => {
    expect(squadImageVersion(squad({ slot: { memberId: "share-key" } }))).toBe(squadImageVersion(squad()));
  });
});

