"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { POSITION_CODES } from "@/entities/position";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { adminMatchPath, matchPath, ROUTES } from "@/shared/config";
import type { ActionState } from "@/shared/ui";

// 브라우저가 보낸 값이라 모양을 한 번 더 본다. 권한·쿼터 범위는 save_squad 가 본다.
const payloadSchema = z.array(
  z.object({
    number: z.number().int(),
    formation_name: z.string().min(1),
    slots: z.array(
      z.object({
        slot_index: z.number().int(),
        position: z.enum(POSITION_CODES),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        member_id: z.string().nullable(),
      }),
    ),
  }),
);

const refresh = (matchId: string) => {
  revalidatePath(adminMatchPath(matchId), "layout");
  revalidatePath(matchPath(matchId));
  revalidatePath(ROUTES.home);
};

/** 전 쿼터를 한 번에 저장한다(save_squad — 실패하면 전의 스쿼드가 그대로 남는다). */
export async function saveSquad(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const matchId = String(formData.get("matchId"));
  let quarters: z.infer<typeof payloadSchema>;
  try {
    quarters = payloadSchema.parse(JSON.parse(String(formData.get("quarters"))));
  } catch {
    return { error: "저장할 스쿼드 모양이 올바르지 않아요. 새로고침해 주세요." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_squad", { target: matchId, quarters });
  if (error) return { error: dbErrorMessage(error.code) };

  refresh(matchId);
  return {};
}

/** 공개하면 팀원이 쿼터 보드를 본다. 공개를 거두면 다시 관리자만 본다. */
export async function publishSquad(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const matchId = String(formData.get("matchId"));
  const publish = formData.get("publish") === "1";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("matches")
    .update({ squad_published_at: publish ? new Date().toISOString() : null })
    .eq("id", matchId);
  if (error) return { error: dbErrorMessage(error.code) };

  refresh(matchId);
  return {};
}
