import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** 선택자 하나의 선언 블록 */
const block = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  return start === -1 ? "" : css.slice(start, css.indexOf("}", start));
};

describe("전역 스타일 (globals.css)", () => {
  it("한글을 어절 단위로 줄바꿈한다 — 기본값은 '골 / 라요'처럼 낱말 중간에서 끊는다", () => {
    expect(block("body")).toMatch(/word-break:\s*keep-all/);
  });

  it("긴 이메일·주소는 칸을 넘지 않게 끊는다", () => {
    expect(block("body")).toMatch(/overflow-wrap:\s*break-word/);
  });

  it("모바일 기본 회색 번쩍임을 끈다 — 대신 눌림 효과를 준다", () => {
    expect(block("html")).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
  });

  it("누르는 동안 단추·링크·펼치기를 살짝 흐리게 한다(막힌 단추는 빼고)", () => {
    const rule = css.match(/([^{}]*:active[^{}]*)\{([^}]*)\}/);
    expect(rule?.[1]).toMatch(/button/);
    expect(rule?.[1]).toMatch(/\ba\b/);
    expect(rule?.[1]).toMatch(/summary/);
    expect(rule?.[1]).toMatch(/:not\(:disabled\)/);
    expect(rule?.[2]).toMatch(/opacity/);
  });

  it("펼치기(summary)는 기본 ▶ 를 숨기고 오른쪽 꺾쇠를 그리며, 줄 전체를 44px 로 누른다", () => {
    expect(block("summary")).toMatch(/list-style:\s*none/);
    expect(block("summary")).toMatch(/justify-content:\s*space-between/);
    expect(block("summary")).toMatch(/min-height:\s*--spacing\(11\)/);
    expect(css).toMatch(/summary::-webkit-details-marker\s*\{\s*display:\s*none/);
    expect(block("summary::after")).toMatch(/content:/);
  });

  it("펼치면 꺾쇠가 위로 뒤집힌다", () => {
    expect(block("details[open] > summary::after")).toMatch(/rotate\(-135deg\)/);
  });
});

