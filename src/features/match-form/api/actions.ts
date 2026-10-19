"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, dbErrorMessage, getAuthUserId } from "@/shared/api";
import { adminMatchPath, ROUTES } from "@/shared/config";
import type { ActionState } from "@/shared/ui";
import { readMatchForm, validateMatch, type MatchFormState, type NewMatch } from "../model/matchSchema";

/** 권한 검사는 RLS 가 한다(매치 쓰기는 관리자 이상). */
const toRow = (match: NewMatch) => ({
  match_date: match.date,
  starts_at: match.startsAt,
  ends_at: match.endsAt,
  quarter_count: match.quarterCount,
  venue: match.venue,
  opponent: match.opponent,
  vote_deadline: match.voteDeadline,
});

const refresh = () => {
  revalidatePath(ROUTES.admin, "layout");
  revalidatePath(ROUTES.home, "layout");
};

export async function createMatch(_previous: MatchFormState, formData: FormData): Promise<MatchFormState> {
  const result = validateMatch(readMatchForm(formData));
  if (!result.ok) return { errors: result.errors };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("matches")
    .insert({ ...toRow(result.value), created_by: await getAuthUserId() })
    .select("id")
    .single();
  if (error) return { message: dbErrorMessage(error.code) };

  refresh();
  redirect(adminMatchPath(data.id));
}

export async function updateMatch(_previous: MatchFormState, formData: FormData): Promise<MatchFormState> {
  const id = String(formData.get("matchId"));
  const result = validateMatch(readMatchForm(formData));
  if (!result.ok) return { errors: result.errors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("matches").update(toRow(result.value)).eq("id", id);
  if (error) return { message: dbErrorMessage(error.code) };

  refresh();
  redirect(adminMatchPath(id));
}

/** 참석 투표·쿼터도 함께 지워진다(on delete cascade). */
export async function deleteMatch(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("matches").delete().eq("id", String(formData.get("matchId")));
  if (error) return { error: dbErrorMessage(error.code) };

  refresh();
  redirect(ROUTES.adminMatches);
}
