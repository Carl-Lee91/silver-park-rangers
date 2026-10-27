import { describe, expect, it } from "vitest";
import {
  attendanceTimeNote,
  groupAttendance,
  toAttendance,
  unrespondedMembers,
  type Attendance,
} from "./attendance";

describe("DB 행 → 참석", () => {
  it("이름 · 등번호와 시각을 함께 읽고 초를 뗀다", () => {
    expect(
      toAttendance({
        member_id: "m1",
        response: "yes",
        arrive_at: "11:00:00",
        leave_at: null,
        attended: null,
        members: { real_name: "김민수", jersey_number: 7 },
      }),
    ).toEqual({ memberId: "m1", realName: "김민수", jerseyNumber: 7, response: "yes", arriveAt: "11:00", leaveAt: null, attended: null });
  });

  it("볼 수 없는 멤버(휴면 등)는 이름이 null 이다", () => {
    const attendance = toAttendance({
      member_id: "m1",
      response: "no",
      arrive_at: null,
      leave_at: null,
      attended: null,
      members: null,
    });
    expect(attendance.realName).toBeNull();
    expect(attendance.jerseyNumber).toBeNull();
  });
});

const vote = (realName: string, response: Attendance["response"], extra: Partial<Attendance> = {}): Attendance => ({
  memberId: realName,
  realName,
  jerseyNumber: null,
  response,
  arriveAt: null,
  leaveAt: null,
  attended: null,
  ...extra,
});

describe("참석자 묶음", () => {
  it("응답별로 나누고 이름순으로 둔다", () => {
    const groups = groupAttendance([vote("하", "yes"), vote("가", "yes"), vote("나", "maybe"), vote("다", "no")]);
    expect(groups.yes.map((a) => a.realName)).toEqual(["가", "하"]);
    expect(groups.maybe.map((a) => a.realName)).toEqual(["나"]);
    expect(groups.no.map((a) => a.realName)).toEqual(["다"]);
  });

  it("투표가 없는 행(관리자가 출석만 남긴 것)과 이름을 못 보는 사람은 뺀다", () => {
    const groups = groupAttendance([vote("가", null), { ...vote("나", "yes"), realName: null }]);
    expect(groups.yes).toEqual([]);
  });
});

describe("시간 메모", () => {
  it.each([
    [{ arriveAt: "11:00", leaveAt: null }, "11:00 도착"],
    [{ arriveAt: null, leaveAt: "12:00" }, "12:00 출발"],
    [{ arriveAt: "10:30", leaveAt: "12:00" }, "10:30~12:00"],
    [{ arriveAt: null, leaveAt: null }, null],
  ])("%o → %s", (window, expected) => {
    expect(attendanceTimeNote(window)).toBe(expected);
  });
});

describe("아직 투표 안 한 사람", () => {
  it("응답이 있는 사람을 빼고 이름순으로 돌려준다", () => {
    const members = [
      { id: "a", realName: "하" },
      { id: "b", realName: "가" },
      { id: "c", realName: "나" },
    ];
    const attendance = [{ ...vote("x", "no"), memberId: "c" }];
    expect(unrespondedMembers(members, attendance).map((m) => m.realName)).toEqual(["가", "하"]);
  });

  it("관리자가 출석만 남긴 사람(응답 없음)은 아직 투표 안 한 사람이다", () => {
    const members = [{ id: "a", realName: "가" }];
    expect(unrespondedMembers(members, [{ ...vote("x", null), memberId: "a" }])).toHaveLength(1);
  });
});

describe("매치별 참석 인원 (관리 › 스쿼드)", () => {
  it("참석으로 투표한 사람을 매치마다 센다 — 고른 매치는 0명이어도 나온다", async () => {
    const { countYesByMatch } = await import("./attendance");
    expect(
      countYesByMatch(["m1", "m2", "m3"], [
        { match_id: "m1", response: "yes" },
        { match_id: "m1", response: "yes" },
        { match_id: "m1", response: "maybe" },
        { match_id: "m2", response: "no" },
        { match_id: "m3", response: null },
      ]),
    ).toEqual({ m1: 2, m2: 0, m3: 0 });
  });
});
