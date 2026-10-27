import { z } from "zod";

/** 능력치 항목(DB 컬럼 이름) */
export const RATING_KEYS = ["pace", "shooting", "passing", "dribbling", "defending", "physical", "goalkeeping"] as const;
export type RatingKey = (typeof RATING_KEYS)[number];

/** 항목마다 1~10. 매기지 않았으면 null(0 이 아니다) */
export type RatingValues = Record<RatingKey, number | null>;

export type MemberRatings = { values: RatingValues; updatedAt: string | null };

export const RATING_MIN = 1;
export const RATING_MAX = 10;

/**
 * 능력치 일곱 가지(PLAN.md §5 "능력치"). 팀원에게 익숙한 피파 카드 여섯 가지 + 골키퍼.
 * help 는 이름 옆 ? 단추에 뜨는 "무엇을 보나"다 — 관리자마다 기준이 갈리지 않게.
 */
export const RATING_ATTRIBUTES: { key: RatingKey; label: string; help: string }[] = [
  { key: "pace", label: "속도", help: "순간 속도, 전력 질주, 뒷공간 침투와 복귀" },
  { key: "shooting", label: "슛", help: "결정력, 슈팅의 정확도와 세기, 중거리" },
  { key: "passing", label: "패스", help: "짧은 패스·긴 패스의 정확도, 시야, 크로스" },
  { key: "dribbling", label: "개인기", help: "볼 컨트롤, 첫 터치, 1:1 돌파, 탈압박" },
  { key: "defending", label: "수비", help: "마크, 위치 선정, 태클, 가로채기" },
  { key: "physical", label: "피지컬", help: "몸싸움, 공중볼, 체력(6쿼터를 버티는지)" },
  { key: "goalkeeping", label: "골키퍼", help: "선방, 캐칭, 킥, 나오는 판단. 키퍼를 볼 수 있는 사람만 매겨요" },
];

export type RatingTone = "best" | "good" | "fair" | "poor";

/** 색 단계: 9~10 팀 최고 · 7~8 잘함 · 4~6 평균 · 1~3 약함. 자리 적합도와 같은 네 단계 색을 쓴다 */
export const ratingTone = (value: number | null): RatingTone | null => {
  if (value === null) return null;
  if (value >= 9) return "best";
  if (value >= 7) return "good";
  if (value >= 4) return "fair";
  return "poor";
};

export const RATING_COLUMNS = `member_id, ${RATING_KEYS.join(", ")}, updated_at`;

const score = z.number().int().min(RATING_MIN).max(RATING_MAX).nullable();
const rowSchema = z.object({
  pace: score,
  shooting: score,
  passing: score,
  dribbling: score,
  defending: score,
  physical: score,
  goalkeeping: score,
  updated_at: z.string(),
});

const EMPTY: RatingValues = Object.fromEntries(RATING_KEYS.map((key) => [key, null])) as RatingValues;

/** `member_ratings` 한 줄. 한 번도 매기지 않았으면(줄이 없으면) 모두 비어 있다 */
export const toRatings = (row: unknown): MemberRatings => {
  if (row === null || row === undefined) return { values: { ...EMPTY }, updatedAt: null };
  const parsed = rowSchema.parse(row);
  return {
    values: Object.fromEntries(RATING_KEYS.map((key) => [key, parsed[key]])) as RatingValues,
    updatedAt: parsed.updated_at,
  };
};
