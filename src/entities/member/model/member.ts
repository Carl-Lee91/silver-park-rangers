import { z } from "zod";
import { POSITION_CODES, type Position } from "@/entities/position";

export const FEET = [
  { code: "left", label: "왼발" },
  { code: "right", label: "오른발" },
] as const;

export type Foot = (typeof FEET)[number]["code"];

const FOOT_LABELS = Object.fromEntries(FEET.map(({ code, label }) => [code, label])) as Record<Foot, string>;

export const footLabel = (code: Foot): string => FOOT_LABELS[code];

export type MemberStatus = "pending" | "approved" | "rejected" | "inactive";
export type MemberRole = "admin" | "user";

export type Member = {
  id: string;
  realName: string;
  kakaoNickname: string | null;
  avatarUrl: string | null;
  feet: Foot[];
  /** 순서가 우선순위다 */
  preferredPositions: Position[];
  role: MemberRole;
  status: MemberStatus;
};

const rowSchema = z.object({
  id: z.string(),
  real_name: z.string(),
  kakao_nickname: z.string().nullable(),
  avatar_url: z.string().nullable(),
  feet: z.array(z.enum(["left", "right"])),
  preferred_positions: z.array(z.enum(POSITION_CODES)),
  role: z.enum(["admin", "user"]),
  status: z.enum(["pending", "approved", "rejected", "inactive"]),
});

/** 조회할 컬럼. `toMember` 가 읽는 것과 같다. */
export const MEMBER_COLUMNS =
  "id, real_name, kakao_nickname, avatar_url, feet, preferred_positions, role, status";

/**
 * DB 행을 화면이 쓰는 모양으로 바꾼다. 모르는 값이 오면 조용히 넘기지 않고 터뜨린다 —
 * DB 에 값이 늘었는데 앱이 모르면, 틀린 화면보다 오류가 낫다.
 */
export const toMember = (row: unknown): Member => {
  const parsed = rowSchema.parse(row);
  return {
    id: parsed.id,
    realName: parsed.real_name,
    kakaoNickname: parsed.kakao_nickname,
    avatarUrl: parsed.avatar_url,
    feet: parsed.feet,
    preferredPositions: parsed.preferred_positions,
    role: parsed.role,
    status: parsed.status,
  };
};
