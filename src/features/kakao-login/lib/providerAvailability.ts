/**
 * Supabase `/auth/v1/settings` 응답에서 카카오 로그인이 켜져 있는지 본다.
 * 모양이 예상과 다르면 꺼진 것으로 본다 — 켜지지 않은 단추를 누르게 하는 것보다 낫다.
 */
export const isKakaoEnabled = (settings: unknown): boolean => {
  if (typeof settings !== "object" || settings === null) return false;
  const external = (settings as { external?: unknown }).external;
  if (typeof external !== "object" || external === null) return false;
  return (external as { kakao?: unknown }).kakao === true;
};
