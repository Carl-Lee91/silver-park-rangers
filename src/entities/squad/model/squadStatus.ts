import type { Match } from "@/entities/match";

export type SquadStatus = "none" | "saved" | "published";

export const SQUAD_STATUS_LABELS: Record<SquadStatus, string> = {
  none: "짜기 전",
  saved: "저장됨 · 공개 전",
  published: "공개됨",
};

/**
 * 매치의 스쿼드가 어디까지 왔는지(관리 › 스쿼드). 저장한 스쿼드가 없으면 공개 표시가 남아 있어도
 * 짜기 전으로 본다 — 팀원에게 보일 게 없다.
 */
export const squadStatus = ({
  hasSquad,
  squadPublishedAt,
}: { hasSquad: boolean } & Pick<Match, "squadPublishedAt">): SquadStatus => {
  if (!hasSquad) return "none";
  return squadPublishedAt === null ? "saved" : "published";
};
