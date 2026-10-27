"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage, getAuthUserId } from "@/shared/api";
import { adminMemberPath } from "@/shared/config";
import type { ActionState } from "@/shared/ui";
import { parseRatingForm } from "../model/ratingForm";

/** 선수 능력치를 저장한다(처음이면 만든다). 권한은 RLS 가 본다 — 관리자 이상만. */
export async function saveRatings(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const memberId = String(formData.get("memberId"));
  const parsed = parseRatingForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("member_ratings")
    .upsert({ member_id: memberId, ...parsed.values, updated_by: await getAuthUserId() }, { onConflict: "member_id" });
  if (error) return { error: dbErrorMessage(error.code) };

  revalidatePath(adminMemberPath(memberId));
  return {};
}
