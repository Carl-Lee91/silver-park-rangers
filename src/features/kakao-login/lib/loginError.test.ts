import { describe, expect, it } from "vitest";
import { loginErrorMessage } from "./loginError";

describe("로그인 실패 안내", () => {
  it("카카오 화면에서 취소하면 다시 시도하라고 한다", () => {
    expect(loginErrorMessage("access_denied")).toBe("카카오 로그인을 취소했어요. 다시 시도해 주세요.");
  });

  it("세션을 못 만들었으면 다시 시도하라고 한다", () => {
    expect(loginErrorMessage("exchange")).toBe("로그인을 마무리하지 못했어요. 다시 시도해 주세요.");
  });

  it("모르는 코드도 일반 안내를 보여 준다", () => {
    expect(loginErrorMessage("something")).toBe("로그인하지 못했어요. 다시 시도해 주세요.");
  });

  it("오류가 없으면 아무것도 보여 주지 않는다", () => {
    expect(loginErrorMessage(null)).toBeNull();
  });
});
