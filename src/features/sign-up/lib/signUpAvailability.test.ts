import { describe, expect, it } from "vitest";
import { signUpAvailability } from "./signUpAvailability";

const settings = (overrides: Record<string, unknown> = {}) => ({
  external: { email: true },
  disable_signup: false,
  mailer_autoconfirm: true,
  ...overrides,
});

describe("가입 신청을 받을 수 있는지 (Supabase /auth/v1/settings)", () => {
  it("이메일 가입이 켜져 있고 이메일 확인이 꺼져 있으면 받는다", () => {
    expect(signUpAvailability(settings())).toBe("ready");
  });

  it("가입이 꺼져 있으면 알려준다", () => {
    expect(signUpAvailability(settings({ disable_signup: true }))).toBe("signup-disabled");
  });

  it("이메일 로그인이 꺼져 있으면 알려준다", () => {
    expect(signUpAvailability(settings({ external: { email: false } }))).toBe("email-provider-off");
  });

  it("이메일 확인이 켜져 있으면 알려준다 — 확인 메일이 팀원에게 가지 않는다", () => {
    expect(signUpAvailability(settings({ mailer_autoconfirm: false }))).toBe("email-confirm-on");
  });

  it("설정을 못 읽으면 모른다고 본다 — 이때는 신청 폼을 그대로 보여 준다", () => {
    expect(signUpAvailability(null)).toBe("unknown");
    expect(signUpAvailability({ external: "x" })).toBe("unknown");
  });
});
