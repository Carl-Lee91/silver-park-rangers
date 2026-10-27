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

/** 선수 전력에 넣는 능력치: 필드 여섯 가지. 골키퍼는 뺀다(풋살은 키퍼도 돌아가며 보고, 축구는 키퍼를 따로 앉힌다) */
const FIELD_KEYS: readonly RatingKey[] = ["pace", "shooting", "passing", "dribbling", "defending", "physical"];

/**
 * 선수 전력(PLAN.md §6 "자동 배치 스타일"): 필드 능력치 6개의 평균. 미평가 항목은 빼고 평균하고,
 * 하나도 매기지 않았으면 null(모른다)이다 — 그 사람을 어떻게 볼지는 쓰는 쪽(자동 배치 · 팀 나누기)이 정한다.
 */
export const fieldStrength = (values: RatingValues): number | null => {
  const rated = FIELD_KEYS.flatMap((key) => (values[key] === null ? [] : [values[key]]));
  return rated.length === 0 ? null : rated.reduce((sum, value) => sum + value, 0) / rated.length;
};

/** 여러 선수의 `member_ratings` 줄을 선수 id → 항목별 값으로 묶는다(스쿼드 빌더 · 풋살 팀 나누기) */
export const toRatingsByMember = (rows: unknown): Record<string, RatingValues> =>
  Object.fromEntries(
    z
      .array(z.object({ member_id: z.string() }).passthrough())
      .parse(rows)
      .map((row) => [row.member_id, toRatings(row).values]),
  );
