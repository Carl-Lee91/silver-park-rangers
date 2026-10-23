import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const token = (name: string): string => {
  const value = css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim() ?? "";
  const reference = value.match(/^var\(--([\w-]+)\)$/)?.[1];
  return reference ? token(reference) : value;
};
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};
const color = (name: string) => token(`color-${name}`);

/** src 아래 화면 코드(테스트 제외) */
const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
  });
const root = join(process.cwd(), "src");
const files = sources(root).map((path) => ({ path: relative(root, path), text: readFileSync(path, "utf8") }));

describe("테마 토큰 (PLAN.md §7 테마)", () => {
  it("바탕은 앱 바탕 < 패널 < 표 줄무늬 < 패널 머리 순으로 밝아진다 — 패널이 바탕 위에 떠 보이게", () => {
    const steps = ["bg-base", "bg-panel", "bg-row", "bg-subtle"].map((name) => luminance(color(name)));
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(new Set(steps).size).toBe(4);
  });

  it("가장 흐린 글자도 패널 머리 위에서 4.5:1 이상 읽힌다", () => {
    for (const background of ["bg-base", "bg-panel", "bg-row", "bg-subtle"]) {
      expect(contrast(color("text-tertiary"), color(background)), background).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("머리띠(유니폼 하늘색) 위 남색 글자는 4.5:1 이상 읽힌다", () => {
    expect(contrast(color("kit-label"), color("kit"))).toBeGreaterThanOrEqual(4.5);
  });

  it("경기 결과 칸: 승·패는 어두운 글자, 무는 밝은 글자로 4.5:1 이상 읽힌다", () => {
    expect(contrast(color("bg-base"), color("result-win"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color("bg-base"), color("result-loss"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color("text-primary"), color("result-draw"))).toBeGreaterThanOrEqual(4.5);
  });

  it("잔디 줄무늬는 경기장 색과 다르다", () => {
    expect(color("pitch-stripe")).toMatch(/^#[0-9a-f]{6}$/);
    expect(color("pitch-stripe")).not.toBe(color("pitch"));
  });

  it("모서리는 두 가지다: 상자(패널·단추·입력칸) 6px, 칩 4px", () => {
    expect(token("radius-box")).toBe("0.375rem");
    expect(token("radius-chip")).toBe("0.25rem");
  });
});

describe("모서리 규칙", () => {
  it("화면 코드는 rounded-box · rounded-chip · rounded-full 만 쓴다 — 크기를 직접 고르면 다시 둥글어진다", () => {
    const allowed = /^rounded(-[trbl]{1,2}|-[se]{1,2})?-(box|chip|full|none)$/;
    const offenders = files.flatMap(({ path, text }) =>
      (text.match(/\brounded(?:-[\w[\].]+)*/g) ?? []).filter((name) => !allowed.test(name)).map((name) => `${path}: ${name}`),
    );
    expect(offenders).toEqual([]);
  });
});
