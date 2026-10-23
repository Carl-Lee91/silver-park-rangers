import { describe, expect, it } from "vitest";
import { chipClass, tabClass } from "./tabs";

describe("하위 탭 모양 (PLAN.md §7 테마)", () => {
  it("누르기 좋은 44px 높이다", () => {
    expect(tabClass()).toContain("h-11");
  });

  it("고른 탭(aria-selected · aria-current)은 굵은 글자와 하늘색 밑줄이다", () => {
    expect(tabClass()).toEqual(expect.stringContaining("aria-selected:border-primary"));
    expect(tabClass()).toEqual(expect.stringContaining("aria-[current=page]:border-primary"));
    expect(tabClass()).toEqual(expect.stringContaining("aria-selected:font-bold"));
  });

  it("더 붙일 모양을 뒤에 잇는다", () => {
    expect(tabClass("px-4")).toMatch(/ px-4$/);
  });
});

describe("칩 모양", () => {
  it("작은 칸에 굵은 작은 글자, 각진 칩 모서리다", () => {
    expect(chipClass("accent")).toEqual(expect.stringContaining("rounded-chip"));
    expect(chipClass("accent")).toEqual(expect.stringContaining("text-xs"));
  });

  it("뜻마다 색이 다르다: 강조 · 주의 · 흐림 · 위험(테두리) · 좋음", () => {
    expect(chipClass("accent")).toContain("text-primary");
    expect(chipClass("warn")).toContain("text-fit-fair");
    expect(chipClass("muted")).toContain("text-text-secondary");
    expect(chipClass("danger")).toContain("border-danger");
    expect(chipClass("good")).toContain("text-result-win");
  });
});
