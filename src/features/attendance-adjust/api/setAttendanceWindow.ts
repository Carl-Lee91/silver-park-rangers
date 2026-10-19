"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { adminMatchPath, adminSquadPath, matchPath } from "@/shared/config";
import type { ActionState } from "@/shared/ui";
import { readWindowForm } from "../model/window";

/**
 * 당일 변동(지각·부상·일찍 감)을 관리자가 그 사람의 도착·떠나는 시간으로 남긴다.
 * 투표(응답)는 건드리지 않는다. 권한은 RLS 가 본다 — 남의 행은 관리자 이상만 쓴다.
 */
export async function setAttendanceWindow(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const result = readWindowForm(formData);
  if (!result.ok) return { error: result.error };
  const { matchId, memberId, arriveAt, leaveAt } = result.value;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("match_attendance")
    .upsert({ match_id: matchId, member_id: memberId, arrive_at: arriveAt, leave_at: leaveAt }, { onConflict: "match_id,member_id" });
  if (error) return { error: dbErrorMessage(error.code) };

  revalidatePath(adminSquadPath(matchId));
  revalidatePath(adminMatchPath(matchId));
  revalidatePath(matchPath(matchId));
  return {};
}
