"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, dbErrorMessage } from "@/shared/api";
import { adminMatchPath } from "@/shared/config";
import type { ActionState } from "@/shared/ui";

/**
 * 실제 출석 기록. 권한은 RLS 와 트리거가 본다 — 출석(attended)은 관리자 이상만 쓴다.
 * 투표가 없던 사람은 행이 새로 생긴다(응답은 비어 있다).
 */
const upsert = async (matchId: string, rows: { memberId: string; attended: boolean | null }[]): Promise<ActionState> => {
  if (rows.length === 0) return {};
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("match_attendance").upsert(
    rows.map((row) => ({ match_id: matchId, member_id: row.memberId, attended: row.attended })),
    { onConflict: "match_id,member_id" },
  );
  if (error) return { error: dbErrorMessage(error.code) };
  revalidatePath(adminMatchPath(matchId));
  return {};
};

const attendedOf = (value: FormDataEntryValue | null) => (value === "true" ? true : value === "false" ? false : null);

/** 한 사람의 출석을 정한다(출석 · 불참 · 미확정) */
export async function setAttended(_previous: ActionState, formData: FormData): Promise<ActionState> {
  return upsert(String(formData.get("matchId")), [
    { memberId: String(formData.get("memberId")), attended: attendedOf(formData.get("attended")) },
  ]);
}

/** 스쿼드대로 한 번에 확정한다. 화면이 계산한 목록(JSON)을 받는다. */
export async function confirmFromSquad(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let rows: { memberId: string; attended: boolean }[];
  try {
    const parsed: unknown = JSON.parse(String(formData.get("rows")));
    if (!Array.isArray(parsed)) throw new Error("not an array");
    rows = parsed.map((row) => ({ memberId: String(row.memberId), attended: row.attended === true }));
  } catch {
    return { error: "확정할 명단이 올바르지 않아요. 새로고침해 주세요." };
  }
  return upsert(String(formData.get("matchId")), rows);
}
