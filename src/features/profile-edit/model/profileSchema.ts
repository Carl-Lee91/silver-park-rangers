import { profileFieldsSchema, type Foot } from "@/entities/member";
import type { Position } from "@/entities/position";

export type ProfileField = "feet" | "preferredPositions";

export type ProfileState = {
  errors?: Partial<Record<ProfileField, string>>;
  message?: string;
  /** 저장을 마쳤다 */
  saved?: boolean;
};

export const validateProfile = (input: {
  feet: string[];
  preferredPositions: string[];
}): { ok: true; value: { feet: Foot[]; preferredPositions: Position[] } } | { ok: false; errors: Partial<Record<ProfileField, string>> } => {
  const result = profileFieldsSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };

  const errors: Partial<Record<ProfileField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ProfileField;
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
};

export const readProfileForm = (formData: FormData) => ({
  feet: formData.getAll("feet").map(String),
  preferredPositions: formData.getAll("preferredPositions").map(String),
});
