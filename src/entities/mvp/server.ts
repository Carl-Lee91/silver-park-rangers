import { z } from "zod";
import { createSupabaseServerClient, getAuthUserId } from "@/shared/api";
import { toMvpTally, type MvpTally } from "./model/mvp";

/** 내가 뽑은 사람(없으면 null). 내 표만 읽힌다(RLS) */
export const fetchMyMvpVote = async (matchId: string): Promise<string | null> => {
  const userId = await getAuthUserId();
  if (userId === null) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mvp_votes")
    .select("candidate_id")
    .eq("match_id", matchId)
    .eq("voter_id", userId)
    .maybeSingle();
  if (error) throw new Error(`MVP 표를 읽지 못했습니다 — ${error.message}`);
  return data === null ? null : String(data.candidate_id);
};

/** 몇 명이 투표했는지(여는 중에도 본다) */
export const fetchMvpVoterCount = async (matchId: string): Promise<number> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("mvp_voter_count", { target: matchId });
  if (error) throw new Error(`MVP 투표 수를 읽지 못했습니다 — ${error.message}`);
  return z.number().int().parse(data);
};

/** 결과(마감 뒤에만 온다). 많이 받은 순 */
export const fetchMvpResults = async (matchId: string): Promise<MvpTally[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("mvp_results", { target: matchId });
  if (error) throw new Error(`MVP 결과를 읽지 못했습니다 — ${error.message}`);
  return (data as unknown[]).map(toMvpTally);
};
