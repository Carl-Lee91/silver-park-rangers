import { z } from "zod";
import { profileFieldsSchema, type NewMember } from "@/entities/member";

/** DB 제약(members 테이블)과 같은 규칙이다. 화면에서 먼저 걸러 알맞은 안내를 띄운다. */
const schema = z
  .object({
    realName: z
      .string()
      .trim()
      .min(1, "실명을 입력해 주세요.")
      .max(20, "실명은 20자까지 입력할 수 있어요."),
  })
  .extend(profileFieldsSchema.shape);

export type OnboardingField = keyof z.infer<typeof schema>;

export type OnboardingState = {
  errors?: Partial<Record<OnboardingField, string>>;
  /** 칸과 상관없는 실패(서버 오류 등) */
  message?: string;
};

export type OnboardingInput = { realName: string; feet: string[]; preferredPositions: string[] };

export const validateOnboarding = (
  input: OnboardingInput,
): { ok: true; value: NewMember } | { ok: false; errors: Partial<Record<OnboardingField, string>> } => {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };

  const errors: Partial<Record<OnboardingField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as OnboardingField;
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
};

/**
 * 폼에서 값을 읽는다. 선호 포지션은 폼에 들어간 순서가 곧 우선순위다 —
 * 폼은 고른 순서대로 숨은 입력칸을 그린다(OnboardingForm).
 */
export const readOnboardingForm = (formData: FormData): OnboardingInput => ({
  realName: String(formData.get("realName") ?? ""),
  feet: formData.getAll("feet").map(String),
  preferredPositions: formData.getAll("preferredPositions").map(String),
});
