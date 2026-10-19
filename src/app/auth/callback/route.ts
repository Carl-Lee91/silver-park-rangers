import { NextResponse, type NextRequest } from "next/server";
import { callbackDestination } from "@/features/kakao-login";
import { completeOAuthLogin } from "@/shared/api";
import { getServerEnv } from "@/shared/config";

/**
 * 카카오 로그인을 마치고 돌아오는 자리. 일회용 코드를 세션으로 바꾸고 갈 곳으로 보낸다.
 *
 * 🔴 돌아갈 주소의 앞부분은 설정값(`SITE_URL`)이다. 요청 헤더에서 뽑으면 보내는 쪽이
 * 정한 곳으로 사용자를 보내게 된다.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const destination = await callbackDestination(
    { code: params.get("code"), error: params.get("error") },
    completeOAuthLogin,
  );
  return NextResponse.redirect(new URL(destination, getServerEnv().SITE_URL));
}
