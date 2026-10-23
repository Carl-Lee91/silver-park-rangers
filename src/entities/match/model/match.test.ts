import { describe, expect, it } from "vitest";
import { matchTitle, opponentInitial, toMatch } from "./match";

const row = {
  id: "10000000-0000-0000-0000-000000000001",
  match_date: "2026-10-25",
  starts_at: "10:00:00",
  ends_at: "13:00:00",
  quarter_count: 6,
  venue: null,
  opponent: "FC 서울",
  vote_deadline: null,
  squad_published_at: null,
  share_token: "20000000-0000-0000-0000-000000000001",
};

describe("DB 행 → 매치", () => {
  it("시각에서 초를 떼고 화면이 쓰는 이름으로 바꾼다", () => {
    expect(toMatch(row)).toEqual({
      id: row.id,
      date: "2026-10-25",
      startsAt: "10:00",
      endsAt: "13:00",
      quarterCount: 6,
      venue: null,
      opponent: "FC 서울",
      voteDeadline: null,
      squadPublishedAt: null,
      shareToken: "20000000-0000-0000-0000-000000000001",
    });
  });

  it("모르는 모양이면 터뜨린다", () => {
    expect(() => toMatch({ ...row, quarter_count: "six" })).toThrowError();
  });
});

describe("매치 이름", () => {
  it("상대가 있으면 vs 상대", () => {
    expect(matchTitle(toMatch(row))).toBe("vs FC 서울");
  });

  it("상대가 없으면 상대 미정", () => {
    expect(matchTitle(toMatch({ ...row, opponent: null }))).toBe("상대 미정");
  });
});

describe("상대 표시 글자 (엠블럼이 없는 상대의 동그라미)", () => {
  it("FC · SC 같은 영문 머리말을 건너뛰고 이름의 첫 글자를 쓴다", () => {
    expect(opponentInitial("FC 한강")).toBe("한");
    expect(opponentInitial("은평 유나이티드")).toBe("은");
    expect(opponentInitial("Mapo FC")).toBe("M");
  });

  it("상대를 안 정했으면 ? 다", () => {
    expect(opponentInitial(null)).toBe("?");
    expect(opponentInitial("  ")).toBe("?");
  });
});
