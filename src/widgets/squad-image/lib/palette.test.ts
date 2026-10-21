import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PALETTE } from "./palette";

/** globals.css 의 @theme 토큰 값(처음 나온 값 — 전술판처럼 안쪽에서 바꾼 값은 보지 않는다) */
const token = (name: string) => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  return css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
};

describe("서버 이미지 색", () => {
  it("globals.css 토큰과 같은 값을 쓴다 — 토큰을 바꾸고 여기를 빠뜨리면 이미지만 다른 색이 된다", () => {
    expect({
      primary: PALETTE.primary,
      bgBase: PALETTE.bgBase,
      textPrimary: PALETTE.textPrimary,
      pitch: PALETTE.pitch,
      keeper: PALETTE.keeper,
      keeperLabel: PALETTE.keeperLabel,
      kit: PALETTE.kit,
      kitLabel: PALETTE.kitLabel,
    }).toEqual({
      primary: token("color-primary"),
      bgBase: token("color-bg-base"),
      textPrimary: token("color-text-primary"),
      pitch: token("color-pitch"),
      keeper: token("color-kakao"),
      keeperLabel: token("color-kakao-label"),
      kit: token("color-kit"),
      kitLabel: token("color-kit-label"),
    });
  });
});
