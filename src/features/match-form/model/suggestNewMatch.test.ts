import { describe, expect, it } from "vitest";
import type { Match } from "@/entities/match";
import { DEFAULT_MATCH_FORM } from "./matchSchema";
import { suggestNewMatch } from "./suggestNewMatch";

const previous: Match = {
  id: "m1",
  date: "2026-10-25",
  startsAt: "09:00",
  endsAt: "11:00",
  quarterCount: 4,
  venue: "실버파크 구장",
  opponent: "FC 서울",
  voteDeadline: "2026-10-24T13:00:00+00:00",
  squadPublishedAt: null,
  shareToken: "t",
};

describe("새 매치 미리 채우기 — 매주 같은 요일·시간·장소에서 하니까", () => {
  it("지난 매치가 없으면 기본값(10:00~13:00 · 6쿼터)이고 날짜는 비운다", () => {
    expect(suggestNewMatch(null, "2026-10-22")).toEqual(DEFAULT_MATCH_FORM);
  });

  it("가장 늦은 매치의 다음 주 같은 요일로, 시간·쿼터 수·장소는 그대로 불러온다", () => {
    expect(suggestNewMatch(previous, "2026-10-22")).toEqual({
      date: "2026-11-01",
      startsAt: "09:00",
      endsAt: "11:00",
      quarterCount: "4",
      venue: "실버파크 구장",
      opponent: "",
      voteDeadline: "",
    });
  });

  it("상대 팀과 투표 마감은 매번 다르니 비운다", () => {
    const suggested = suggestNewMatch(previous, "2026-10-22");
    expect(suggested.opponent).toBe("");
    expect(suggested.voteDeadline).toBe("");
  });

  it("지난 매치가 오래됐으면 오늘 이후의 같은 요일로 맞춘다", () => {
    expect(suggestNewMatch({ ...previous, date: "2026-09-27" }, "2026-10-22").date).toBe("2026-10-25");
  });

  it("오늘이 바로 그 요일이면 오늘로 둔다", () => {
    expect(suggestNewMatch({ ...previous, date: "2026-10-18" }, "2026-10-25").date).toBe("2026-10-25");
  });

  it("장소가 없던 매치면 장소도 비운다", () => {
    expect(suggestNewMatch({ ...previous, venue: null }, "2026-10-22").venue).toBe("");
  });
});
