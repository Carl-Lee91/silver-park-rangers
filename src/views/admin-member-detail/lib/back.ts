import { adminMatchPath, ROUTES } from "@/shared/config";

/** 돌아갈 수 있는 화면. 아는 주소만 받는다 — `from` 은 주소창에서 누구나 바꿀 수 있다 */
const BACKS: { pattern: RegExp; label: string }[] = [
  { pattern: /^\/admin\/matches\/[0-9a-f-]{36}\/squad$/, label: "스쿼드" },
  { pattern: /^\/admin\/matches\/[0-9a-f-]{36}\/teams$/, label: "팀 나누기" },
  { pattern: /^\/admin\/matches\/[0-9a-f-]{36}$/, label: "매치" },
  { pattern: /^\/admin\/stats$/, label: "통계" },
];

/**
 * 선수 상세의 뒤로 가기. 온 화면(`?from=`)이 있으면 그리로, 없으면 멤버는 멤버 목록,
 * 그날 용병은 그 매치 관리 화면(멤버 목록에 나오지 않는다)으로 간다.
 */
export const memberBack = (from: string | string[] | undefined, guestMatchId: string | null) => {
  const known = typeof from === "string" ? BACKS.find((back) => back.pattern.test(from)) : undefined;
  if (known !== undefined && typeof from === "string") return { href: from, label: known.label };
  if (guestMatchId !== null) return { href: adminMatchPath(guestMatchId), label: "매치" };
  return { href: ROUTES.adminMembers, label: "멤버" };
};
