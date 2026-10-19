import { NextResponse, type NextRequest } from "next/server";
import { gateOf, gateRedirect, isPublicPath, selectGateMember } from "@/entities/member";
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

  let member = null;
  if (userId !== null) {
    const result = await selectGateMember(supabase, userId);
    // 멤버 정보를 못 읽으면 막지도 보내지도 않는다. 잘못 보내면 승인된 사람이 온보딩으로 간다.
    if (!result.ok) return response;
    member = result.member;
  }

  const target = gateRedirect(gateOf(userId !== null, member), pathname);
  if (target === null) return response;
  return withSessionCookies(response, NextResponse.redirect(new URL(target, request.url)));
}

export const config = {
  // 정적 파일과 이미지에는 돌리지 않는다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
