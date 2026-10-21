import { z } from "zod";
import { memberProfileSchema, type Foot } from "@/entities/member";
import type { Position } from "@/entities/position";
import { passwordField } from "@/shared/lib";

/** 가입 신청 항목(PLAN.md §5): 프로필에 이메일·비밀번호를 더한다. 이메일·비밀번호·실명만 텍스트다. */
const schema = memberProfileSchema
  .extend({
    email: z.string().trim().pipe(z.email("이메일 형식이 맞지 않아요.")),
    password: passwordField,
    passwordConfirm: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "비밀번호가 서로 달라요.",
  });

export type SignUpInput = {
  email: string;
  password: string;
  passwordConfirm: string;
  realName: string;
  feet: string[];
  preferredPositions: string[];
  jerseyNumber: string;
};

export type SignUpField = keyof SignUpInput;

export type SignUpState = {
  errors?: Partial<Record<SignUpField, string>>;
  /** 칸과 상관없는 실패(서버 오류 등) */
  message?: string;
};

export type SignUpValue = {
  email: string;
  password: string;
  realName: string;
  feet: Foot[];
  preferredPositions: Position[];
  jerseyNumber: number | null;
};

export const validateSignUp = (
  input: SignUpInput,
): { ok: true; value: SignUpValue } | { ok: false; errors: Partial<Record<SignUpField, string>> } => {
  const result = schema.safeParse(input);
  if (result.success) {
    const { email, password, realName, feet, preferredPositions, jerseyNumber } = result.data;
    return { ok: true, value: { email, password, realName, feet, preferredPositions, jerseyNumber } };
  }

  const errors: Partial<Record<SignUpField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as SignUpField;
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
};

/**
 * 계정 메타데이터로 실어 보낼 신청 정보. 계정이 만들어지는 순간 DB 트리거
 * (`create_member_from_signup`)가 이 이름 그대로 읽어 멤버 행을 만든다.
 */
export const toSignUpMetadata = (value: SignUpValue) => ({
  real_name: value.realName,
  feet: value.feet,
  preferred_positions: value.preferredPositions,
  jersey_number: value.jerseyNumber,
});

/** 폼에서 값을 읽는다. 선호 포지션은 폼에 들어간 순서가 곧 우선순위다. */
export const readSignUpForm = (formData: FormData): SignUpInput => ({
  email: String(formData.get("email") ?? ""),
  password: String(formData.get("password") ?? ""),
  passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  realName: String(formData.get("realName") ?? ""),
  feet: formData.getAll("feet").map(String),
  preferredPositions: formData.getAll("preferredPositions").map(String),
  jerseyNumber: String(formData.get("jerseyNumber") ?? ""),
});

const ALREADY = "이미 가입한 이메일이에요. 로그인해 주세요.";

/** Supabase Auth 오류 코드를 안내로 바꾼다. 칸에 붙일 수 있으면 그 칸에 붙인다. */
export const signUpFailure = (code: string | undefined): SignUpState => {
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return { errors: { email: ALREADY } };
    case "email_address_invalid":
      return { errors: { email: "쓸 수 없는 이메일이에요. 다른 이메일을 써 주세요." } };
    case "weak_password":
      return { errors: { password: "비밀번호가 너무 쉬워요. 다른 비밀번호를 써 주세요." } };
    case "unexpected_failure":
      // 계정을 만들 때 DB 트리거가 신청 정보를 거부했다. 화면에서 다 걸렀다면 남는 건 등번호 경합이다.
      return {
        message: "가입 정보를 저장하지 못했어요. 등번호가 방금 다른 사람에게 갔을 수 있어요. 다른 번호로 다시 신청해 주세요.",
      };
    case "signup_disabled":
    case "email_provider_disabled":
      return { message: "지금은 가입 신청을 받지 않아요. 관리자에게 알려 주세요." };
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return { message: "시도가 너무 많아요. 잠시 뒤 다시 시도해 주세요." };
    default:
      return { message: "가입 신청을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
};
