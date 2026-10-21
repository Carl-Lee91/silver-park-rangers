import { memberProfileSchema, type NewMember } from "@/entities/member";

export type GuestField = "realName" | "feet" | "preferredPositions" | "jerseyNumber";

export type GuestState = {
  errors?: Partial<Record<GuestField, string>>;
  /** 칸과 상관없는 실패(서버 오류 등) */
  message?: string;
  /** 저장을 마쳤다 */
  saved?: boolean;
};

export type GuestInput = { realName: string; feet: string[]; preferredPositions: string[]; jerseyNumber: string };

/** 그날 용병(PLAN.md §4)도 가입한 멤버와 같은 규칙이다 — DB 제약이 같은 members 행에 걸린다. */
export const validateGuest = (
  input: GuestInput,
): { ok: true; value: NewMember } | { ok: false; errors: Partial<Record<GuestField, string>> } => {
  const result = memberProfileSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };

  const errors: Partial<Record<GuestField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as GuestField;
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
};

/** `add_match_guest` · `update_match_guest` 의 인자 */
export const toGuestRpcArgs = (value: NewMember) => ({
  guest_name: value.realName,
  guest_feet: value.feet,
  guest_positions: value.preferredPositions,
  guest_number: value.jerseyNumber,
});

/** 폼에서 값을 읽는다. 선호 포지션은 폼에 들어간 순서가 곧 우선순위다. */
export const readGuestForm = (formData: FormData): GuestInput => ({
  realName: String(formData.get("realName") ?? ""),
  feet: formData.getAll("feet").map(String),
  preferredPositions: formData.getAll("preferredPositions").map(String),
  jerseyNumber: String(formData.get("jerseyNumber") ?? ""),
});
