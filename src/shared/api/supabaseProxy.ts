import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/shared/config";

/**
 * proxy 에서 세션을 갱신한다. 만료된 토큰을 새로 받아 쿠키에 다시 심는 곳이 여기뿐이다
 * (Server Component 는 쿠키를 못 쓴다).
 *
 * 돌려주는 `response` 에 갱신된 쿠키가 실려 있다. 🔴 다른 응답(리다이렉트 등)을 돌려줄
 * 때는 `withSessionCookies` 로 쿠키를 옮겨 실어야 한다. 안 옮기면 브라우저와 서버의
 * 세션이 어긋나 사용자가 까닭 없이 로그아웃된다.
 */
export const updateSession = async (request: NextRequest) => {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // 🔴 createServerClient 와 getClaims 사이에 다른 코드를 넣지 않는다(Supabase 안내).
  // getClaims 가 토큰을 검증하고, 만료됐으면 갱신해 setAll 을 부른다.
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  return { response, supabase, userId };
};

/** 세션 갱신으로 생긴 쿠키를 다른 응답에도 옮겨 싣는다. */
export const withSessionCookies = (from: NextResponse, to: NextResponse) => {
  for (const cookie of from.cookies.getAll()) to.cookies.set(cookie);
  return to;
};
