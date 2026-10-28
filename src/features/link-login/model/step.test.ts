import { describe, expect, it } from "vitest";
import { linkLoginStep } from "./step";

const owner = { id: "m1", realName: "홍길동", jerseyNumber: 7 };

describe("개인 링크를 열었을 때 (PLAN.md §4)", () => {
  it("맞는 링크가 없으면 새 링크를 받으라고 한다", () => {
    expect(linkLoginStep(null, null)).toBe("invalid");
    expect(linkLoginStep(null, "m1")).toBe("invalid");
  });

  it("이미 그 사람으로 들어와 있으면 묻지 않고 홈으로 간다", () => {
    expect(linkLoginStep(owner, "m1")).toBe("signed-in");
  });

  it("로그인 전이거나 다른 사람으로 들어와 있으면 들어가기 단추를 보여 준다", () => {
    expect(linkLoginStep(owner, null)).toBe("confirm");
    expect(linkLoginStep(owner, "someone-else")).toBe("switch");
  });
});
