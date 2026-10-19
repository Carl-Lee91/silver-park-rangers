import { describe, expect, it } from "vitest";
import { gateOf, gateRedirect, isAdmin, isApproved, type Gate, type GateMember } from "./gate";

const member = (status: GateMember["status"], role: GateMember["role"] = "user") => ({
  member: { status, role },
  isOwner: false,
});
const nobody = { member: null, isOwner: false };

describe("승인 게이트 상태 (PLAN.md §4)", () => {
  it("로그인 안 했으면 signed-out", () => {
    expect(gateOf(false, nobody)).toBe("signed-out");
  });

  it("로그인했지만 멤버 행이 없으면 온보딩 전이다", () => {
    expect(gateOf(true, nobody)).toBe("needs-onboarding");
  });

  it.each([
    ["pending", "pending"],
    ["rejected", "rejected"],
    ["inactive", "inactive"],
    ["approved", "approved"],
  ] as const)("멤버 상태 %s 는 %s", (status, gate) => {
    expect(gateOf(true, member(status))).toBe(gate);
  });

  it("승인된 관리자는 admin", () => {
    expect(gateOf(true, member("approved", "admin"))).toBe("admin");
  });

  it("승인 전인 관리자 역할은 관리자가 아니다 — DB 의 is_admin() 과 같다", () => {
    expect(gateOf(true, member("pending", "admin"))).toBe("pending");
    expect(isAdmin({ status: "inactive", role: "admin" })).toBe(false);
  });

  it("어드민 계정은 멤버 행이 없어도 owner 다", () => {
    expect(gateOf(true, { member: null, isOwner: true })).toBe("owner");
  });

  it("어드민 계정은 멤버 상태와 상관없이 owner 다", () => {
    expect(gateOf(true, { member: { status: "pending", role: "user" }, isOwner: true })).toBe("owner");
  });

  it("서비스를 쓸 수 있는 멤버는 승인된 사람뿐이다 — DB 의 is_approved() 와 같다", () => {
    expect(isApproved({ status: "approved", role: "user" })).toBe(true);
    expect(isApproved({ status: "pending", role: "user" })).toBe(false);
    expect(isApproved(null)).toBe(false);
  });
});

describe("게이트에 따른 이동", () => {
  const cases: [Gate, string, string | null][] = [
    // 로그인 안 함
    ["signed-out", "/", "/login"],
    ["signed-out", "/matches/1", "/login"],
    ["signed-out", "/login", null],
    ["signed-out", "/login/admin", null],
    // 온보딩 전
    ["needs-onboarding", "/", "/onboarding"],
    ["needs-onboarding", "/login", "/onboarding"],
    ["needs-onboarding", "/onboarding", null],
    // 승인 전에는 대기 화면만
    ["pending", "/", "/pending"],
    ["pending", "/onboarding", "/pending"],
    ["pending", "/pending", null],
    ["rejected", "/admin", "/pending"],
    ["inactive", "/matches/1", "/pending"],
    // 승인됨
    ["approved", "/", null],
    ["approved", "/matches/1", null],
    ["approved", "/login", "/"],
    ["approved", "/login/admin", "/"],
    ["approved", "/onboarding", "/"],
    ["approved", "/pending", "/"],
    ["approved", "/admin", "/"],
    ["approved", "/admin/members", "/"],
    // 관리자
    ["admin", "/", null],
    ["admin", "/admin", null],
    ["admin", "/admin/members", null],
    ["admin", "/pending", "/"],
    // 어드민 계정은 선수가 아니라서 관리 화면만 쓴다
    ["owner", "/admin", null],
    ["owner", "/admin/members", null],
    ["owner", "/", "/admin"],
    ["owner", "/matches/1", "/admin"],
    ["owner", "/login", "/admin"],
    ["owner", "/login/admin", "/admin"],
    ["owner", "/onboarding", "/admin"],
    ["owner", "/pending", "/admin"],
  ];

  it.each(cases)("%s 상태로 %s 에 오면 → %s", (gate, pathname, expected) => {
    expect(gateRedirect(gate, pathname)).toBe(expected);
  });

  it("이름만 비슷한 경로는 같은 경로로 보지 않는다", () => {
    expect(gateRedirect("approved", "/administrator")).toBeNull();
    expect(gateRedirect("signed-out", "/login-help")).toBe("/login");
  });

  it.each(["signed-out", "pending", "approved", "owner"] as const)(
    "로그인 콜백과 공유 링크는 어떤 상태든 막지 않는다 (%s)",
    (gate) => {
      expect(gateRedirect(gate, "/auth/callback")).toBeNull();
      expect(gateRedirect(gate, "/s/abc")).toBeNull();
    },
  );
});
