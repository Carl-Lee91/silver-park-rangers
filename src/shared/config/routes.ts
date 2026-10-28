/** 화면 주소. 문자열을 곳곳에 흩어 두지 않는다. */
export const ROUTES = {
  home: "/",
  login: "/login",
  /** 가입 신청. 로그인 전에 열린다 */
  signup: "/signup",
  /** 신청 정보가 빠진 계정만 온다(PLAN.md §4) */
  onboarding: "/onboarding",
  pending: "/pending",
  me: "/me",
  admin: "/admin",
  adminMembers: "/admin/members",
  adminMatches: "/admin/matches",
  adminMatchNew: "/admin/matches/new",
  /** 매치별 스쿼드 상태를 모아 보고 빌더로 바로 간다 */
  adminSquads: "/admin/squads",
  adminFormations: "/admin/formations",
  adminStats: "/admin/stats",
  /** 회비 · 벌금 장부(PLAN.md §10) */
  adminDues: "/admin/dues",
} as const;

export const matchPath = (id: string) => `/matches/${id}`;
export const adminMatchPath = (id: string) => `/admin/matches/${id}`;
export const adminMatchEditPath = (id: string) => `/admin/matches/${id}/edit`;
export const adminSquadPath = (id: string) => `/admin/matches/${id}/squad`;

/** 풋살 팀 나누기(PLAN.md §6 "풋살"). 풋살 매치는 스쿼드 빌더 대신 여기로 간다 */
export const adminTeamsPath = (id: string) => `/admin/matches/${id}/teams`;

/**
 * 관리자 전용 선수 상세(PLAN.md §7 관리자). `from` 은 온 화면(스쿼드 · 매치 관리 등)이고, 상세의 뒤로 가기가 그리로 간다
 */
export const adminMemberPath = (id: string, from?: string) =>
  from === undefined ? `/admin/members/${id}` : `/admin/members/${id}?from=${encodeURIComponent(from)}`;

/** 개인 링크(PLAN.md §4). 누르면 그 사람으로 들어간다. 로그인 전에도 열린다(게이트 예외) */
export const linkLoginPath = (token: string) => `/j/${token}`;

/**
 * `pathname` 이 `base` 이거나 그 아래 주소인지. `/admin` 은 `/admin/members` 를 품지만
 * `/administrator` 는 품지 않는다.
 */
export const isUnder = (pathname: string, base: string) =>
  base === "/" ? true : pathname === base || pathname.startsWith(`${base}/`);
