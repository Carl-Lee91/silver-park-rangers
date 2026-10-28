"use server";

import { redirect } from "next/navigation";
import { fetchLinkMember } from "@/entities/member/server";
import { signInAsMember } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { isUuid } from "@/shared/lib";
import type { ActionState } from "@/shared/ui";

const INVALID = "링크가 맞지 않거나 더 쓰지 않는 링크예요. 관리자에게 새 링크를 받아 주세요.";

/**
 * 개인 링크로 들어간다(PLAN.md §4). 링크가 맞는지 DB 에 다시 묻고(`link_member`), 서버 전용 키로 그 사람의
 * 세션을 연다. 다른 사람으로 들어와 있었으면 바뀐다. 들어가면 홈(다음 매치 투표)으로 간다.
 */
export async function enterWithLink(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!isUuid(token)) return { error: INVALID };

  const owner = await fetchLinkMember(token);
  if (owner === null) return { error: INVALID };

  const result = await signInAsMember(owner.id);
  if (!result.ok) {
    if (result.reason === "no-key") return { error: "서버에 SUPABASE_SERVICE_ROLE_KEY 가 없어서 들어갈 수 없어요. 관리자에게 알려 주세요." };
    console.error("개인 링크 로그인 실패", result.detail);
    return { error: "들어가지 못했어요. 잠시 뒤 다시 눌러 주세요." };
  }
  redirect(ROUTES.home);
}
