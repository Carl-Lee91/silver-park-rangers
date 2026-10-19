"use server";

import { redirect } from "next/navigation";
import { createMyMember } from "@/entities/member/server";
import { ROUTES } from "@/shared/config";
import { readOnboardingForm, validateOnboarding, type OnboardingState } from "../model/onboardingSchema";

/** 가입 신청. 멤버 행을 "승인 대기"로 만들고 대기 화면으로 보낸다. */
export async function completeOnboarding(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const result = validateOnboarding(readOnboardingForm(formData));
  if (!result.ok) return { errors: result.errors };

  const created = await createMyMember(result.value);
  if (!created) return { message: "가입 신청을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요." };

  redirect(ROUTES.pending);
}
