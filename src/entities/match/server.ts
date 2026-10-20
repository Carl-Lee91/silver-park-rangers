import { createSupabaseServerClient } from "@/shared/api";
import { isUuid } from "@/shared/lib";
import { MATCH_COLUMNS, toMatch, type Match } from "./model/match";
import { seoulToday } from "./model/matchTime";

/** 오늘(한국 날짜)부터의 매치, 가까운 순 */
export const fetchUpcomingMatches = async (today: string = seoulToday()): Promise<Match[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_COLUMNS)
    .gte("match_date", today)
    .order("match_date")
    .order("starts_at");
  if (error) throw new Error(`매치 목록을 읽지 못했습니다 — ${error.message}`);
  return data.map(toMatch);
};

/** 지난 매치, 최근 순 */
export const fetchPastMatches = async (today: string = seoulToday(), limit = 10): Promise<Match[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_COLUMNS)
    .lt("match_date", today)
    .order("match_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`지난 매치를 읽지 못했습니다 — ${error.message}`);
  return data.map(toMatch);
};

/** 매치 하나. 없거나(볼 권한이 없어도 없는 것과 같다) id 모양이 틀리면 null. */
export const fetchMatch = async (id: string): Promise<Match | null> => {
  if (!isUuid(id)) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("matches").select(MATCH_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`매치를 읽지 못했습니다 — ${error.message}`);
  return data === null ? null : toMatch(data);
};
