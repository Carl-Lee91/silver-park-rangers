import { describe, expect, it } from "vitest";
import { adminMemberPath } from "./routes";

describe("선수 상세 주소", () => {
  it("온 곳이 없으면 그냥 상세 주소다", () => {
    expect(adminMemberPath("a1")).toBe("/admin/members/a1");
  });

  it("온 곳(스쿼드 · 매치)을 붙이면 상세의 뒤로 가기가 그리로 간다", () => {
    expect(adminMemberPath("a1", "/admin/matches/m1/squad")).toBe("/admin/members/a1?from=%2Fadmin%2Fmatches%2Fm1%2Fsquad");
  });
});
