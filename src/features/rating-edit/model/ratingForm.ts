import { RATING_KEYS, RATING_MAX, RATING_MIN, type RatingValues } from "@/entities/rating";

export const RATING_ERROR = "능력치는 1~10 사이로 골라 주세요.";

/**
 * 능력치 폼 값을 읽는다. 항목마다 1~10 정수, 비운 칸(미평가)과 빠진 항목은 null.
 * 범위는 DB 제약(member_ratings)과 같다.
 */
export const parseRatingForm = (formData: FormData): { ok: true; values: RatingValues } | { ok: false; error: string } => {
  const values = {} as RatingValues;
  for (const key of RATING_KEYS) {
    const raw = String(formData.get(key) ?? "").trim();
    if (raw === "") {
      values[key] = null;
      continue;
    }
    const value = Number(raw);
    if (!Number.isInteger(value) || value < RATING_MIN || value > RATING_MAX) return { ok: false, error: RATING_ERROR };
    values[key] = value;
  }
  return { ok: true, values };
};
