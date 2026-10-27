import { describe, expect, it } from "vitest";
import type { Attendance } from "@/entities/attendance";
import type { AdminMember } from "@/entities/member";
import { futsalPool } from "./pool";

const member = (id: string, realName: string, extra: Partial<AdminMember> = {}) =>
  ({ id, realName, jerseyNumber: null, memberType: "member", guestMatchId: null, ...extra }) as AdminMember;
const vote = (memberId: string, response: Attendance["response"]): Attendance => ({
  memberId,
  realName: memberId,
  jerseyNumber: null,
  response,
  arriveAt: null,
  leaveAt: null,
  attended: null,
});

const members = [
  member("a", "가선수", { jerseyNumber: 7 }),
  member("b", "나선수", { memberType: "guest" }),
  member("c", "다선수"),
  member("d", "라선수", { guestMatchId: "m1" }),
];

describe("풋살 팀 나누기 대상", () => {
  it("참석한 사람만 — 미정 · 불참은 빼고, 이름순", () => {
    const pool = futsalPool([vote("c", "yes"), vote("a", "yes"), vote("b", "maybe")], members, {}, {});
    expect(pool.map((player) => player.id)).toEqual(["a", "c"]);
  });

  it("투표를 바꿨어도 이미 팀에 든 사람은 남긴다 — 빼야 한다는 걸 보이려고", () => {
    const pool = futsalPool([vote("a", "yes"), vote("c", "no")], members, { c: 2 }, {});
    expect(pool.map((player) => player.id)).toEqual(["a", "c"]);
  });

  it("전력(필드 능력치 평균)과 용병 표시(멤버 구분 · 그날 용병)를 붙인다", () => {
    const pool = futsalPool([vote("a", "yes"), vote("b", "yes"), vote("d", "yes")], members, {}, { a: 7.5 });
    expect(pool).toEqual([
      { id: "a", realName: "가선수", jerseyNumber: 7, strength: 7.5, guest: false },
      { id: "b", realName: "나선수", jerseyNumber: null, strength: null, guest: true },
      { id: "d", realName: "라선수", jerseyNumber: null, strength: null, guest: true },
    ]);
  });
});
