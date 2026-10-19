import { describe, expect, it } from "vitest";
import { toMatchNotes } from "./matchNote";

describe("특이사항 읽기", () => {
  it("멤버 id → 메모로 묶는다", () => {
    expect(
      toMatchNotes([
        { member_id: "a", note: "무릎 안 좋음" },
        { member_id: "b", note: "2쿼터부터" },
      ]),
    ).toEqual({ a: "무릎 안 좋음", b: "2쿼터부터" });
  });
});
