import { describe, expect, it } from "vitest";
import { ADMIN_NAV, activeAdminNav } from "./nav";

describe("관리 메뉴", () => {
  it("매치 · 스쿼드 · 멤버 · 회비 · 통계 순서다", () => {
    expect(ADMIN_NAV.map((item) => item.label)).toEqual(["매치", "스쿼드", "멤버", "회비", "통계"]);
  });

  it.each([
    ["/admin", null],
    ["/admin/matches", "매치"],
    ["/admin/matches/new", "매치"],
    ["/admin/matches/m1", "매치"],
    ["/admin/matches/m1/edit", "매치"],
    ["/admin/squads", "스쿼드"],
    ["/admin/matches/m1/squad", "스쿼드"],
    ["/admin/members", "멤버"],
    ["/admin/dues", "회비"],
    ["/admin/stats", "통계"],
    ["/admin/formations", null],
  ])("%s 에서는 %s 가 켜진다", (pathname, label) => {
    expect(activeAdminNav(pathname)?.label ?? null).toBe(label);
  });
});
