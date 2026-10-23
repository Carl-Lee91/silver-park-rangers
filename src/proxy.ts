import { NextResponse, type NextRequest } from "next/server";
import { gateOf, gateRedirect, isPublicPath, selectGateAccess, type GateAccess } from "@/entities/member";
import { updateSession, withSessionCookies } from "@/shared/api";

/**
 * 모든 화면 요청 앞에서 두 가지를 한다.
 *
 * 1. Supabase 세션을 갱신한다(만료 토큰 교체는 여기서만 할 수 있다).
 * 2. 승인 게이트(PLAN.md §4)에 따라 갈 곳으로 보낸다. 판단은 `gateRedirect` 가 한다.
 *
 * 🔴 이것은 길 안내다. 실제 접근 통제는 DB 의 RLS 가 한다.
 */
export async function proxy(request: NextRequest) {
  const { response, supabase, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return response;

  let access: GateAccess = { member: null, isOwner: false };
  if (userId !== null) {
    const result = await selectGateAccess(supabase);
    // 권한을 못 읽으면 막지도 보내지도 않는다. 잘못 보내면 승인된 사람이 온보딩으로 간다.
    if (!result.ok) return response;
    access = result.access;
  }

  const target = gateRedirect(gateOf(userId !== null, access), pathname);
  if (target === null) return response;
  return withSessionCookies(response, NextResponse.redirect(new URL(target, request.url)));
}

export const config = {
  // 정적 파일·이미지·PWA 매니페스트·서비스 워커·연결 안 됨 화면에는 돌리지 않는다. 로그인 화면으로 보내지면
  // 홈 화면에 추가 · 앱 설치가 안 되고, 로그인 전 화면의 엠블럼이 깨진다(proxy.test.ts).
  matcher: ["/((?!_next/static|_next/image|manifest.webmanifest|sw.js|offline.html|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
