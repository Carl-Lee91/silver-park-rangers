import type { Position } from "@/entities/position";
import { preferenceScore } from "@/entities/squad";

/**
 * 자리 적합도. 풋볼매니저 전술 화면의 포지션 익숙도처럼, 그 자리가 선호 몇 순위인지를 색으로 보인다.
 * 자동 배치의 선호 점수(1순위 3점 · 2순위 2점 · 3순위 1점, PLAN.md §6)와 같은 기준이다.
 */
export type Fit = "best" | "good" | "fair" | "poor";

const BY_SCORE: readonly Fit[] = ["poor", "fair", "good", "best"];

export const fitOf = (preferredPositions: readonly Position[], position: Position): Fit =>
  BY_SCORE[preferenceScore({ preferredPositions }, position)];

export const FIT_LABELS: Record<Fit, string> = { best: "1순위", good: "2순위", fair: "3순위", poor: "선호 아님" };
