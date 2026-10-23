import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PALETTE } from "./palette";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** globals.css 의 @theme 토큰 값. 다른 토큰을 가리키면(var(--…)) 그 값을 따라간다 */
const token = (name: string): string | undefined => {
  const value = css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
  const reference = value?.match(/^var\(--([\w-]+)\)$/)?.[1];
  return reference ? token(reference) : value;
};

/** 상대 밝기(WCAG). #rrggbb 만 받는다 */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

describe("서버 이미지 색", () => {
  it("globals.css 토큰과 같은 값을 쓴다 — 토큰을 바꾸고 여기를 빠뜨리면 이미지만 다른 색이 된다", () => {
    // 이미지 색 이름 → 토큰 이름. pitchLine 은 rgb() 라 이름이 아니라 값으로 비교한다
    const TOKEN_OF: Record<Exclude<keyof typeof PALETTE, "pitchLine">, string> = {
      primary: "color-primary",
      primarySoft: "color-primary-soft",
      bgBase: "color-bg-base",
      bgPanel: "color-bg-panel",
      bgRow: "color-bg-row",
      bgSubtle: "color-bg-subtle",
      textPrimary: "color-text-primary",
      textSecondary: "color-text-secondary",
      textTertiary: "color-text-tertiary",
      border: "color-border",
      borderStrong: "color-border-strong",
      pitch: "color-pitch",
      pitchStripe: "color-pitch-stripe",
      keeper: "color-kakao",
      keeperLabel: "color-kakao-label",
      kit: "color-kit",
      kitLabel: "color-kit-label",
    };
    for (const [key, name] of Object.entries(TOKEN_OF)) {
      expect(PALETTE[key as keyof typeof TOKEN_OF], key).toBe(token(name));
    }
    expect(PALETTE.pitchLine.replace(/\s/g, "")).toBe("rgba(255,255,255,0.55)");
    expect(token("color-pitch-line")).toBe("rgb(255 255 255 / 0.55)");
  });

  it("앱과 이미지는 다크 모드다 — 바탕이 글자보다 어둡고, 글자는 바탕 위에서 충분히 읽힌다", () => {
    const [background, text] = [luminance(PALETTE.bgBase), luminance(PALETTE.textPrimary)];
    expect(background).toBeLessThan(text);
    expect((text + 0.05) / (background + 0.05)).toBeGreaterThan(7);
  });
});
