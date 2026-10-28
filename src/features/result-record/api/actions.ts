"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { adminLivePath, adminMatchPath, matchPath, ROUTES } from "@/shared/config";
import type { ActionState } from "@/shared/ui";
import { readGoalForm, readScoreForm } from "../model/goalForm";

/** 권한은 RLS 가 본다 — 결과는 관리자 이상만 쓴다. 쿼터 범위는 DB 트리거가 다시 본다. */
const refresh = (matchId: string) => {
  revalidatePath(adminMatchPath(matchId));
  // 현장 모드(PLAN.md §10)에서도 쿼터가 끝나면 바로 기록한다
  revalidatePath(adminLivePath(matchId));
  revalidatePath(matchPath(matchId));
  revalidatePath(ROUTES.adminStats);
};

export async function addGoal(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const result = readGoalForm(formData);
  if (!result.ok) return { error: result.error };
  const { matchId, quarter, scorerId, assistId } = result.value;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("match_goals")
    .insert({ match_id: matchId, quarter_number: quarter, scorer_id: scorerId, assist_id: assistId });
  if (error) return { error: dbErrorMessage(error.code) };

  refresh(matchId);
  return {};
}

export async function removeGoal(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const matchId = String(formData.get("matchId"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("match_goals").delete().eq("id", String(formData.get("goalId")));
  if (error) return { error: dbErrorMessage(error.code) };

  refresh(matchId);
  return {};
}

/** 상대 점수. 처음 남기면 그 쿼터의 결과 행이 생긴다 — 0:0 으로 끝난 쿼터도 이렇게 남긴다. */
export async function setTheirScore(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const result = readScoreForm(formData);
  if (!result.ok) return { error: result.error };
  const { matchId, quarter, theirScore } = result.value;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("match_quarter_results")
    .upsert({ match_id: matchId, number: quarter, their_score: theirScore }, { onConflict: "match_id,number" });
  if (error) return { error: dbErrorMessage(error.code) };

  refresh(matchId);
  return {};
}
