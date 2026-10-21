"use server";

import { redirect } from "next/navigation";
import { signInWithPassword } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import {
  passwordLoginErrorMessage,
  readPasswordLogin,
  type PasswordLoginState,
} from "../lib/passwordLogin";

/** 로그인. 성공하면 홈으로 보낸다 — 갈 곳(대기 화면, 관리 화면 등)은 게이트가 정한다. */
export async function passwordLogin(
  _previous: PasswordLoginState,
  formData: FormData,
): Promise<PasswordLoginState> {
  const input = readPasswordLogin(formData);
  if (!input.ok) return { error: input.error };

  const result = await signInWithPassword(input.value.email, input.value.password);
  if (!result.ok) return { error: passwordLoginErrorMessage(result.code) };

  redirect(ROUTES.home);
}
