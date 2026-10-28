import { z } from "zod";
import type { AttendanceResponse } from "@/entities/attendance";

/**
 * 회비 · 벌금 장부(PLAN.md §10). 받은 돈과 쓴 돈만 저장하고, 받을 사람(이번 달 회비를 낼 멤버 · 용병 참석자 · 노쇼)은
 * 여기서 계산한다.
 *
 * 🔴 경기비는 용병이 내지만 화면 이름은 "경기비"다 — 멤버/용병 구분은 관리자 전용이다(PLAN.md §3).
 * 수입 · 지출 구분은 DB 의 `is_income()` 과 같다.
 */
export const CATEGORIES = [
  { code: "dues", label: "월회비", income: true },
  { code: "match_fee", label: "경기비", income: true },
  { code: "fine", label: "벌금", income: true },
  { code: "other_income", label: "기타 수입", income: true },
  { code: "field", label: "구장비", income: false },
  { code: "gear", label: "용품", income: false },
  { code: "other_expense", label: "기타 지출", income: false },
] as const;

export type LedgerCategory = (typeof CATEGORIES)[number]["code"];

/** 받음으로만 남기는 항목(체크표). 나머지는 장부에 직접 적는다 */
export type PaymentCategory = Extract<LedgerCategory, "dues" | "match_fee" | "fine">;

const CATEGORY_CODES = CATEGORIES.map(({ code }) => code) as [LedgerCategory, ...LedgerCategory[]];

export const categoryLabel = (code: LedgerCategory) => CATEGORIES.find((category) => category.code === code)!.label;
export const isIncome = (code: LedgerCategory) => CATEGORIES.find((category) => category.code === code)!.income;

export type LedgerEntry = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  category: LedgerCategory;
  amount: number;
  /** 낸 사람. 지워졌으면 null(이름은 payerName 에 남는다) */
  memberId: string | null;
  matchId: string | null;
  /** 월회비가 어느 달 몫인지(YYYY-MM) */
  duesMonth: string | null;
  payerName: string | null;
  memo: string | null;
};

export const LEDGER_COLUMNS = "id, entry_date, category, amount, member_id, match_id, dues_month, payer_name, memo";

const rowSchema = z.object({
  id: z.string(),
  entry_date: z.string(),
  category: z.enum(CATEGORY_CODES),
  amount: z.number().int(),
  member_id: z.string().nullable(),
  match_id: z.string().nullable(),
  dues_month: z.string().nullable(),
  payer_name: z.string().nullable(),
  memo: z.string().nullable(),
});

export const toLedgerEntry = (row: unknown): LedgerEntry => {
  const parsed = rowSchema.parse(row);
  return {
    id: parsed.id,
    date: parsed.entry_date,
    category: parsed.category,
    amount: parsed.amount,
    memberId: parsed.member_id,
    matchId: parsed.match_id,
    duesMonth: parsed.dues_month?.slice(0, 7) ?? null,
    payerName: parsed.payer_name,
    memo: parsed.memo,
  };
};

export type LedgerTotals = { income: number; expense: number; balance: number };

export const ledgerTotals = (entries: readonly LedgerEntry[]): LedgerTotals => {
  const income = entries.filter((entry) => isIncome(entry.category)).reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries.filter((entry) => !isIncome(entry.category)).reduce((sum, entry) => sum + entry.amount, 0);
  return { income, expense, balance: income - expense };
};

const won = new Intl.NumberFormat("ko-KR");

/** "160,000원" */
export const formatWon = (amount: number) => `${won.format(amount)}원`;

/** 이번 달(YYYY-MM)부터 거꾸로 `count` 개. 회비 체크표의 달 탭 */
export const monthOptions = (today: string, count: number): string[] => {
  const [year, month] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, back) => {
    const index = year * 12 + (month - 1) - back;
    return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
  });
};

/** "10월", 올해가 아니면 "2025년 12월" */
export const monthLabel = (month: string, today: string) => {
  const [year, number] = month.split("-");
  return year === today.slice(0, 4) ? `${Number(number)}월` : `${year}년 ${Number(number)}월`;
};

type Person = { id: string; realName: string; jerseyNumber: number | null };

const byName = (a: { member: Person }, b: { member: Person }) => a.member.realName.localeCompare(b.member.realName, "ko");

/** 월회비 체크표의 한 줄. 그 달에 냈으면 그 장부 줄 */
export type DuesRow<P extends Person = Person> = { member: P; paid: LedgerEntry | null };

/** 그 달(YYYY-MM) 월회비 체크표. 안 낸 사람이 위, 그다음 이름순이다 */
export const duesChecklist = <P extends Person>(members: readonly P[], entries: readonly LedgerEntry[], month: string): DuesRow<P>[] => {
  const paidBy = new Map(
    entries.filter((entry) => entry.category === "dues" && entry.duesMonth === month && entry.memberId).map((entry) => [entry.memberId, entry]),
  );
  const rows = members.map((member) => ({ member, paid: paidBy.get(member.id) ?? null }));
  return [...rows.filter((row) => row.paid === null).sort(byName), ...rows.filter((row) => row.paid !== null).sort(byName)];
};

/** 단톡방에 붙일 미납 독촉 문구 */
export const duesReminderText = ({ month, names, fee }: { month: string; names: readonly string[]; fee: number }) =>
  [`[Silver Park Rangers] ${month} 회비 ${formatWon(fee)} 부탁드려요.`, `아직 안 낸 분(${names.length}명): ${names.join(" · ")}`].join("\n");

/** 지난 매치의 참석 한 줄(경기비 · 벌금 계산에 쓴다) */
export type SettlementRow = {
  matchId: string;
  memberId: string;
  realName: string;
  jerseyNumber: number | null;
  response: AttendanceResponse | null;
  /** 관리자가 정한 실제 출석. 안 정했으면 null */
  attended: boolean | null;
};

export type MatchDueRow = { matchId: string; category: "match_fee" | "fine"; member: Person; paid: LedgerEntry | null };

/**
 * 지난 매치에서 받을 경기비 · 벌금(PLAN.md §10).
 * - 경기비: 용병(그날 용병 포함) 중 온 사람. 출석을 안 정했으면 참석 투표한 사람을 온 것으로 본다.
 * - 벌금: 참석으로 투표하고 안 온 사람(출석 확정에서 불참) — 노쇼.
 * 매치마다 경기비 먼저, 그 안에서 이름순이다.
 */
export const matchChecklist = (
  rows: readonly SettlementRow[],
  guestIds: ReadonlySet<string>,
  entries: readonly LedgerEntry[],
): MatchDueRow[] => {
  const paidOf = (category: "match_fee" | "fine", matchId: string, memberId: string) =>
    entries.find((entry) => entry.category === category && entry.matchId === matchId && entry.memberId === memberId) ?? null;
  const person = (row: SettlementRow): Person => ({ id: row.memberId, realName: row.realName, jerseyNumber: row.jerseyNumber });

  const fees = rows
    .filter((row) => guestIds.has(row.memberId) && (row.attended === true || (row.attended === null && row.response === "yes")))
    .map((row) => ({ matchId: row.matchId, category: "match_fee" as const, member: person(row), paid: paidOf("match_fee", row.matchId, row.memberId) }));
  const fines = rows
    .filter((row) => row.response === "yes" && row.attended === false)
    .map((row) => ({ matchId: row.matchId, category: "fine" as const, member: person(row), paid: paidOf("fine", row.matchId, row.memberId) }));
  return [...fees.sort(byName), ...fines.sort(byName)];
};
