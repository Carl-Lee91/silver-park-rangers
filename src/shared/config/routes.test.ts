import { describe, expect, it } from "vitest";
import { adminLivePath, adminMemberPath, linkLoginPath } from "./routes";

describe("선수 상세 주소", () => {
  it("온 곳이 없으면 그냥 상세 주소다", () => {
    expect(adminMemberPath("a1")).toBe("/admin/members/a1");
  });

  it("온 곳(스쿼드 · 매치)을 붙이면 상세의 뒤로 가기가 그리로 간다", () => {
    expect(adminMemberPath("a1", "/admin/matches/m1/squad")).toBe("/admin/members/a1?from=%2Fadmin%2Fmatches%2Fm1%2Fsquad");
  });
});

describe("개인 링크 주소 (PLAN.md §4)", () => {
  it("토큰을 붙인 /j 주소다", () => {
    expect(linkLoginPath("6f1c")).toBe("/j/6f1c");
  });
});

describe("현장 모드 주소 (PLAN.md §10)", () => {
  it("매치 관리 아래 live 다 — 관리 메뉴는 매치가 켜진다", () => {
    expect(adminLivePath("m1")).toBe("/admin/matches/m1/live");
  });
});
