"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import type { ActionState } from "@/shared/ui";
import { readEntryForm, readSettingsForm, validateEntry, validateSettings } from "../model/entrySchema";

/**
 * 회비 · 벌금 장부(PLAN.md §10). 관리자만 쓴다 — 권한은 RLS · DB 함수가 다시 본다.
 * 팀원 화면(내 정보)의 잔액 · 지출도 같이 새로 그린다.
 */
const refresh = () => {
  revalidatePath(ROUTES.adminDues);
  revalidatePath(ROUTES.me);
};

const PAYMENTS = ["dues", "match_fee", "fine"] as const;

/** 받음: 월회비(달) · 경기비 · 벌금(매치). 금액은 설정에서 DB 가 넣는다 */
export async function recordPayment(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const kind = PAYMENTS.find((code) => code === formData.get("kind"));
  if (kind === undefined) return { error: dbErrorMessage(undefined) };
  const month = String(formData.get("month") ?? "");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("record_payment", {
    kind,
    target_member: String(formData.get("memberId")),
    target_match: kind === "dues" ? null : String(formData.get("matchId")),
    target_month: kind === "dues" ? `${month}-01` : null,
  });
  if (error) return { error: error.code === "23505" ? "이미 받았어요. 새로고침해 주세요." : dbErrorMessage(error.code) };

  refresh();
  return {};
}

/** 장부 한 줄 지우기(받음 취소도 이것이다) */
export async function deleteEntry(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("ledger_entries").delete().eq("id", String(formData.get("entryId"))).select("id");
  if (error) return { error: dbErrorMessage(error.code) };
  if (data.length === 0) return { error: dbErrorMessage("P0002") };

  refresh();
  return {};
}

/** 장부에 직접 적기(구장비 · 용품 · 기타) */
export async function addEntry(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const result = validateEntry(readEntryForm(formData));
  if (!result.ok) return { error: result.error };
  const { date, category, amount, memo } = result.value;

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getClaims();
  const { error } = await supabase
    .from("ledger_entries")
    .insert({ entry_date: date, category, amount, memo, created_by: auth?.claims?.sub ?? null });
  if (error) return { error: dbErrorMessage(error.code) };

  refresh();
  return {};
}

export async function saveDuesSettings(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const result = validateSettings(readSettingsForm(formData));
  if (!result.ok) return { error: result.error };
  const { monthlyFee, matchFee, noShowFine } = result.value;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dues_settings")
    .update({ monthly_fee: monthlyFee, match_fee: matchFee, no_show_fine: noShowFine, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("id");
  if (error) return { error: dbErrorMessage(error.code) };
  if (data.length === 0) return { error: dbErrorMessage("42501") };

  refresh();
  return {};
}
