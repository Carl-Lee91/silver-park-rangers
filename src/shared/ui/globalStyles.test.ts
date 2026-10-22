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
});
