import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fieldClass } from "./field";

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

describe("입력칸 공통 모양", () => {
  it("글자는 16px 이다 — 그보다 작으면 아이폰(카톡 포함)이 누를 때 화면을 확대한다", () => {
    expect(fieldClass()).toContain("text-base");
    expect(fieldClass("md")).toContain("text-base");
  });

  it("손가락으로 누르기 좋은 높이(44px 이상)다", () => {
    expect(fieldClass()).toContain("h-12");
    expect(fieldClass("md")).toContain("h-11");
  });

  it("채운 바탕과 잘 보이는 테두리를 쓰고, 누르면 강조색 테두리가 된다", () => {
    expect(fieldClass()).toEqual(expect.stringContaining("bg-field"));
    expect(fieldClass()).toEqual(expect.stringContaining("border-field-border"));
    expect(fieldClass()).toEqual(expect.stringContaining("focus:border-primary"));
  });

  it("더 붙일 모양을 뒤에 잇는다", () => {
    expect(fieldClass("lg", "mt-2")).toMatch(/ mt-2$/);
  });

  it("테두리는 바탕·안쪽 패널과 3:1 이상 차이 난다(웹 접근성: 입력칸 경계)", () => {
    expect(contrast(token("color-field-border"), token("color-bg-base"))).toBeGreaterThanOrEqual(3);
    expect(contrast(token("color-field-border"), token("color-bg-subtle"))).toBeGreaterThanOrEqual(3);
    expect(contrast(token("color-field-border"), token("color-field"))).toBeGreaterThanOrEqual(3);
  });
});
