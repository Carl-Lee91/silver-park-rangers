import { describe, expect, it } from "vitest";
import { passwordField } from "./password";

describe("비밀번호 규칙", () => {
  it("8자 이상 72자까지다 — 72자는 bcrypt 한계(Supabase 와 같다)", () => {
    expect(passwordField.safeParse("1234567").error?.issues[0].message).toBe("비밀번호는 8자 이상이에요.");
    expect(passwordField.safeParse("12345678").success).toBe(true);
    expect(passwordField.safeParse("a".repeat(73)).error?.issues[0].message).toBe("비밀번호는 72자까지예요.");
  });

  it("공백도 비밀번호의 일부라 다듬지 않는다", () => {
    expect(passwordField.parse(" spaced pw ")).toBe(" spaced pw ");
  });
});
