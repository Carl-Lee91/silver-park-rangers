import { describe, expect, it } from "vitest";
import { parsePeriod, periodRange } from "./period";

describe("통계 기간", () => {
  it("최근 4주는 오늘부터 28일 전까지", () => {
    expect(periodRange("recent4w", "2026-10-19")).toEqual({ from: "2026-09-21", to: "2026-10-19" });
  });

  it("올해는 1월 1일부터", () => {
    expect(periodRange("season", "2026-10-19")).toEqual({ from: "2026-01-01", to: "2026-10-19" });
  });

  it("전체는 처음부터", () => {
    expect(periodRange("all", "2026-10-19").from).toBe("2000-01-01");
  });

  it("주소 값이 이상하면 올해로 본다", () => {
    expect(parsePeriod("recent4w")).toBe("recent4w");
    expect(parsePeriod("hack")).toBe("season");
    expect(parsePeriod(undefined)).toBe("season");
  });
});
