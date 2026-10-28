import { describe, expect, it } from "vitest";
import {
  categoryLabel,
  duesChecklist,
  duesReminderText,
  formatWon,
  ledgerTotals,
  matchChecklist,
  monthLabel,
  monthOptions,
  toLedgerEntry,
  type LedgerEntry,
} from "./ledger";

const entry = (overrides: Partial<LedgerEntry>): LedgerEntry => ({
  id: "e",
  date: "2026-10-03",
  category: "dues",
  amount: 20000,
  memberId: null,
  matchId: null,
  duesMonth: null,
  payerName: null,
  memo: null,
  ...overrides,
});

describe("장부 한 줄 (PLAN.md §10 회비 · 벌금 장부)", () => {
  it("DB 행을 읽는다", () => {
    expect(
      toLedgerEntry({
        id: "e1",
        entry_date: "2026-10-03",
        category: "fine",
        amount: 5000,
        member_id: "a",
        match_id: "m1",
        dues_month: null,
        payer_name: "홍길동",
        memo: null,
      }),
    ).toEqual({ id: "e1", date: "2026-10-03", category: "fine", amount: 5000, memberId: "a", matchId: "m1", duesMonth: null, payerName: "홍길동", memo: null });
  });

  it("회비 달은 YYYY-MM 으로 읽는다", () => {
    expect(
      toLedgerEntry({ id: "e1", entry_date: "2026-10-03", category: "dues", amount: 1, member_id: "a", match_id: null, dues_month: "2026-10-01", payer_name: "홍길동", memo: null }).duesMonth,
    ).toBe("2026-10");
  });

  it("항목 이름 — 용병비가 아니라 경기비다(멤버/용병 구분은 관리자 전용)", () => {
    expect(["dues", "match_fee", "fine", "other_income", "field", "gear", "other_expense"].map((code) => categoryLabel(code as LedgerEntry["category"]))).toEqual([
      "월회비",
      "경기비",
      "벌금",
      "기타 수입",
      "구장비",
      "용품",
      "기타 지출",
    ]);
  });
});

describe("합계", () => {
  it("수입 · 지출 · 잔액을 낸다", () => {
    expect(
      ledgerTotals([entry({ amount: 20000 }), entry({ category: "fine", amount: 5000 }), entry({ category: "field", amount: 12000 })]),
    ).toEqual({ income: 25000, expense: 12000, balance: 13000 });
  });

  it("원 단위로 쓴다", () => {
    expect(formatWon(160000)).toBe("160,000원");
    expect(formatWon(-3000)).toBe("-3,000원");
  });
});

describe("회비 달", () => {
  it("이번 달부터 거꾸로 고른 수만큼", () => {
    expect(monthOptions("2026-01-15", 3)).toEqual(["2026-01", "2025-12", "2025-11"]);
  });

  it("10월처럼 짧게 — 올해가 아니면 연도를 붙인다", () => {
    expect(monthLabel("2026-10", "2026-10-28")).toBe("10월");
    expect(monthLabel("2025-12", "2026-01-02")).toBe("2025년 12월");
  });
});

describe("월회비 체크표", () => {
  const members = [
    { id: "a", realName: "홍길동", jerseyNumber: 7 },
    { id: "b", realName: "김철수", jerseyNumber: null },
  ];

  it("그 달에 낸 사람은 낸 줄을, 안 낸 사람은 비워 둔다 — 안 낸 사람이 위, 그다음 이름순", () => {
    const paid = entry({ id: "p1", memberId: "a", duesMonth: "2026-10" });
    expect(duesChecklist(members, [paid, entry({ id: "p2", memberId: "b", duesMonth: "2026-09" })], "2026-10")).toEqual([
      { member: members[1], paid: null },
      { member: members[0], paid },
    ]);
  });

  it("미납 독촉 문구", () => {
    expect(duesReminderText({ month: "10월", names: ["김철수", "박영희"], fee: 20000 }).split("\n")).toEqual([
      "[Silver Park Rangers] 10월 회비 20,000원 부탁드려요.",
      "아직 안 낸 분(2명): 김철수 · 박영희",
    ]);
  });
});

describe("경기비 · 벌금 받을 사람", () => {
  const rows = [
    { matchId: "m1", memberId: "g", realName: "용병", jerseyNumber: null, response: "yes" as const, attended: true },
    { matchId: "m1", memberId: "a", realName: "홍길동", jerseyNumber: 7, response: "yes" as const, attended: false },
    { matchId: "m1", memberId: "b", realName: "김철수", jerseyNumber: null, response: "yes" as const, attended: true },
    { matchId: "m1", memberId: "h", realName: "미확정용병", jerseyNumber: null, response: "yes" as const, attended: null },
  ];

  it("용병 중 온 사람(출석을 안 정했으면 참석 투표)은 경기비, 참석 투표하고 안 온 사람은 벌금이다 — 경기비 먼저, 이름순", () => {
    const list = matchChecklist(rows, new Set(["g", "h"]), []);
    expect(list.map((row) => [row.category, row.member.realName])).toEqual([
      ["match_fee", "미확정용병"],
      ["match_fee", "용병"],
      ["fine", "홍길동"],
    ]);
  });

  it("이미 받은 것은 그 줄을 붙인다", () => {
    const paid = entry({ id: "f1", category: "fine", memberId: "a", matchId: "m1" });
    const fine = matchChecklist(rows, new Set(), [paid]).find((row) => row.category === "fine");
    expect(fine?.paid).toBe(paid);
  });
});
