/** 화면 주소. 문자열을 곳곳에 흩어 두지 않는다. */
export const ROUTES = {
  home: "/",
  login: "/login",
  onboarding: "/onboarding",
  pending: "/pending",
  admin: "/admin",
  authCallback: "/auth/callback",
} as const;

/**
 * `pathname` 이 `base` 이거나 그 아래 주소인지. `/admin` 은 `/admin/members` 를 품지만
 * `/administrator` 는 품지 않는다.
 */
export const isUnder = (pathname: string, base: string) =>
  base === "/" ? true : pathname === base || pathname.startsWith(`${base}/`);
