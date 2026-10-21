import { adminSquadPath } from "@/shared/config";

/** 이미지 주소. `version` 은 스쿼드 내용 해시다 — 바뀌면 주소가 바뀌어 카톡 캐시를 피한다. */
export const squadImagePath = (token: string, kind: "card" | "quarters" | "rotation", version: string) =>
  kind === "card" ? `/s/${token}/og?v=${version}` : `/s/${token}/image?view=${kind}&v=${version}`;

/**
 * 관리자용 이미지 주소. 공개 전에도 저장한 스쿼드를 그린다. 관리 화면 아래라 게이트가 길을 막고,
 * 실제로는 RLS 가 공개 전 스쿼드를 관리자에게만 준다.
 */
export const adminSquadImagePath = (matchId: string, kind: "quarters" | "rotation", version: string) =>
  `${adminSquadPath(matchId)}/image?view=${kind}&v=${version}`;
