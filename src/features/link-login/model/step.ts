import type { LinkMember } from "@/entities/member";

/**
 * 개인 링크 화면이 할 일(PLAN.md §4).
 *   invalid   — 맞는 링크가 없다(새 링크로 바뀌었거나 휴면). 새 링크를 받으라고 한다
 *   signed-in — 이미 그 사람으로 들어와 있다. 묻지 않고 홈으로 간다
 *   confirm   — 로그인 전. "○○님으로 들어가기"
 *   switch    — 다른 사람으로 들어와 있다. 누르면 링크 주인으로 바뀐다고 알린다
 */
export type LinkLoginStep = "invalid" | "signed-in" | "confirm" | "switch";

export const linkLoginStep = (owner: LinkMember | null, userId: string | null): LinkLoginStep => {
  if (owner === null) return "invalid";
  if (userId === null) return "confirm";
  return userId === owner.id ? "signed-in" : "switch";
};
