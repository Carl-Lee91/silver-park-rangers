"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage, getAuthUserId } from "@/shared/api";
import { adminMatchPath, adminSquadPath } from "@/shared/config";
import type { ActionState } from "@/shared/ui";
import { validateNote } from "../model/note";

/** 특이사항을 쓰거나(비우면) 지운다. 권한은 RLS 가 본다 — 관리자 이상만. */
export async function saveMatchNote(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const matchId = String(formData.get("matchId"));
  const memberId = String(formData.get("memberId"));
  const result = validateNote(String(formData.get("note") ?? ""));
  if (!result.ok) return { error: result.error };

  const supabase = await createSupabaseServerClient();
  const { error } =
    result.value === null
      ? await supabase.from("match_notes").delete().eq("match_id", matchId).eq("member_id", memberId)
      : await supabase.from("match_notes").upsert(
          { match_id: matchId, member_id: memberId, note: result.value, updated_by: await getAuthUserId() },
          { onConflict: "match_id,member_id" },
        );
  if (error) return { error: dbErrorMessage(error.code) };

  revalidatePath(adminSquadPath(matchId));
  revalidatePath(adminMatchPath(matchId));
  return {};
}
