"use server";

import { revalidatePath } from "next/cache";
import { isVotingOpen, quarterSchedule } from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { createSupabaseServerClient, dbErrorMessage, getAuthUserId } from "@/shared/api";
import { adminMatchPath, matchPath, ROUTES } from "@/shared/config";
import { readVoteForm, validateVote, type VoteState } from "../model/attendanceVote";

/**
 * 내 참석 투표를 남기거나 바꾼다. 마감·권한은 RLS 가 다시 본다(마감 전 · 승인된 본인만).
 * 여기서 먼저 보는 것은 알맞은 안내를 띄우기 위해서다.
 */
export async function submitVote(_previous: VoteState, formData: FormData): Promise<VoteState> {
  const matchId = String(formData.get("matchId"));
  const match = await fetchMatch(matchId);
  if (match === null) return { error: "매치를 찾지 못했어요." };
  if (!isVotingOpen(match)) return { error: "투표가 마감됐어요." };

  const result = validateVote(readVoteForm(formData), quarterSchedule(match));
  if (!result.ok) return { error: result.error };

  const userId = await getAuthUserId();
  if (userId === null) return { error: "다시 로그인해 주세요." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("match_attendance").upsert(
    {
      match_id: matchId,
      member_id: userId,
      response: result.value.response,
      arrive_at: result.value.arriveAt,
      leave_at: result.value.leaveAt,
    },
    { onConflict: "match_id,member_id" },
  );
  if (error) {
    return { error: error.code === "42501" ? "투표가 마감됐거나 투표할 수 없어요." : dbErrorMessage(error.code) };
  }

  revalidatePath(matchPath(matchId));
  revalidatePath(adminMatchPath(matchId));
  revalidatePath(ROUTES.home);
  return {};
}
