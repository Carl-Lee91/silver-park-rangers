"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { adminMatchPath, adminTeamsPath, matchPath, ROUTES } from "@/shared/config";
import type { ActionState } from "@/shared/ui";

// 브라우저가 보낸 값이라 모양을 한 번 더 본다. 권한 · 팀 번호 범위는 save_futsal_teams 가 본다.
const membersSchema = z.array(z.object({ member_id: z.string(), team_number: z.number().int().min(1).max(3) }));

/** 풋살 팀을 한 번에 저장한다(save_futsal_teams — 실패하면 전의 팀이 그대로 남는다) */
export async function saveTeams(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const matchId = String(formData.get("matchId"));
  const teamCount = Number(formData.get("teamCount"));
  let members: z.infer<typeof membersSchema>;
  try {
    members = membersSchema.parse(JSON.parse(String(formData.get("members"))));
  } catch {
    return { error: "저장할 팀 모양이 올바르지 않아요. 새로고침해 주세요." };
  }
  if (teamCount !== 2 && teamCount !== 3) return { error: "팀은 2팀이나 3팀으로 나눠요." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_futsal_teams", { target: matchId, teams: teamCount, members });
  if (error) return { error: dbErrorMessage(error.code) };

  revalidatePath(adminTeamsPath(matchId));
  revalidatePath(adminMatchPath(matchId), "layout");
  revalidatePath(matchPath(matchId));
  revalidatePath(ROUTES.home);
  return {};
}
