import { describe, expect, it } from "vitest";
import { toLinkMember } from "./linkMember";

describe("개인 링크의 주인 (PLAN.md §4)", () => {
  it("링크 화면에 보일 이름 · 등번호를 읽는다", () => {
    expect(toLinkMember({ id: "m1", real_name: "홍길동", jersey_number: 7 })).toEqual({
      id: "m1",
      realName: "홍길동",
      jerseyNumber: 7,
    });
  });

  it("맞는 링크가 없으면(지웠거나 휴면) null 이다", () => {
    expect(toLinkMember(null)).toBeNull();
  });
});
