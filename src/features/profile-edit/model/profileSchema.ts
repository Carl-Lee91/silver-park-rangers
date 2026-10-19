import { profileFieldsSchema, type Foot } from "@/entities/member";
import type { Position } from "@/entities/position";

export type ProfileField = "feet" | "preferredPositions" | "jerseyNumber";

export type ProfileState = {
  errors?: Partial<Record<ProfileField, string>>;
  message?: string;
  /** 저장을 마쳤다 */
  saved?: boolean;
};

export type ProfileInput = { feet: string[]; preferredPositions: string[]; jerseyNumber: string };

/** 등번호는 비우면 없음(null), 아니면 0~99 정수. DB 제약과 같다. */
const readJersey = (value: string): { ok: true; value: number | null } | { ok: false } => {
  if (value === "") return { ok: true, value: null };
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 99 ? { ok: true, value: number } : { ok: false };
};

export const validateProfile = (
  input: ProfileInput,
):
  | { ok: true; value: { feet: Foot[]; preferredPositions: Position[]; jerseyNumber: number | null } }
  | { ok: false; errors: Partial<Record<ProfileField, string>> } => {
  const errors: Partial<Record<ProfileField, string>> = {};
  const result = profileFieldsSchema.safeParse(input);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as ProfileField;
      errors[field] ??= issue.message;
    }
  }
  const jersey = readJersey(input.jerseyNumber);
  if (!jersey.ok) errors.jerseyNumber = "등번호는 0~99 사이로 골라 주세요.";

  if (!result.success || !jersey.ok) return { ok: false, errors };
  return { ok: true, value: { ...result.data, jerseyNumber: jersey.value } };
};

export const readProfileForm = (formData: FormData): ProfileInput => ({
  feet: formData.getAll("feet").map(String),
  preferredPositions: formData.getAll("preferredPositions").map(String),
  jerseyNumber: String(formData.get("jerseyNumber") ?? ""),
});
