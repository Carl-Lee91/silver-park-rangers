/**
 * 로그인 화면 주소의 `?error=` 값을 안내 문구로 바꾼다.
 * `access_denied` 는 카카오 동의 화면에서 취소했을 때 Supabase 가 붙여 보내는 값이다.
 */
export const loginErrorMessage = (code: string | null): string | null => {
  if (code === null) return null;
  if (code === "access_denied") return "카카오 로그인을 취소했어요. 다시 시도해 주세요.";
  if (code === "exchange") return "로그인을 마무리하지 못했어요. 다시 시도해 주세요.";
  return "로그인하지 못했어요. 다시 시도해 주세요.";
};
