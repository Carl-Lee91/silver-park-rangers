export type SignUpAvailability =
  | "ready"
  | "signup-disabled"
  | "email-provider-off"
  | "email-confirm-on"
  /** 설정을 못 읽었다. 신청 폼을 그대로 보여 주고, 실패하면 그때 안내한다 */
  | "unknown";

type AuthSettings = { disable_signup?: unknown; mailer_autoconfirm?: unknown; external?: { email?: unknown } };

/**
 * Supabase `/auth/v1/settings` 응답으로 가입 신청을 받을 수 있는지 본다.
 * 설정이 빠졌으면 폼 대신 무엇을 바꿔야 하는지 안내한다(CLAUDE.md "외부 연동").
 *
 * 이메일 확인이 켜져 있으면 신청한 사람이 로그인할 수 없다 — Supabase 기본 메일은 팀원에게 가지 않는다
 * (PLAN.md §2). `mailer_autoconfirm` 이 true 여야 확인이 꺼진 것이다.
 */
export const signUpAvailability = (settings: unknown): SignUpAvailability => {
  if (typeof settings !== "object" || settings === null) return "unknown";
  const { disable_signup, mailer_autoconfirm, external } = settings as AuthSettings;
  if (typeof external !== "object" || external === null) return "unknown";

  if (disable_signup === true) return "signup-disabled";
  if (external.email !== true) return "email-provider-off";
  if (mailer_autoconfirm !== true) return "email-confirm-on";
  return "ready";
};
