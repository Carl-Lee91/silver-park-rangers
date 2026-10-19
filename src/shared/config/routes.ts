/** 화면 주소. 문자열을 곳곳에 흩어 두지 않는다. */
export const ROUTES = {
  home: "/",
  login: "/login",
  /** 어드민 전용 계정(이메일·비밀번호) 로그인. `/login` 아래라 로그인 전에도 열린다. */
  adminLogin: "/login/admin",
  onboarding: "/onboarding",
  pending: "/pending",
  admin: "/admin",
  adminMembers: "/admin/members",
  adminMatches: "/admin/matches",
  adminMatchNew: "/admin/matches/new",
  adminFormations: "/admin/formations",
  adminStats: "/admin/stats",
  authCallback: "/auth/callback",
} as const;

export const matchPath = (id: string) => `/matches/${id}`;
export const adminMatchPath = (id: string) => `/admin/matches/${id}`;
export const adminMatchEditPath = (id: string) => `/admin/matches/${id}/edit`;
export const adminSquadPath = (id: string) => `/admin/matches/${id}/squad`;

/**
 * `pathname` 이 `base` 이거나 그 아래 주소인지. `/admin` 은 `/admin/members` 를 품지만
 * `/administrator` 는 품지 않는다.
 */
export const isUnder = (pathname: string, base: string) =>
  base === "/" ? true : pathname === base || pathname.startsWith(`${base}/`);
