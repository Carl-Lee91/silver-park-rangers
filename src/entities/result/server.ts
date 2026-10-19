import { createSupabaseServerClient } from "@/shared/api";
import { GOAL_COLUMNS, toGoals, toQuarterScores, type Goal, type QuarterScore } from "./model/result";

/** 이 매치의 쿼터 점수와 골. 승인된 사람만 읽을 수 있다(RLS). */
export const fetchMatchResult = async (matchId: string): Promise<{ scores: QuarterScore[]; goals: Goal[] }> => {
  const supabase = await createSupabaseServerClient();
  const [scores, goals] = await Promise.all([
    supabase.from("match_quarter_results").select("number, their_score").eq("match_id", matchId),
    supabase.from("match_goals").select(GOAL_COLUMNS).eq("match_id", matchId).order("created_at"),
  ]);
  if (scores.error) throw new Error(`경기 결과를 읽지 못했습니다 — ${scores.error.message}`);
  if (goals.error) throw new Error(`골 기록을 읽지 못했습니다 — ${goals.error.message}`);
  return { scores: toQuarterScores(scores.data), goals: toGoals(goals.data) };
};
