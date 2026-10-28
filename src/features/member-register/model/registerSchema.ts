import { memberProfileSchema, type MemberType, type NewMember } from "@/entities/member";

export type ProfileField = "realName" | "feet" | "preferredPositions" | "jerseyNumber" | "kind";

export type RegisterState = {
  errors?: Partial<Record<ProfileField, string>>;
  /** 칸과 상관없는 실패(서버 오류 · 번호 겹침 등) */
  message?: string;
  saved?: boolean;
  /** 새로 등록한 사람. 개인 링크를 보내러 선수 상세로 간다 */
  memberId?: string;
};

export type ProfileInput = {
  realName: string;
  feet: string[];
  preferredPositions: string[];
  jerseyNumber: string;
  kind: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; errors: Partial<Record<ProfileField, string>> };

const KINDS: readonly MemberType[] = ["member", "guest"];

/** 관리자가 고치는 프로필. 가입 신청 · 그날 용병과 같은 규칙이다 — DB 제약이 같은 members 행에 걸린다 */
export const validateProfile = (input: ProfileInput): Result<NewMember> => {
  const result = memberProfileSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };

  const errors: Partial<Record<ProfileField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ProfileField;
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
};

/** 선수 등록(PLAN.md §4 관리자 등록): 프로필에 멤버 / 용병을 더한다 */
export const validateRegister = (input: ProfileInput): Result<NewMember & { kind: MemberType }> => {
  const profile = validateProfile(input);
  const kind = KINDS.find((candidate) => candidate === input.kind);
  if (profile.ok && kind !== undefined) return { ok: true, value: { ...profile.value, kind } };

  return {
    ok: false,
    errors: {
      ...(profile.ok ? {} : profile.errors),
      ...(kind === undefined ? { kind: "멤버인지 용병인지 골라 주세요." } : {}),
    },
  };
};

/** `register_member` 의 인자 */
export const toRegisterRpcArgs = (value: NewMember & { kind: MemberType }) => ({
  member_name: value.realName,
  member_feet: value.feet,
  member_positions: value.preferredPositions,
  member_number: value.jerseyNumber,
  kind: value.kind,
});

/** members 행에 쓸 값(관리자가 고치기). 실명은 관리자만 바꾼다 — RLS · 트리거가 다시 본다 */
export const toProfileUpdate = (value: NewMember) => ({
  real_name: value.realName,
  feet: value.feet,
  preferred_positions: value.preferredPositions,
  jersey_number: value.jerseyNumber,
});

/** 폼에서 값을 읽는다. 선호 포지션은 폼에 들어간 순서가 곧 우선순위다 */
export const readProfileForm = (formData: FormData): ProfileInput => ({
  realName: String(formData.get("realName") ?? ""),
  feet: formData.getAll("feet").map(String),
  preferredPositions: formData.getAll("preferredPositions").map(String),
  jerseyNumber: String(formData.get("jerseyNumber") ?? ""),
  kind: String(formData.get("kind") ?? ""),
});
