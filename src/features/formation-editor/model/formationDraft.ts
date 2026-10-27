import { layoutFormation, type FormationSlot, type PositionCounts } from "@/entities/formation";
import { POSITION_CODES } from "@/entities/position";

/** 필드 최대 인원. 키퍼 1명을 더해 11명이다. */
export const MAX_FIELD = 10;

/** 새 포메이션은 4-3-3 인원수로 시작한다. */
export const DEFAULT_COUNTS: PositionCounts = { FW: 1, AM: 0, WG: 2, MF: 3, WM: 0, DM: 0, WB: 0, CB: 2, FB: 2, GK: 1 };

export type FormationDraft = { name: string; counts: PositionCounts };

export type FormationDraftState = {
  errors?: { name?: string; counts?: string };
  message?: string;
};

export const fieldCount = (counts: PositionCounts) =>
  POSITION_CODES.filter((code) => code !== "GK").reduce((sum, code) => sum + counts[code], 0);

/** 키퍼는 항상 1명이다 — 빌더가 키퍼 자리를 따로 다루기 때문이다(PLAN.md §6). */
export const validateFormationDraft = (
  draft: FormationDraft,
  existingNames: readonly string[] = [],
): { ok: true; value: { name: string; slots: FormationSlot[] } } | { ok: false; errors: NonNullable<FormationDraftState["errors"]> } => {
  const errors: NonNullable<FormationDraftState["errors"]> = {};
  const name = draft.name.trim();

  if (name === "") errors.name = "이름을 입력해 주세요.";
  else if (name.length > 30) errors.name = "이름은 30자까지 입력할 수 있어요.";
  else if (existingNames.includes(name)) errors.name = "같은 이름의 포메이션이 있어요.";

  const field = fieldCount(draft.counts);
  if (field > MAX_FIELD) errors.counts = `필드는 ${MAX_FIELD}명까지예요. 지금 ${field}명이에요.`;
  else if (field < 1) errors.counts = "필드에 한 명 이상 넣어 주세요.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, slots: layoutFormation({ ...draft.counts, GK: 1 }) } };
};

export const readFormationForm = (formData: FormData): FormationDraft => ({
  name: String(formData.get("name") ?? ""),
  counts: Object.fromEntries(
    POSITION_CODES.map((code) => {
      if (code === "GK") return [code, 1];
      const count = Math.floor(Number(formData.get(code) ?? 0));
      return [code, Number.isFinite(count) && count > 0 ? count : 0];
    }),
  ) as PositionCounts,
});
