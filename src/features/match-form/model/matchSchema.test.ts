import { describe, expect, it } from "vitest";
import { matchToFormValues, readMatchForm, validateMatch, type MatchFormValues } from "./matchSchema";

const valid: MatchFormValues = {
  format: "football",
  date: "2026-10-25",
  startsAt: "10:00",
  endsAt: "13:00",
  quarterCount: "6",
  venue: " 실버파크 ",
  opponent: "FC 서울",
  voteDeadline: "2026-10-24T22:00",
};

describe("매치 입력 검증", () => {
  it("올바르면 저장할 값으로 바꾼다", () => {
    expect(validateMatch(valid)).toEqual({
      ok: true,
      value: {
        format: "football",
        date: "2026-10-25",
        startsAt: "10:00",
        endsAt: "13:00",
        quarterCount: 6,
        venue: "실버파크",
        opponent: "FC 서울",
        voteDeadline: "2026-10-24T22:00:00+09:00",
      },
    });
  });

  it("종류는 축구 · 풋살 5:5 · 풋살 6:6 중 하나다", () => {
    expect(validateMatch({ ...valid, format: "basketball" })).toEqual({ ok: false, errors: { format: "종류를 골라 주세요." } });
  });

  it("풋살은 쿼터가 없어 쿼터 수를 보지 않는다", () => {
    const result = validateMatch({ ...valid, format: "futsal5", quarterCount: "0" });
    expect(result.ok && result.value).toMatchObject({ format: "futsal5", quarterCount: 6 });
  });

  it("장소·상대·마감은 비워도 된다", () => {
    const result = validateMatch({ ...valid, venue: "  ", opponent: "", voteDeadline: "" });
    expect(result.ok && result.value).toMatchObject({ venue: null, opponent: null, voteDeadline: null });
  });

  it("날짜는 꼭 고른다", () => {
    expect(validateMatch({ ...valid, date: "" })).toEqual({ ok: false, errors: { date: "날짜를 골라 주세요." } });
  });

  it("끝 시간은 시작 시간보다 늦어야 한다", () => {
    expect(validateMatch({ ...valid, endsAt: "10:00" })).toEqual({
      ok: false,
      errors: { endsAt: "끝 시간은 시작 시간보다 늦어야 해요." },
    });
  });

  it("쿼터 수는 1~12 다", () => {
    expect(validateMatch({ ...valid, quarterCount: "0" }).ok).toBe(false);
    expect(validateMatch({ ...valid, quarterCount: "13" }).ok).toBe(false);
    expect(validateMatch({ ...valid, quarterCount: "6.5" }).ok).toBe(false);
  });

  it("쿼터가 10분보다 짧아지면 막는다", () => {
    expect(validateMatch({ ...valid, endsAt: "11:00", quarterCount: "12" })).toEqual({
      ok: false,
      errors: { quarterCount: "쿼터가 너무 짧아요. 쿼터 수를 줄이거나 시간을 늘려 주세요." },
    });
  });

  it("투표 마감은 매치 시작 전이어야 한다", () => {
    expect(validateMatch({ ...valid, voteDeadline: "2026-10-25T10:00" })).toEqual({
      ok: false,
      errors: { voteDeadline: "투표 마감은 매치 시작 전이어야 해요." },
    });
  });

  it("장소·상대는 길이 제한이 있다", () => {
    expect(validateMatch({ ...valid, venue: "가".repeat(41) }).ok).toBe(false);
    expect(validateMatch({ ...valid, opponent: "가".repeat(31) }).ok).toBe(false);
  });
});

describe("폼 ↔ 매치", () => {
  it("폼 데이터를 읽는다", () => {
    const data = new FormData();
    for (const [key, value] of Object.entries(valid)) data.append(key, value);
    expect(readMatchForm(data)).toEqual(valid);
  });

  it("고치기 화면은 저장된 매치로 시작한다", () => {
    expect(
      matchToFormValues({
        id: "m",
        date: "2026-10-25",
        startsAt: "10:00",
        endsAt: "13:00",
        quarterCount: 6,
        venue: null,
        opponent: "FC 서울",
        voteDeadline: "2026-10-24T13:00:00+00:00",
        squadPublishedAt: null,
        shareToken: "t",
        format: "football",
        teamCount: 2,
      }),
    ).toEqual({ ...valid, venue: "" });
  });
});
