import { getEnv } from "@/shared/config";
import { createSupabaseServerClient } from "./supabaseServer";

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

/** 이메일·비밀번호 로그인. 팀원도 어드민 계정도 이것 하나만 쓴다(PLAN.md §2). */
export const signInWithPassword = async (email: string, password: string) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error === null ? ({ ok: true } as const) : ({ ok: false, code: error.code } as const);
};

/**
 * 가입 신청. 프로필은 계정 메타데이터로 실어 보내고, 계정이 만들어질 때 DB 트리거가 멤버 행을 만든다.
 * 이메일 확인이 꺼져 있으면 바로 로그인된다(`signedIn`). 켜져 있으면 세션이 오지 않는다.
 */
export const signUpWithPassword = async (email: string, password: string, metadata: Record<string, unknown>) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
  if (error) return { ok: false, code: error.code } as const;
  return { ok: true, signedIn: data.session !== null } as const;
};

/** 지금 로그인한 사람의 비밀번호를 바꾼다. */
export const updateMyPassword = async (password: string) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  return error === null ? ({ ok: true } as const) : ({ ok: false, code: error.code } as const);
};

export const signOut = async () => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
};

/**
 * Supabase Auth 의 공개 설정(가입을 받는지, 이메일 확인이 켜졌는지 등). 읽지 못하면 null.
 *
 * 설정이 빠진 채로 가입 신청을 누르면 사용자가 알 수 없는 오류를 만난다. 그래서 화면이
 * 먼저 이 값을 보고, 무엇을 바꿔야 하는지 안내한다.
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
