import { describe, expect, it } from "vitest";
import { adminSquadImagePath, squadImagePath } from "./imagePath";

describe("스쿼드 이미지 주소", () => {
  it("공유 링크 이미지: 카드는 og, 나머지는 image?view= — 내용 해시(v)를 붙인다", () => {
    expect(squadImagePath("t1", "card", "abc")).toBe("/s/t1/og?v=abc");
    expect(squadImagePath("t1", "rotation", "abc")).toBe("/s/t1/image?view=rotation&v=abc");
  });

  it("관리자 이미지: 공개 전에도 저장한 스쿼드를 그린다 — 관리 화면 아래 주소다", () => {
    expect(adminSquadImagePath("m1", "quarters", "abc")).toBe("/admin/matches/m1/squad/image?view=quarters&v=abc");
  });
});
