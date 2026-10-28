import { describe, expect, it } from "vitest";
import { isLinkAccount, linkAccountEmail } from "./linkAccount";

describe("개인 링크 계정 (PLAN.md §4)", () => {
  it("이메일 칸에는 메일이 가지 않는 표시용 주소를 넣는다 — 멤버 id 그대로", () => {
    expect(linkAccountEmail("6f1c2d")).toBe("6f1c2d@link.invalid");
  });

  it("링크로 만든 계정인지는 계정의 app_metadata 로 안다", () => {
    expect(isLinkAccount({ provider: "email", link_login: true })).toBe(true);
    expect(isLinkAccount({ provider: "email" })).toBe(false);
    expect(isLinkAccount(undefined)).toBe(false);
  });
});
