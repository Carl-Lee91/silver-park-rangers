import { describe, expect, it } from "vitest";
import { FORMAT_LABELS, isFutsal, matchShape, matchTitle, opponentInitial, playersPerSide, toMatch } from "./match";

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
      format: "football",
      teamCount: 2,
    });
  });

  it("매치 종류와 풋살 팀 수를 읽는다", () => {
    expect(toMatch({ ...row, format: "futsal6", team_count: 3 })).toMatchObject({ format: "futsal6", teamCount: 3 });
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

describe("매치 종류 (PLAN.md §6 풋살)", () => {
  const football = toMatch(row);
  const futsal = toMatch({ ...row, format: "futsal5" });

  it("축구 · 풋살 5:5 · 풋살 6:6 이다", () => {
    expect(FORMAT_LABELS).toEqual({ football: "축구", futsal5: "풋살 5:5", futsal6: "풋살 6:6" });
    expect([isFutsal(football), isFutsal(futsal)]).toEqual([false, true]);
  });

  it("한쪽 경기 인원: 축구 11 · 풋살 5 · 6", () => {
    expect([playersPerSide("football"), playersPerSide("futsal5"), playersPerSide("futsal6")]).toEqual([11, 5, 6]);
  });

  it("매치 모양은 축구면 쿼터 수, 풋살이면 종류다", () => {
    expect(matchShape(football)).toBe("6쿼터");
    expect(matchShape(futsal)).toBe("풋살 5:5");
  });
});
