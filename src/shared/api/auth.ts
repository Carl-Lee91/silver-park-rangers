import { getEnv } from "@/shared/config";
import { isLinkAccount, LINK_ACCOUNT_METADATA, linkAccountEmail } from "./linkAccount";
import { createSupabaseAdminClient } from "./supabaseAdmin";
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

/**
 * 지금 로그인한 계정이 개인 링크로 만든 계정인지(PLAN.md §4). 링크 계정은 비밀번호로 들어오지 않아서
 * 내 정보에 비밀번호 바꾸기를 두지 않는다. 로그인하지 않았으면 false.
 */
export const isSignedInByLink = async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  return isLinkAccount(data?.claims?.app_metadata);
};

export type LinkSignInResult = { ok: true } | { ok: false; reason: "no-key" | "failed"; detail?: string };

/**
 * 개인 링크로 그 멤버가 되어 들어간다(PLAN.md §4). 링크가 맞는지는 부르는 쪽이 먼저 본다(`link_member`).
 *
 * 1. 로그인 계정이 없으면 멤버 id 그대로 만든다 — RLS 의 "id = auth.uid()" 가 그대로 맞는다.
 *    이메일 칸은 메일이 가지 않는 표시용 주소이고, 링크 계정 표시를 남긴다.
 * 2. 로그인 링크의 토큰을 만들어(메일은 보내지 않는다) 이 요청의 세션으로 바꾼다 — 세션은 쿠키에 남는다.
 *
 * 이메일로 가입한 사람도 같은 길로 들어간다(비밀번호는 그대로).
 */
export const signInAsMember = async (memberId: string): Promise<LinkSignInResult> => {
  const admin = createSupabaseAdminClient();
  if (admin === null) return { ok: false, reason: "no-key" };

  const found = await admin.auth.admin.getUserById(memberId);
  let email = found.data.user?.email ?? null;
  if (found.data.user === null) {
    if (found.error && found.error.status !== 404) return { ok: false, reason: "failed", detail: found.error.message };
    const created = await admin.auth.admin.createUser({
      id: memberId,
      email: linkAccountEmail(memberId),
      email_confirm: true,
      app_metadata: LINK_ACCOUNT_METADATA,
    });
    if (created.error) return { ok: false, reason: "failed", detail: created.error.message };
    email = created.data.user.email ?? null;
  }
  if (email === null) return { ok: false, reason: "failed", detail: "계정에 이메일이 없어요" };

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) return { ok: false, reason: "failed", detail: link.error.message };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: link.data.properties.hashed_token,
    type: link.data.properties.verification_type,
  });
  return error === null ? { ok: true } : { ok: false, reason: "failed", detail: error.message };
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
