"use server";

import { redirect } from "next/navigation";
import { signUpWithPassword } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import {
  readSignUpForm,
  signUpFailure,
  toSignUpMetadata,
  validateSignUp,
  type SignUpState,
} from "../model/signUpSchema";

/**
 * 가입 신청. 계정을 만들면 DB 가 멤버 행을 "승인 대기"로 같이 만든다(PLAN.md §4).
 * 이메일 확인이 꺼져 있으면 바로 로그인된 채로 대기 화면으로 간다.
 */
export async function signUp(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  const result = validateSignUp(readSignUpForm(formData));
  if (!result.ok) return { errors: result.errors };

  const outcome = await signUpWithPassword(result.value.email, result.value.password, toSignUpMetadata(result.value));
  if (!outcome.ok) return signUpFailure(outcome.code);
  if (!outcome.signedIn) {
    // 신청은 들어갔지만 이메일 확인을 기다린다. 기본 메일은 팀원에게 가지 않아 여기서 멈춘다(PLAN.md §2).
    return {
      message:
        "가입 신청은 들어갔지만 바로 로그인되지 않았어요. Supabase 의 이메일 확인이 켜져 있어요 — 관리자에게 알려 주세요.",
    };
  }

  redirect(ROUTES.pending);
}
