import { isUnder, ROUTES } from "@/shared/config";

export type AdminNavItem = { label: string; href: string };

/** 관리 화면 위쪽 메뉴(PLAN.md §7). 포메이션은 스쿼드 빌더와 관리 홈에서 들어간다. */
export const ADMIN_NAV: readonly AdminNavItem[] = [
  { label: "매치", href: ROUTES.adminMatches },
  { label: "스쿼드", href: ROUTES.adminSquads },
  { label: "멤버", href: ROUTES.adminMembers },
  { label: "회비", href: ROUTES.adminDues },
  { label: "통계", href: ROUTES.adminStats },
];

const SQUAD_BUILDER = /^\/admin\/matches\/[^/]+\/squad(\/|$)/;

/** 지금 화면의 메뉴. 스쿼드 빌더는 매치 아래 주소지만 "스쿼드"로 본다. */
export const activeAdminNav = (pathname: string): AdminNavItem | null => {
  if (SQUAD_BUILDER.test(pathname)) return ADMIN_NAV[1];
  return ADMIN_NAV.find((item) => isUnder(pathname, item.href)) ?? null;
};
