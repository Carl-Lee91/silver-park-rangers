import { CATEGORIES, type LedgerCategory } from "@/entities/ledger";

/** 장부에 직접 적는 항목. 월회비 · 경기비 · 벌금은 체크표의 받음으로만 남긴다(받을 사람과 어긋나지 않게) */
export const MANUAL_CATEGORIES = CATEGORIES.filter(({ code }) => !["dues", "match_fee", "fine"].includes(code));

export type EntryInput = { date: string; category: string; amount: string; memo: string };
export type NewEntry = { date: string; category: LedgerCategory; amount: number; memo: string | null };

/** "120,000" → 120000. 정수가 아니면 null */
const parseWon = (value: string): number | null => {
  const digits = value.replaceAll(",", "").trim();
  return /^-?\d+$/.test(digits) ? Number(digits) : null;
};

export const readEntryForm = (formData: FormData): EntryInput => ({
  date: String(formData.get("date") ?? ""),
  category: String(formData.get("category") ?? ""),
  amount: String(formData.get("amount") ?? ""),
  memo: String(formData.get("memo") ?? ""),
});

/** DB 제약(ledger_entries)과 같다: 금액 1원 ~ 천만 원, 메모 100자 */
export const validateEntry = (input: EntryInput): { ok: true; value: NewEntry } | { ok: false; error: string } => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "날짜를 골라 주세요." };
  const category = MANUAL_CATEGORIES.find(({ code }) => code === input.category)?.code;
  if (category === undefined) return { ok: false, error: "항목을 골라 주세요." };
  const amount = parseWon(input.amount);
  if (amount === null || amount < 1 || amount > 10_000_000) return { ok: false, error: "금액은 1원부터 천만 원까지 숫자로 적어 주세요." };
  const memo = input.memo.trim();
  if (memo.length > 100) return { ok: false, error: "메모는 100자까지예요." };
  return { ok: true, value: { date: input.date, category, amount, memo: memo === "" ? null : memo } };
};

export type SettingsInput = { monthlyFee: string; matchFee: string; noShowFine: string };
export type SettingsValue = { monthlyFee: number; matchFee: number; noShowFine: number };

export const readSettingsForm = (formData: FormData): SettingsInput => ({
  monthlyFee: String(formData.get("monthlyFee") ?? ""),
  matchFee: String(formData.get("matchFee") ?? ""),
  noShowFine: String(formData.get("noShowFine") ?? ""),
});

/** 0 은 그 항목을 받지 않는다는 뜻이다. DB 제약과 같다: 0 ~ 백만 원 */
export const validateSettings = (input: SettingsInput): { ok: true; value: SettingsValue } | { ok: false; error: string } => {
  const values = [input.monthlyFee, input.matchFee, input.noShowFine].map(parseWon);
  if (values.some((value) => value === null || value < 0 || value > 1_000_000)) {
    return { ok: false, error: "금액은 0원부터 백만 원까지 숫자로 적어 주세요(0 은 받지 않음)." };
  }
  const [monthlyFee, matchFee, noShowFine] = values as number[];
  return { ok: true, value: { monthlyFee, matchFee, noShowFine } };
};
