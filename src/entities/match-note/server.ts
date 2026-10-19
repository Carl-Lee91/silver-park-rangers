import { createSupabaseServerClient } from "@/shared/api";
import { toMatchNotes, type MatchNotes } from "./model/matchNote";

/** 이 매치의 특이사항. 관리자가 아니면 RLS 때문에 빈 값이 온다. */
export const fetchMatchNotes = async (matchId: string): Promise<MatchNotes> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("match_notes").select("member_id, note").eq("match_id", matchId);
  if (error) throw new Error(`특이사항을 읽지 못했습니다 — ${error.message}`);
  return toMatchNotes(data);
};
