import { createSupabaseServerClient } from "@/shared/api";
import { toStatsSource, type StatsSource } from "./model/source";

/** 관리자 통계 원본(`admin_stats_source`). 관리자 이상만 부른다 — 아니면 DB 가 거부한다. */
export const fetchStatsSource = async (range: { from: string; to: string }): Promise<StatsSource> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_stats_source", { from_date: range.from, to_date: range.to });
  if (error) throw new Error(`통계를 읽지 못했습니다 — ${error.message}`);
  return toStatsSource(data);
};
