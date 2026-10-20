import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/shared/config";

/**
 * Supabase 무료 프로젝트는 7일 동안 요청이 없으면 일시정지된다. 하루 한 번 가벼운 요청을 보낸다.
 * 세션이 필요 없어서 쿠키 없는 클라이언트를 쓴다. RLS 때문에 빈 결과가 와도 요청은 DB 까지 간다.
 */
export const pingDatabase = async () => {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getEnv();
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.from("formations").select("id").limit(1);
  return error === null ? ({ ok: true } as const) : ({ ok: false, message: error.message } as const);
};
