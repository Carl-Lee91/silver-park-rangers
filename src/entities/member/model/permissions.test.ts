import { describe, expect, it } from "vitest";
import { canChangeRole, canChangeStatus, canManageMembers } from "./permissions";

describe("멤버 관리 권한 (PLAN.md §3) — DB 의 RPC 검사와 같다", () => {
  it("어드민과 관리자는 가입 승인·멤버 관리를 한다", () => {
    expect(canManageMembers("owner")).toBe(true);
    expect(canManageMembers("admin")).toBe(true);
    expect(canManageMembers("approved")).toBe(false);
    expect(canManageMembers("pending")).toBe(false);
  });

  it("관리자 지정·해제는 어드민만 한다", () => {
    expect(canChangeRole("owner")).toBe(true);
    expect(canChangeRole("admin")).toBe(false);
  });

  it("관리자는 일반 멤버의 휴면만 바꾸고, 다른 관리자의 휴면은 어드민만 바꾼다", () => {
    expect(canChangeStatus("admin", { role: "user" })).toBe(true);
    expect(canChangeStatus("admin", { role: "admin" })).toBe(false);
    expect(canChangeStatus("owner", { role: "admin" })).toBe(true);
    expect(canChangeStatus("approved", { role: "user" })).toBe(false);
  });
});
