"use server";

import { revalidatePath } from "next/cache";
import { fetchFormations } from "@/entities/formation/server";
import { createSupabaseServerClient, dbErrorMessage, getAuthUserId } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import type { ActionState } from "@/shared/ui";
import { readFormationForm, validateFormationDraft, type FormationDraftState } from "../model/formationDraft";

/** 권한 검사는 RLS 가 한다(관리자 이상, 기본 포메이션은 못 만들고 못 지운다). */
export async function createFormation(
  _previous: FormationDraftState,
  formData: FormData,
): Promise<FormationDraftState> {
  const existing = (await fetchFormations()).map((formation) => formation.name);
  const result = validateFormationDraft(readFormationForm(formData), existing);
  if (!result.ok) return { errors: result.errors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("formations")
    .insert({ name: result.value.name, slots: result.value.slots, created_by: await getAuthUserId() });
  if (error?.code === "23505") return { errors: { name: "같은 이름의 포메이션이 있어요." } };
  if (error) return { message: dbErrorMessage(error.code) };

  revalidatePath(ROUTES.admin, "layout");
  return {};
}

/** 지워도 이미 짠 스쿼드는 그대로다 — 쿼터마다 좌표를 복사해 두기 때문이다. */
export async function deleteFormation(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("formations").delete().eq("id", String(formData.get("formationId")));
  if (error) return { error: dbErrorMessage(error.code) };

  revalidatePath(ROUTES.admin, "layout");
  return {};
}
