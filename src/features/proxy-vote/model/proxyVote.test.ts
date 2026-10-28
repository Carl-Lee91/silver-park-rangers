import { describe, expect, it } from "vitest";
import type { Attendance } from "@/entities/attendance";
import { proxyVoteChoices, readProxyVote } from "./proxyVote";

const members = [
  { id: "a", realName: "홍길동", jerseyNumber: 7 },
  { id: "b", realName: "김철수", jerseyNumber: null },
  { id: "c", realName: "박영희", jerseyNumber: 10 },
];
const vote = (memberId: string, response: Attendance["response"]): Attendance => ({
  memberId,
  realName: null,
  jerseyNumber: null,
  response,
  arriveAt: null,
  leaveAt: null,
  attended: null,
});

describe("대신 투표할 사람 (PLAN.md §4 대신 투표)", () => {
  it("아직 투표 안 한 사람이 먼저(이름순), 그다음 투표한 사람이고 지금 응답을 붙인다", () => {
    expect(proxyVoteChoices(members, [vote("c", "maybe"), vote("b", null)])).toEqual([
      { id: "b", label: "김철수" },
      { id: "a", label: "7 홍길동" },
      { id: "c", label: "10 박영희 · 지금 미정" },
    ]);
  });
});

describe("대신 투표 폼 읽기", () => {
  const form = (entries: Record<string, string>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(entries)) formData.set(key, value);
    return formData;
  };

  it("매치 · 사람 · 응답을 읽는다", () => {
    expect(readProxyVote(form({ matchId: "m1", memberId: "a", response: "yes" }))).toEqual({
      ok: true,
      value: { matchId: "m1", memberId: "a", response: "yes" },
    });
  });

  it("사람이나 응답을 고르지 않으면 막는다", () => {
    expect(readProxyVote(form({ matchId: "m1", memberId: "", response: "yes" }))).toEqual({ ok: false, error: "누구 대신인지 골라 주세요." });
    expect(readProxyVote(form({ matchId: "m1", memberId: "a", response: "" }))).toEqual({ ok: false, error: "참석 여부를 골라 주세요." });
  });
});
