"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { adminMemberPath, ROUTES } from "@/shared/config";
import { readProfileForm, toProfileUpdate, toRegisterRpcArgs, validateProfile, validateRegister, type RegisterState } from "../model/registerSchema";

const JERSEY_TAKEN = "이미 누가 쓰는 등번호예요. 다른 번호를 골라 주세요.";

/**
 * 선수 등록(PLAN.md §4 관리자 등록). 계정 없이 바로 승인된 멤버가 된다. 멤버 행과 구분을 한 번에 넣어야 해서
 * DB 함수로만 쓴다. 권한 검사도 DB 함수가 한다(관리자 이상).
 */
export async function registerMember(_previous: RegisterState, formData: FormData): Promise<RegisterState> {
  const result = validateRegister(readProfileForm(formData));
  if (!result.ok) return { errors: result.errors };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("register_member", toRegisterRpcArgs(result.value));
  if (error) return { message: error.code === "23505" ? JERSEY_TAKEN : dbErrorMessage(error.code) };

  revalidatePath(ROUTES.admin, "layout");
  return { saved: true, memberId: String(data) };
}

/**
 * 관리자가 선수의 프로필을 고친다(실명 포함). 계정이 없거나 링크로만 들어오는 사람은 스스로 고치기 어렵다.
 * 권한은 RLS(관리자 이상) · 트리거(실명은 관리자만)가 본다.
 */
export async function updateMemberProfile(_previous: RegisterState, formData: FormData): Promise<RegisterState> {
  const result = validateProfile(readProfileForm(formData));
  if (!result.ok) return { errors: result.errors };

  const memberId = String(formData.get("memberId"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("members").update(toProfileUpdate(result.value)).eq("id", memberId).select("id");
  if (error) return { message: error.code === "23505" ? JERSEY_TAKEN : dbErrorMessage(error.code) };
  // RLS 에 걸린 UPDATE 는 오류 없이 0행이다.
  if (data.length === 0) return { message: dbErrorMessage("42501") };

  revalidatePath(adminMemberPath(memberId));
  revalidatePath(ROUTES.adminMembers);
  return { saved: true };
}
