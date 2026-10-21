"use server";

import { updateMyPassword } from "@/shared/api";
import { passwordChangeFailure, validatePasswordChange, type PasswordChangeState } from "../model/passwordChange";

/**
 * 내 비밀번호를 바꾼다. 관리자가 만들어 준 임시 비밀번호로 들어온 사람이 여기서 바꾼다(PLAN.md §4).
 */
export async function changePassword(_previous: PasswordChangeState, formData: FormData): Promise<PasswordChangeState> {
  const result = validatePasswordChange({
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  });
  if (!result.ok) return { errors: result.errors };

  const outcome = await updateMyPassword(result.value);
  if (!outcome.ok) return passwordChangeFailure(outcome.code);
  return { saved: true };
}
