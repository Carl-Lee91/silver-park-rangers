const quarterOf = (value: FormDataEntryValue | null) => {
  const quarter = Number(value);
  return Number.isInteger(quarter) && quarter >= 1 ? quarter : null;
};
const idOrNull = (value: FormDataEntryValue | null) => (value === null || value === "" ? null : String(value));

/** 골 하나. 득점자·도움이 비면 모름(null). 득점자와 도움은 다른 사람이어야 한다(DB 제약과 같다). */
export const readGoalForm = (
  formData: FormData,
):
  | { ok: true; value: { matchId: string; quarter: number; scorerId: string | null; assistId: string | null } }
  | { ok: false; error: string } => {
  const quarter = quarterOf(formData.get("quarter"));
  if (quarter === null) return { ok: false, error: "쿼터를 다시 골라 주세요." };
  const scorerId = idOrNull(formData.get("scorerId"));
  const assistId = idOrNull(formData.get("assistId"));
  if (scorerId !== null && scorerId === assistId) return { ok: false, error: "득점과 도움은 다른 사람이어야 해요." };
  return { ok: true, value: { matchId: String(formData.get("matchId")), quarter, scorerId, assistId } };
};

/** 상대 점수(0~99) */
export const readScoreForm = (
  formData: FormData,
): { ok: true; value: { matchId: string; quarter: number; theirScore: number } } | { ok: false; error: string } => {
  const quarter = quarterOf(formData.get("quarter"));
  const theirScore = Number(formData.get("theirScore"));
  if (quarter === null || !Number.isInteger(theirScore) || theirScore < 0 || theirScore > 99) {
    return { ok: false, error: "점수를 다시 확인해 주세요." };
  }
  return { ok: true, value: { matchId: String(formData.get("matchId")), quarter, theirScore } };
};
