import { jerseyNumberField, profileFieldsSchema, type Foot } from "@/entities/member";
import type { Position } from "@/entities/position";

export type ProfileField = "feet" | "preferredPositions" | "jerseyNumber";

export type ProfileState = {
  errors?: Partial<Record<ProfileField, string>>;
  message?: string;
  /** 저장을 마쳤다 */
  saved?: boolean;
};

export type ProfileInput = { feet: string[]; preferredPositions: string[]; jerseyNumber: string };

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
  const jersey = jerseyNumberField.safeParse(input.jerseyNumber);
  if (!jersey.success) errors.jerseyNumber = jersey.error.issues[0].message;

  if (!result.success || !jersey.success) return { ok: false, errors };
  return { ok: true, value: { ...result.data, jerseyNumber: jersey.data } };
};

export const readProfileForm = (formData: FormData): ProfileInput => ({
  feet: formData.getAll("feet").map(String),
  preferredPositions: formData.getAll("preferredPositions").map(String),
  jerseyNumber: String(formData.get("jerseyNumber") ?? ""),
});
