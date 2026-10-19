import { getEnv } from "@/shared/config";
import { createSupabaseServerClient } from "./supabaseServer";

/**
 * 소셜 로그인을 시작한다. 돌려준 주소로 브라우저를 보내면 카카오 화면이 뜬다.
 * 실패하면 null.
 *
 * 코드를 검증하는 열쇠(PKCE code verifier)는 여기서 쿠키에 심긴다. 그래서 로그인을
 * 시작한 브라우저와 돌아온 브라우저가 같아야 한다.
 */
export const startOAuthLogin = async (provider: "kakao", redirectTo: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  return error || !data.url ? null : data.url;
};

/** 제공자가 돌려준 일회용 코드를 세션으로 바꾼다. 쿠키는 여기서 심긴다. */
export const completeOAuthLogin = async (code: string) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error === null;
};

/**
 * 지금 로그인한 사람의 인증 id. 로그인하지 않았으면 null.
 *
 * 🔴 `getSession()` 을 쓰지 않는다. 세션 쿠키는 브라우저가 보낸 값이라 그대로 믿을 수
 * 없다. `getClaims()` 는 토큰 서명을 검증한다.
 */
export const getAuthUserId = async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  return typeof data?.claims?.sub === "string" ? data.claims.sub : null;
};

export const signOut = async () => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
};

/**
 * Supabase Auth 의 공개 설정(어떤 소셜 로그인이 켜져 있는지 등). 읽지 못하면 null.
 *
 * 카카오 제공자를 켜기 전에 로그인 단추를 누르면 사용자가 오류 화면을 만난다. 그래서
 * 화면이 먼저 이 값을 보고, 꺼져 있으면 무엇을 켜야 하는지 안내한다.
 */
export const fetchAuthSettings = async (): Promise<unknown> => {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getEnv();
  try {
    const response = await fetch(`${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY },
      cache: "no-store",
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};
