import { createClient } from "@supabase/supabase-js";
import { getEnv, getServerEnv } from "@/shared/config";

/**
 * 서버 전용 키(service role)로 만든 클라이언트. 키가 없으면 null.
 *
 * 🔴 RLS 를 건너뛴다. 개인 링크 로그인(계정 만들기 · 세션 열기, `signInAsMember`)에만 쓰고, 데이터를 읽고 쓰는 데
 * 쓰지 않는다 — 데이터 권한은 RLS 가 정한다. 세션을 남기지 않는다(요청마다 새로 만든다).
 */
export const createSupabaseAdminClient = () => {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  if (SUPABASE_SERVICE_ROLE_KEY === "") return null;
  return createClient(getEnv().NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

/** 개인 링크로 들어갈 준비가 됐는지(서버 전용 키가 있는지). 링크 화면이 빠진 것을 알려 줄 때 쓴다 */
export const hasServiceRoleKey = () => getServerEnv().SUPABASE_SERVICE_ROLE_KEY !== "";
