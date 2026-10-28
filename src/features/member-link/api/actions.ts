"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { adminMemberPath } from "@/shared/config";
import type { ActionState } from "@/shared/ui";

/**
 * 개인 링크를 만든다 · 새로 만든다(PLAN.md §4). 새로 만들면 예전 링크는 더 안 열린다.
 * 권한은 DB 함수가 본다 — 관리자 이상, 관리자의 링크는 어드민만, 승인된 사람만(그날 용병 빼고).
 */
export async function issueMemberLink(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const memberId = String(formData.get("memberId"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("issue_member_link", { target: memberId });
  if (error) return { error: dbErrorMessage(error.code) };

  revalidatePath(adminMemberPath(memberId));
  return {};
}
