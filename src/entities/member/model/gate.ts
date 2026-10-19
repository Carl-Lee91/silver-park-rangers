import { isUnder, ROUTES } from "@/shared/config";
import type { MemberRole, MemberStatus } from "./member";

export type GateMember = { status: MemberStatus; role: MemberRole };

/** 승인 게이트에서 본 지금 사람의 상태(PLAN.md §4) */
export type Gate =
  | "signed-out"
  | "needs-onboarding"
  | "pending"
  | "rejected"
  | "inactive"
  | "approved"
  | "admin";

/** 🔴 DB 의 `is_approved()` 와 같은 정의다. 둘이 어긋나면 화면은 열리는데 데이터가 빈다. */
export const isApproved = (member: GateMember | null) => member?.status === "approved";

/** 🔴 DB 의 `is_admin()` 과 같은 정의다. 승인되지 않은 관리자 역할은 관리자가 아니다. */
export const isAdmin = (member: GateMember | null) => isApproved(member) && member?.role === "admin";

export const gateOf = (signedIn: boolean, member: GateMember | null): Gate => {
  if (!signedIn) return "signed-out";
  if (member === null) return "needs-onboarding";
  if (isAdmin(member)) return "admin";
  return member.status;
};

/** 로그인 콜백과 카톡 공유 링크는 게이트가 막지 않는다(공유는 PLAN.md §8). */
const PUBLIC_PREFIXES = ["/auth", "/s"];

export const isPublicPath = (pathname: string) =>
  PUBLIC_PREFIXES.some((prefix) => isUnder(pathname, prefix));

const GATE_PAGES = [ROUTES.login, ROUTES.onboarding, ROUTES.pending];

/**
 * 이 주소에 들어가도 되는지. 되면 null, 안 되면 보낼 곳.
 *
 * 🔴 이것은 길 안내다. 실제 접근 통제는 DB 의 RLS 가 한다 — 주소를 직접 쳐서 화면에
 * 들어와도 승인 안 된 사람에게는 데이터가 가지 않는다.
 */
export const gateRedirect = (gate: Gate, pathname: string): string | null => {
  if (isPublicPath(pathname)) return null;
  const at = (path: string) => isUnder(pathname, path);
  const only = (path: string) => (at(path) ? null : path);

  switch (gate) {
    case "signed-out":
      return only(ROUTES.login);
    case "needs-onboarding":
      return only(ROUTES.onboarding);
    case "pending":
    case "rejected":
    case "inactive":
      return only(ROUTES.pending);
    case "approved":
      return GATE_PAGES.some(at) || at(ROUTES.admin) ? ROUTES.home : null;
    case "admin":
      return GATE_PAGES.some(at) ? ROUTES.home : null;
  }
};
