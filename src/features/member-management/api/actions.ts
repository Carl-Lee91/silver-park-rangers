"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import type { ActionState } from "@/shared/ui";

/**
 * 승인된 멤버 관리. 권한 검사는 DB 의 RPC 가 한다.
 *   set_member_type   — 멤버 ↔ 용병 (관리자 이상)
 *   set_member_status — 휴면 ↔ 복귀 (관리자 이상, 다른 관리자는 어드민만)
 *   set_member_role   — 관리자 지정·해제 (어드민만)
 */
const call = async (fn: string, args: Record<string, string>): Promise<ActionState> => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: dbErrorMessage(error.code) };

  revalidatePath(ROUTES.admin, "layout");
  return {};
};

export async function setMemberType(_previous: ActionState, formData: FormData): Promise<ActionState> {
  return call("set_member_type", {
    target: String(formData.get("memberId")),
    kind: formData.get("kind") === "guest" ? "guest" : "member",
  });
}

export async function setMemberStatus(_previous: ActionState, formData: FormData): Promise<ActionState> {
  return call("set_member_status", {
    target: String(formData.get("memberId")),
    next: formData.get("next") === "inactive" ? "inactive" : "approved",
  });
}

export async function setMemberRole(_previous: ActionState, formData: FormData): Promise<ActionState> {
  return call("set_member_role", {
    target: String(formData.get("memberId")),
    next: formData.get("next") === "admin" ? "admin" : "user",
  });
}

export type TemporaryPasswordState = { error?: string; password?: string };

/**
 * 비밀번호를 잊은 사람의 임시 비밀번호를 만든다(PLAN.md §4). 메일을 보내지 않으므로 화면에 한 번
 * 보여 주고, 관리자가 본인에게 알려 준다. 관리자의 것은 어드민만 만든다(`reset_member_password`).
 */
export async function resetPassword(_previous: TemporaryPasswordState, formData: FormData): Promise<TemporaryPasswordState> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("reset_member_password", { target: String(formData.get("memberId")) });
  if (error) return { error: dbErrorMessage(error.code) };
  return typeof data === "string" ? { password: data } : { error: dbErrorMessage(undefined) };
}
