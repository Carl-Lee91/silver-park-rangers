"use server";

import { redirect } from "next/navigation";
import { createMyMember } from "@/entities/member/server";
import { ROUTES } from "@/shared/config";
import { readOnboardingForm, validateOnboarding, type OnboardingState } from "../model/onboardingSchema";

/** 신청 정보가 빠진 계정의 가입 신청. 멤버 행을 "승인 대기"로 만들고 대기 화면으로 보낸다. */
export async function completeOnboarding(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const result = validateOnboarding(readOnboardingForm(formData));
  if (!result.ok) return { errors: result.errors };

  const created = await createMyMember(result.value);
  if (!created.ok && created.reason === "jersey-taken") {
    return { errors: { jerseyNumber: "이미 다른 사람이 쓰는 번호예요." } };
  }
  if (!created.ok) return { message: "가입 신청을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요." };

  redirect(ROUTES.pending);
}
