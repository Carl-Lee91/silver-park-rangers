export type PasswordLoginState = { error?: string };

export const readPasswordLogin = (
  formData: FormData,
): { ok: true; value: { email: string; password: string } } | { ok: false; error: string } => {
  const email = String(formData.get("email") ?? "").trim();
  // 비밀번호는 공백도 비밀번호의 일부라 다듬지 않는다.
  const password = String(formData.get("password") ?? "");
  if (email === "" || password === "") return { ok: false, error: "이메일과 비밀번호를 입력해 주세요." };
  return { ok: true, value: { email, password } };
};

/** Supabase Auth 오류 코드를 안내로 바꾼다. */
export const passwordLoginErrorMessage = (code: string | undefined): string => {
  if (code === "invalid_credentials") return "이메일 또는 비밀번호가 맞지 않아요.";
  if (code === "over_request_rate_limit") return "시도가 너무 많아요. 잠시 뒤 다시 시도해 주세요.";
  return "로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.";
};
