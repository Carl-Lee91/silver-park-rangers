"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage, getAuthUserId } from "@/shared/api";
import { matchPath } from "@/shared/config";
import type { ActionState } from "@/shared/ui";

/**
 * MVP 투표 · 바꾸기(PLAN.md §10). 기간(끝나고 이틀) · 뛴 사람끼리 · 자기 자신 빼기는 DB(RLS · 제약)가 본다.
 */
export async function submitMvpVote(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await getAuthUserId();
  if (userId === null) return { error: "다시 로그인해 주세요." };
  const matchId = String(formData.get("matchId"));
  const candidateId = String(formData.get("candidateId") ?? "");
  if (candidateId === "") return { error: "MVP 를 골라 주세요." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("mvp_votes")
    .upsert(
      { match_id: matchId, voter_id: userId, candidate_id: candidateId, updated_at: new Date().toISOString() },
      { onConflict: "match_id,voter_id" },
    );
  if (error) return { error: error.code === "42501" ? "투표가 마감됐거나 이 매치에 뛴 사람만 투표해요." : dbErrorMessage(error.code) };

  revalidatePath(matchPath(matchId));
  return {};
}
