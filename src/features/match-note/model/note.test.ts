import { describe, expect, it } from "vitest";
import { validateNote } from "./note";

describe("특이사항 입력", () => {
  it("앞뒤 공백을 지운다", () => {
    expect(validateNote("  무릎 안 좋음 ")).toEqual({ ok: true, value: "무릎 안 좋음" });
  });

  it("비우면 지우는 것이다", () => {
    expect(validateNote("   ")).toEqual({ ok: true, value: null });
  });

  it("200자까지다 — DB 제약과 같다", () => {
    expect(validateNote("가".repeat(201))).toEqual({ ok: false, error: "특이사항은 200자까지 쓸 수 있어요." });
  });
});
