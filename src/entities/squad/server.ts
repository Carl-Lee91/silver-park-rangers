import { createSupabaseServerClient } from "@/shared/api";
import { SQUAD_COLUMNS, toSavedQuarters, type SavedQuarter } from "./model/savedSquad";

/**
 * 저장된 스쿼드. 공개 전에는 관리자만 읽을 수 있다(RLS) — 그 밖의 사람에게는 빈 배열이 온다.
 */
export const fetchSquad = async (matchId: string): Promise<SavedQuarter[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("quarters").select(SQUAD_COLUMNS).eq("match_id", matchId);
  if (error) throw new Error(`스쿼드를 읽지 못했습니다 — ${error.message}`);
  return toSavedQuarters(data);
};
