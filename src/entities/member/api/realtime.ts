import { getSupabaseBrowserClient } from "@/shared/api/browser";

/**
 * members 표가 바뀌면(가입 신청·승인·휴면) `onChange` 를 부른다. 돌려준 함수로 그만 듣는다.
 * Realtime 도 RLS 를 따르므로 관리자 이상만 다른 사람의 바뀜을 받는다.
 */
export const watchMembers = (onChange: () => void) => {
  const supabase = getSupabaseBrowserClient();
  const channel = supabase
    .channel("members-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => onChange())
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
};
