import type { SignUpAvailability } from "../lib/signUpAvailability";

const COPY: Record<Exclude<SignUpAvailability, "ready" | "unknown">, { title: string; fix: string }> = {
  "signup-disabled": {
    title: "지금은 가입 신청을 받지 않게 설정돼 있어요.",
    fix: "Supabase 대시보드 › Authentication › Sign In / Providers › Allow new users to sign up 을 켜 주세요.",
  },
  "email-provider-off": {
    title: "이메일 로그인이 꺼져 있어요.",
    fix: "Supabase 대시보드 › Authentication › Sign In / Providers › Email 을 켜 주세요.",
  },
  "email-confirm-on": {
    title: "이메일 확인이 켜져 있어서 신청해도 로그인할 수 없어요.",
    fix: "Supabase 대시보드 › Authentication › Sign In / Providers › Email › Confirm email 을 꺼 주세요. 확인 메일은 팀원에게 가지 않아요.",
  },
};

/**
 * Supabase 설정이 빠졌을 때 신청 폼 자리에 둔다. 조용히 폼을 숨기거나 실패하게 두면
 * 무엇을 안 했는지 알 수 없다(CLAUDE.md "외부 연동").
 */
export default function SignUpUnavailable({ reason }: { reason: Exclude<SignUpAvailability, "ready" | "unknown"> }) {
  const copy = COPY[reason];
  return (
    <div role="status" className="rounded-xl border border-border bg-bg-subtle p-4 text-sm leading-6">
      <p className="font-semibold">{copy.title}</p>
      <p className="mt-1 text-text-secondary">관리자에게 알려 주세요. {copy.fix}</p>
    </div>
  );
}
