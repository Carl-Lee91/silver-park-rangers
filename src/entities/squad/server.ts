import { createSupabaseServerClient } from "@/shared/api";
import { isUuid } from "@/shared/lib";
import { SQUAD_COLUMNS, toSavedQuarters, type SavedQuarter } from "./model/savedSquad";
import { toSharedSquad, type SharedSquad } from "./model/sharedSquad";

/**
 * 저장된 스쿼드. 공개 전에는 관리자만 읽을 수 있다(RLS) — 그 밖의 사람에게는 빈 배열이 온다.
 */
export const fetchSquad = async (matchId: string): Promise<SavedQuarter[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("quarters").select(SQUAD_COLUMNS).eq("match_id", matchId);
  if (error) throw new Error(`스쿼드를 읽지 못했습니다 — ${error.message}`);
  return toSavedQuarters(data);
};

/**
 * 공유 링크로 보는 스쿼드. 로그인하지 않아도 부를 수 있다(`shared_squad` 는 anon 에게 열려 있다).
 * 공개 전이거나 틀린 토큰이면 null.
 */
export const fetchSharedSquad = async (token: string): Promise<SharedSquad | null> => {
  if (!isUuid(token)) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("shared_squad", { token });
  if (error) throw new Error(`공유 스쿼드를 읽지 못했습니다 — ${error.message}`);
  return toSharedSquad(data);
};

/** 스쿼드를 저장한 매치(관리 › 스쿼드). 공개 전 스쿼드는 RLS 가 관리자에게만 보여 준다. */
export const fetchSquadMatchIds = async (matchIds: readonly string[]): Promise<Set<string>> => {
  if (matchIds.length === 0) return new Set();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("quarters").select("match_id").in("match_id", matchIds);
  if (error) throw new Error(`스쿼드 목록을 읽지 못했습니다 — ${error.message}`);
  return new Set(data.map((row: { match_id: string }) => row.match_id));
};
