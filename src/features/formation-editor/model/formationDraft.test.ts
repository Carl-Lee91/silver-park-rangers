import { describe, expect, it } from "vitest";
import { DEFAULT_COUNTS, readFormationForm, validateFormationDraft } from "./formationDraft";

const existing = ["4-3-3", "4-4-2", "3-5-2"];

describe("커스텀 포메이션 입력", () => {
  it("처음 인원수는 4-3-3 이다", () => {
    expect(DEFAULT_COUNTS).toEqual({ FW: 1, AM: 0, WG: 2, MF: 3, WM: 0, DM: 0, WB: 0, CB: 2, FB: 2, GK: 1 });
  });

  it("올바르면 자리까지 잡아서 돌려준다", () => {
    const result = validateFormationDraft({ name: " 4-2-3-1 ", counts: { ...DEFAULT_COUNTS, MF: 2, AM: 1 } }, existing);
    expect(result.ok && result.value.name).toBe("4-2-3-1");
    expect(result.ok && result.value.slots).toHaveLength(11);
  });

  it("이름은 꼭 쓰고 30자까지다", () => {
    expect(validateFormationDraft({ name: " ", counts: DEFAULT_COUNTS }, existing)).toEqual({
      ok: false,
      errors: { name: "이름을 입력해 주세요." },
    });
    expect(validateFormationDraft({ name: "가".repeat(31), counts: DEFAULT_COUNTS }, existing).ok).toBe(false);
  });

  it("이미 있는 이름은 쓸 수 없다", () => {
    expect(validateFormationDraft({ name: "3-5-2", counts: DEFAULT_COUNTS }, existing)).toEqual({
      ok: false,
      errors: { name: "같은 이름의 포메이션이 있어요." },
    });
  });

  it("필드는 1~10명이다 — 키퍼까지 11명을 넘을 수 없다", () => {
    const tooMany = { ...DEFAULT_COUNTS, FW: 2 };
    expect(validateFormationDraft({ name: "x", counts: tooMany }, existing)).toEqual({
      ok: false,
      errors: { counts: "필드는 10명까지예요. 지금 11명이에요." },
    });
    const none = { FW: 0, AM: 0, WG: 0, MF: 0, WM: 0, DM: 0, WB: 0, CB: 0, FB: 0, GK: 1 };
    expect(validateFormationDraft({ name: "x", counts: none }).ok).toBe(false);
  });

  it("폼 데이터를 읽는다 — 키퍼는 항상 1명이다", () => {
    const data = new FormData();
    data.append("name", "3-5-2");
    for (const [position, count] of Object.entries({ CB: 3, DM: 1, WB: 2, MF: 2, FW: 2 })) {
      data.append(position, String(count));
    }
    data.append("GK", "0");
    expect(readFormationForm(data)).toEqual({
      name: "3-5-2",
      counts: { FW: 2, AM: 0, WG: 0, MF: 2, WM: 0, DM: 1, WB: 2, CB: 3, FB: 0, GK: 1 },
    });
  });
});
