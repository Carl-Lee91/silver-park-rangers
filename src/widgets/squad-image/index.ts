export type { SquadImageKind } from "./server";

/** 이미지 주소. `version` 은 스쿼드 내용 해시다 — 바뀌면 주소가 바뀌어 카톡 캐시를 피한다. */
export const squadImagePath = (token: string, kind: "card" | "quarters" | "rotation", version: string) =>
  kind === "card" ? `/s/${token}/og?v=${version}` : `/s/${token}/image?view=${kind}&v=${version}`;
