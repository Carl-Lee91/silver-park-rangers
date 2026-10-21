import { z } from "zod";
import { passwordField } from "@/shared/lib";

const schema = z
  .object({ password: passwordField, passwordConfirm: z.string() })
  .refine((value) => value.password === value.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "비밀번호가 서로 달라요.",
  });

export type PasswordChangeField = "password" | "passwordConfirm";

export type PasswordChangeState = {
  errors?: Partial<Record<PasswordChangeField, string>>;
  message?: string;
  /** 바꿨다 */
  saved?: boolean;
};

export const validatePasswordChange = (input: {
  password: string;
  passwordConfirm: string;
}): { ok: true; value: string } | { ok: false; errors: Partial<Record<PasswordChangeField, string>> } => {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, value: result.data.password };

  const errors: Partial<Record<PasswordChangeField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as PasswordChangeField;
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
};

/** Supabase Auth 오류 코드를 안내로 바꾼다. */
export const passwordChangeFailure = (code: string | undefined): PasswordChangeState => {
  switch (code) {
    case "same_password":
      return { errors: { password: "지금 비밀번호와 같아요." } };
    case "weak_password":
      return { errors: { password: "비밀번호가 너무 쉬워요. 다른 비밀번호를 써 주세요." } };
    case "reauthentication_needed":
      // 대시보드의 Secure password change 를 켜 두면 최근에 로그인한 사람만 바꾼다.
      return { message: "로그인한 지 오래돼서 바꾸지 못했어요. 로그아웃했다가 다시 로그인한 뒤 바꿔 주세요." };
    default:
      return { message: "비밀번호를 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
};
