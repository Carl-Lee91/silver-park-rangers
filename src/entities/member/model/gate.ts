import { isUnder, ROUTES } from "@/shared/config";
import type { MemberRole, MemberStatus } from "./member";

export type GateMember = { status: MemberStatus; role: MemberRole };

/** 게이트가 보는 지금 사람. 멤버 행이 없으면 member 는 null(온보딩 전 또는 어드민 계정). */
export type GateAccess = { member: GateMember | null; isOwner: boolean };

/** 승인 게이트에서 본 지금 사람의 상태(PLAN.md §3·§4) */
export type Gate =
  | "signed-out"
  | "needs-onboarding"
  | "pending"
  | "rejected"
  | "inactive"
  | "approved"
  | "admin"
  | "owner";

/** 🔴 멤버 쪽 정의는 DB 의 `is_approved()` 와 같다(어드민 계정은 `isOwner` 로 따로 본다). */
export const isApproved = (member: GateMember | null) => member?.status === "approved";

/** 🔴 DB 의 `is_admin()` 과 같은 정의다. 승인되지 않은 관리자 역할은 관리자가 아니다. */
export const isAdmin = (member: GateMember | null) => isApproved(member) && member?.role === "admin";

export const gateOf = (signedIn: boolean, { member, isOwner }: GateAccess): Gate => {
  if (!signedIn) return "signed-out";
  // 어드민 계정이 먼저다. DB 의 is_admin() 도 어드민이면 멤버 상태를 보지 않는다.
  if (isOwner) return "owner";
  if (member === null) return "needs-onboarding";
  if (isAdmin(member)) return "admin";
  return member.status;
};

/**
 * 게이트가 막지 않는 주소: 카톡 공유 링크(PLAN.md §8), Vercel Cron.
 * Cron 은 로그인하지 않은 Vercel 이 부른다. 대신 CRON_SECRET 으로 확인한다.
 */
const PUBLIC_PREFIXES = ["/s", "/api/cron"];

export const isPublicPath = (pathname: string) =>
  PUBLIC_PREFIXES.some((prefix) => isUnder(pathname, prefix));

const GATE_PAGES = [ROUTES.login, ROUTES.signup, ROUTES.onboarding, ROUTES.pending];
/** 로그인 전에 열리는 화면: 로그인과 가입 신청 */
const SIGNED_OUT_PAGES = [ROUTES.login, ROUTES.signup];

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
      return SIGNED_OUT_PAGES.some(at) ? null : ROUTES.login;
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
    case "owner":
      // 선수가 아니라서 멤버 화면(참석 투표 등)이 없다. 관리 화면만 쓴다.
      return only(ROUTES.admin);
  }
};
