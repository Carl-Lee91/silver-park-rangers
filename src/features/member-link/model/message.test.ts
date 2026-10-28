import { describe, expect, it } from "vitest";
import { memberLinkMessage } from "./message";

describe("개인 링크 안내 문구 (PLAN.md §4)", () => {
  it("누구 링크인지, 누르면 무엇이 되는지, 남에게 보내지 말 것을 링크와 함께 적는다", () => {
    const text = memberLinkMessage("홍길동", "https://spr.example/j/6f1c");
    expect(text.split("\n")).toEqual([
      "[Silver Park Rangers] 홍길동님 전용 링크예요.",
      "누르면 가입 없이 바로 들어가서 참석 투표를 할 수 있어요. 한 번 들어가면 다음부터 단톡방 링크도 바로 열려요.",
      "다른 사람에게는 보내지 말아 주세요.",
      "https://spr.example/j/6f1c",
    ]);
  });
});
