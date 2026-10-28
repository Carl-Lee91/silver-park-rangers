import { z } from "zod";
import { createSupabaseServerClient } from "@/shared/api";
import { LEDGER_COLUMNS, toLedgerEntry, type LedgerEntry, type LedgerTotals } from "./model/ledger";
import { SETTINGS_COLUMNS, toDuesSettings, type DuesSettings } from "./model/settings";

/**
 * 장부 줄(최근 것부터). 관리자는 모두, 팀원은 지출과 내 납부만 받는다(RLS) — 다른 사람의 납부는 오지 않는다.
 * `from` 을 주면 그날부터(YYYY-MM-DD), `limit` 를 주면 그만큼만.
 */
export const fetchLedgerEntries = async ({ from, limit }: { from?: string; limit?: number } = {}): Promise<LedgerEntry[]> => {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("ledger_entries")
    .select(LEDGER_COLUMNS)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (from) query = query.gte("entry_date", from);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(`장부를 읽지 못했습니다 — ${error.message}`);
  return (data as unknown[]).map(toLedgerEntry);
};

/** 금액 설정(관리자만 읽는다). 못 읽으면 모두 0(받지 않음)으로 본다 */
export const fetchDuesSettings = async (): Promise<DuesSettings> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("dues_settings").select(SETTINGS_COLUMNS).maybeSingle();
  if (error) throw new Error(`금액 설정을 읽지 못했습니다 — ${error.message}`);
  return data === null ? { monthlyFee: 0, matchFee: 0, noShowFine: 0 } : toDuesSettings(data);
};

const totalsSchema = z.object({ income: z.coerce.number(), expense: z.coerce.number(), balance: z.coerce.number() });

/** 팀 전체 수입 · 지출 · 잔액(장부 공개). 팀원도 부른다 — 다른 사람의 납부 줄은 못 보므로 합계는 DB 가 낸다 */
export const fetchTeamLedgerSummary = async (): Promise<LedgerTotals> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("team_ledger_summary").single();
  if (error) throw new Error(`장부 합계를 읽지 못했습니다 — ${error.message}`);
  return totalsSchema.parse(data);
};
