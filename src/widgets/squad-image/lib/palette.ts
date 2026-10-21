/**
 * 서버 이미지(next/og · Satori)는 CSS 변수를 읽지 못한다. 그래서 `src/app/globals.css` 의
 * @theme 토큰과 **같은 값**을 여기 둔다. 토큰을 바꾸면 여기도 같이 바꾼다(palette.test.ts 가 검사한다).
 * 앱처럼 다크 모드다.
 */
export const PALETTE = {
  /** --color-primary(= 유니폼 하늘색) */
  primary: "#80c4ee",
  primarySoft: "#2a3442",
  bgBase: "#10151c",
  bgSubtle: "#19202a",
  textPrimary: "#e9eef4",
  textSecondary: "#a3aebc",
  textTertiary: "#7d8999",
  border: "#29323e",
  pitch: "#245e3f",
  pitchLine: "rgba(255, 255, 255, 0.55)",
  keeper: "#fee500",
  keeperLabel: "#191919",
  /** 우리 팀 유니폼(--color-kit): 필드 선수 유니폼 */
  kit: "#80c4ee",
  kitLabel: "#0f2a44",
} as const;
