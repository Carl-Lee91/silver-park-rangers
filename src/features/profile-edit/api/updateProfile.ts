"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage, getAuthUserId } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { readProfileForm, validateProfile, type ProfileState } from "../model/profileSchema";

/**
 * 내 주발·선호 포지션·등번호를 고친다. 실명·역할·상태는 여기서 못 바꾼다 — DB 트리거가 막는다.
 * 바꾼 선호 포지션은 다음 자동 배치부터 쓴다.
 */
export async function updateProfile(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const result = validateProfile(readProfileForm(formData));
  if (!result.ok) return { errors: result.errors };

  const userId = await getAuthUserId();
  if (userId === null) return { message: "다시 로그인해 주세요." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("members")
    .update({
      feet: result.value.feet,
      preferred_positions: result.value.preferredPositions,
      jersey_number: result.value.jerseyNumber,
    })
    .eq("id", userId);
  // 같은 번호는 한 사람만 쓴다(유니크). 화면이 고를 때 막아도, 그사이 누가 먼저 가져갈 수 있다.
  if (error?.code === "23505") return { errors: { jerseyNumber: "이미 다른 사람이 쓰는 번호예요." } };
  if (error) return { message: dbErrorMessage(error.code) };

  revalidatePath(ROUTES.me);
  return { saved: true };
}
