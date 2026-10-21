"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { adminMatchPath, adminSquadPath } from "@/shared/config";
import type { ActionState } from "@/shared/ui";
import { readGuestForm, toGuestRpcArgs, validateGuest, type GuestState } from "../model/guestSchema";

/**
 * 그날 용병(PLAN.md §4). 멤버 행·참석·용병 표시를 한 번에 바꿔야 해서 DB 함수로만 쓴다.
 * 권한 검사도 DB 함수가 한다(관리자 이상).
 */
const refresh = (matchId: string) => {
  revalidatePath(adminMatchPath(matchId));
  revalidatePath(adminSquadPath(matchId));
};

/** 넣으면 그 매치에 참석으로 들어가 스쿼드 빌더 벤치에 오른다. */
export async function addMatchGuest(_previous: GuestState, formData: FormData): Promise<GuestState> {
  const result = validateGuest(readGuestForm(formData));
  if (!result.ok) return { errors: result.errors };

  const matchId = String(formData.get("matchId"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("add_match_guest", { target_match: matchId, ...toGuestRpcArgs(result.value) });
  if (error) return { message: dbErrorMessage(error.code) };

  refresh(matchId);
  return { saved: true };
}

export async function updateMatchGuest(_previous: GuestState, formData: FormData): Promise<GuestState> {
  const result = validateGuest(readGuestForm(formData));
  if (!result.ok) return { errors: result.errors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_match_guest", {
    target: String(formData.get("memberId")),
    ...toGuestRpcArgs(result.value),
  });
  if (error) return { message: dbErrorMessage(error.code) };

  refresh(String(formData.get("matchId")));
  return { saved: true };
}

/** 빼면 멤버 행이 지워진다. 스쿼드 자리는 빈칸, 골 기록은 "모름"이 된다. */
export async function removeMatchGuest(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_match_guest", { target: String(formData.get("memberId")) });
  if (error) return { error: dbErrorMessage(error.code) };

  refresh(String(formData.get("matchId")));
  return {};
}
