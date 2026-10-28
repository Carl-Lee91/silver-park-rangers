import { describe, expect, it } from "vitest";
import { readEntryForm, readSettingsForm, validateEntry, validateSettings } from "./entrySchema";

const form = (entries: Record<string, string>) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.set(key, value);
  return formData;
};

describe("장부 직접 적기 (PLAN.md §10 회비 · 벌금 장부)", () => {
  it("날짜 · 항목 · 금액 · 메모를 읽는다 — 금액의 쉼표는 지운다", () => {
    expect(validateEntry(readEntryForm(form({ date: "2026-10-26", category: "field", amount: "120,000", memo: " 10월 구장 " })))).toEqual({
      ok: true,
      value: { date: "2026-10-26", category: "field", amount: 120000, memo: "10월 구장" },
    });
  });

  it("메모는 비워도 된다", () => {
    const result = validateEntry(readEntryForm(form({ date: "2026-10-26", category: "gear", amount: "30000", memo: "" })));
    expect(result.ok && result.value.memo).toBeNull();
  });

  it("월회비 · 경기비 · 벌금은 여기서 적지 않는다 — 체크표에서 받음을 누른다", () => {
    expect(validateEntry(readEntryForm(form({ date: "2026-10-26", category: "dues", amount: "20000" })))).toEqual({
      ok: false,
      error: "항목을 골라 주세요.",
    });
  });

  it("금액은 1원 이상 천만 원 이하의 정수다", () => {
    for (const amount of ["0", "-5000", "12.5", "", "10000001", "abc"]) {
      expect(validateEntry(readEntryForm(form({ date: "2026-10-26", category: "field", amount }))).ok).toBe(false);
    }
  });

  it("날짜가 없으면 막는다", () => {
    expect(validateEntry(readEntryForm(form({ date: "", category: "field", amount: "1000" }))).ok).toBe(false);
  });
});

describe("금액 설정", () => {
  it("월회비 · 경기비 · 노쇼 벌금 — 0 은 받지 않는다는 뜻이다", () => {
    expect(validateSettings(readSettingsForm(form({ monthlyFee: "20,000", matchFee: "10000", noShowFine: "0" })))).toEqual({
      ok: true,
      value: { monthlyFee: 20000, matchFee: 10000, noShowFine: 0 },
    });
  });

  it("음수 · 백만 원 넘는 값은 막는다", () => {
    expect(validateSettings(readSettingsForm(form({ monthlyFee: "-1", matchFee: "0", noShowFine: "0" }))).ok).toBe(false);
    expect(validateSettings(readSettingsForm(form({ monthlyFee: "1000001", matchFee: "0", noShowFine: "0" }))).ok).toBe(false);
  });
});
