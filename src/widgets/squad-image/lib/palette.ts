/**
 * 서버 이미지(next/og · Satori)는 CSS 변수를 읽지 못한다. 그래서 `src/app/globals.css` 의
 * @theme 토큰과 **같은 값**을 여기 둔다. 토큰을 바꾸면 여기도 같이 바꾼다.
 */
export const PALETTE = {
  primary: "#1f6f43",
  primarySoft: "#dcefe4",
  bgBase: "#ffffff",
  bgSubtle: "#f4f5f7",
  textPrimary: "#171717",
  textSecondary: "#5b6270",
  textTertiary: "#8b929e",
  border: "#e3e6ea",
  pitch: "#2e7d4f",
  pitchLine: "rgba(255, 255, 255, 0.55)",
  keeper: "#fee500",
  keeperLabel: "#191919",
} as const;
