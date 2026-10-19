// 🔴 서버 전용 배럴이다. 클라이언트 컴포넌트에서 import 하지 않는다(next/headers 가 딸려 간다).
export type { SupabaseClient as DbClient } from "@supabase/supabase-js";
export {
  completeOAuthLogin,
  fetchAuthSettings,
  getAuthUserId,
  signInWithPassword,
  signOut,
  startOAuthLogin,
} from "./auth";
export { dbErrorMessage } from "./dbError";
export { createSupabaseServerClient } from "./supabaseServer";
export { updateSession, withSessionCookies } from "./supabaseProxy";
