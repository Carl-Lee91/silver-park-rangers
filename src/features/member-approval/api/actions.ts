"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import type { ActionState } from "@/shared/ui";

/**
 * 가입 승인·거절. 권한 검사는 DB 의 RPC 가 한다(관리자 이상). 여기서는 부르고 결과만 옮긴다.
 * 승인할 때 멤버/용병을 같이 정한다 — 둘 중 하나만 되면 안 돼서 RPC 하나로 한다.
 */
export async function approveMember(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("approve_member", {
    target: String(formData.get("memberId")),
    kind: formData.get("kind") === "guest" ? "guest" : "member",
  });
  if (error) return { error: dbErrorMessage(error.code) };

  revalidatePath(ROUTES.admin, "layout");
  return {};
}

export async function rejectMember(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("reject_member", { target: String(formData.get("memberId")) });
  if (error) return { error: dbErrorMessage(error.code) };

  revalidatePath(ROUTES.admin, "layout");
  return {};
}
