import { ROUTES } from "@/shared/config";

/**
 * 카카오 로그인을 마치고 `/auth/callback` 으로 돌아왔을 때 갈 곳.
 * 성공하면 홈으로 보낸다 — 온보딩 전이면 온보딩, 승인 전이면 대기 화면으로 보내는 일은
 * proxy 의 게이트가 한다. 판단을 한 곳에만 둔다.
 */
export const callbackDestination = async (
  params: { code: string | null; error: string | null },
  exchange: (code: string) => Promise<boolean>,
): Promise<string> => {
  if (params.error !== null) return `${ROUTES.login}?error=${encodeURIComponent(params.error)}`;
  if (params.code === null || !(await exchange(params.code))) return `${ROUTES.login}?error=exchange`;
  return ROUTES.home;
};
