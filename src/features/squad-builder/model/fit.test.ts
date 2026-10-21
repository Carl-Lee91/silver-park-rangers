import { describe, expect, it } from "vitest";
import { FIT_LABELS, fitOf } from "./fit";

describe("자리 적합도(풋볼매니저의 포지션 익숙도)", () => {
  it("그 자리가 선호 몇 순위인지로 정한다", () => {
    const preferred = ["CB", "WB", "MF"] as const;
    expect(fitOf(preferred, "CB")).toBe("best");
    expect(fitOf(preferred, "WB")).toBe("good");
    expect(fitOf(preferred, "MF")).toBe("fair");
    expect(fitOf(preferred, "FW")).toBe("poor");
  });

  it("전담 키퍼는 키퍼 자리만 맞고 필드 자리는 맞지 않는다", () => {
    expect(fitOf(["GK"], "GK")).toBe("best");
    expect(fitOf(["GK"], "CB")).toBe("poor");
  });

  it("화면에 쓰는 이름은 순위로 부른다", () => {
    expect([FIT_LABELS.best, FIT_LABELS.good, FIT_LABELS.fair, FIT_LABELS.poor]).toEqual([
      "1순위",
      "2순위",
      "3순위",
      "선호 아님",
    ]);
  });
});
