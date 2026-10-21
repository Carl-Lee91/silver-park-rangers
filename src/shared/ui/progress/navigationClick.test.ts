import { describe, expect, it } from "vitest";
import { isNavigationClick } from "./navigationClick";

const here = "https://team.example/matches/1?tab=a";
const click = (overrides: Partial<Parameters<typeof isNavigationClick>[0]> = {}) => ({
  button: 0,
  modified: false,
  href: "https://team.example/me",
  target: "",
  download: false,
  ...overrides,
});

describe("화면을 옮기는 클릭인지 (로딩 바를 켤지)", () => {
  it("같은 사이트의 다른 주소로 가는 링크면 켠다", () => {
    expect(isNavigationClick(click(), here)).toBe(true);
    expect(isNavigationClick(click({ href: "https://team.example/matches/1?tab=b" }), here)).toBe(true);
  });

  it("다른 사이트, 새 창, 내려받기는 켜지 않는다", () => {
    expect(isNavigationClick(click({ href: "https://kakao.com" }), here)).toBe(false);
    expect(isNavigationClick(click({ target: "_blank" }), here)).toBe(false);
    expect(isNavigationClick(click({ download: true }), here)).toBe(false);
  });

  it("같은 주소나 # 만 바뀌면 켜지 않는다 — 화면이 바뀌지 않아 바가 멈추지 않는다", () => {
    expect(isNavigationClick(click({ href: here }), here)).toBe(false);
    expect(isNavigationClick(click({ href: `${here}#notes` }), here)).toBe(false);
  });

  it("휠 클릭·Ctrl/⌘ 클릭(새 탭)은 켜지 않는다", () => {
    expect(isNavigationClick(click({ button: 1 }), here)).toBe(false);
    expect(isNavigationClick(click({ modified: true }), here)).toBe(false);
  });

  it("주소가 아니면 켜지 않는다", () => {
    expect(isNavigationClick(click({ href: "" }), here)).toBe(false);
  });
});
