import { describe, expect, it } from "vitest";
import { memberBack } from "./back";

const MATCH = "10000000-0000-0000-0000-000000000031";

describe("선수 상세의 뒤로 가기", () => {
  it("스쿼드 · 팀 나누기 · 매치 관리에서 왔으면 그리로 돌아간다", () => {
    expect(memberBack(`/admin/matches/${MATCH}/squad`, null)).toEqual({ href: `/admin/matches/${MATCH}/squad`, label: "스쿼드" });
    expect(memberBack(`/admin/matches/${MATCH}/teams`, null)).toEqual({ href: `/admin/matches/${MATCH}/teams`, label: "팀 나누기" });
    expect(memberBack(`/admin/matches/${MATCH}`, null)).toEqual({ href: `/admin/matches/${MATCH}`, label: "매치" });
  });

  it("통계에서 왔으면 통계로 돌아간다", () => {
    expect(memberBack("/admin/stats", null)).toEqual({ href: "/admin/stats", label: "통계" });
  });

  it("온 곳이 없으면 멤버는 멤버 목록, 그날 용병은 그 매치로 간다", () => {
    expect(memberBack(undefined, null)).toEqual({ href: "/admin/members", label: "멤버" });
    expect(memberBack(undefined, MATCH)).toEqual({ href: `/admin/matches/${MATCH}`, label: "매치" });
  });

  it("모르는 주소(바깥 사이트 · 다른 화면)로는 돌려보내지 않는다", () => {
    for (const from of ["https://evil.example", "//evil.example", "/admin/matches/x/../../me", `/admin/matches/${MATCH}/edit`, ["/admin/stats", "/me"]]) {
      expect(memberBack(from, null)).toEqual({ href: "/admin/members", label: "멤버" });
    }
  });
});
