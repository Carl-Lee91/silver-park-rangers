"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { adminMatchPath, adminSquadPath, matchPath, ROUTES } from "@/shared/config";
import type { ActionState } from "@/shared/ui";
import { readProxyVote } from "../model/proxyVote";

/**
 * 관리자가 대신 투표한다(PLAN.md §4 대신 투표). 마감 뒤에도 된다 — 남의 투표는 관리자 이상만 쓴다(RLS).
 * 응답만 바꾼다. 도착 · 떠나는 시간은 그대로(처음이면 처음부터 · 끝까지)이고, 바뀌면 빌더에서 고친다.
 */
export async function submitProxyVote(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const result = readProxyVote(formData);
  if (!result.ok) return { error: result.error };
  const { matchId, memberId, response } = result.value;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("match_attendance")
    .upsert({ match_id: matchId, member_id: memberId, response }, { onConflict: "match_id,member_id" });
  if (error) return { error: dbErrorMessage(error.code) };

  revalidatePath(adminMatchPath(matchId));
  revalidatePath(adminSquadPath(matchId));
  revalidatePath(matchPath(matchId));
  revalidatePath(ROUTES.home);
  return {};
}
