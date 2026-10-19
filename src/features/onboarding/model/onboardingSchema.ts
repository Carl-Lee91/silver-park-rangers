import { z } from "zod";
import type { NewMember } from "@/entities/member";
import { POSITIONS } from "@/entities/position";

const POSITION_CODES = POSITIONS.map(({ code }) => code) as [
  (typeof POSITIONS)[number]["code"],
  ...(typeof POSITIONS)[number]["code"][],
];

const distinct = (items: readonly string[]) => new Set(items).size === items.length;

/** DB 제약(members 테이블)과 같은 규칙이다. 화면에서 먼저 걸러 알맞은 안내를 띄운다. */
const schema = z.object({
  realName: z
    .string()
    .trim()
    .min(1, "실명을 입력해 주세요.")
    .max(20, "실명은 20자까지 입력할 수 있어요."),
  feet: z
    .array(z.enum(["left", "right"]), "주로 쓰는 발을 골라 주세요.")
    .min(1, "주로 쓰는 발을 골라 주세요.")
    .refine(distinct, "같은 발을 두 번 고를 수 없어요."),
  preferredPositions: z
    .array(z.enum(POSITION_CODES), "선호 포지션을 골라 주세요.")
    .min(1, "선호 포지션을 하나 이상 골라 주세요.")
    .max(3, "선호 포지션은 3개까지 고를 수 있어요.")
    .refine(distinct, "같은 포지션을 두 번 고를 수 없어요."),
});

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
