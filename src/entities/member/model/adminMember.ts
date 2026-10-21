import { z } from "zod";
import { MEMBER_COLUMNS, toMember, type Member } from "./member";

export type MemberType = "member" | "guest";

/** 관리 화면이 보는 멤버. 멤버/용병 구분·그날 용병·이메일은 관리자 이상만 읽을 수 있다(RLS·RPC). */
export type AdminMember = Member & {
  /** 가입 대기·거절이면 아직 정하지 않아 null */
  memberType: MemberType | null;
  /** 그날 용병(PLAN.md §4)이면 그 매치 id. 가입한 사람은 null */
  guestMatchId: string | null;
  /** 로그인 이메일. 따로 읽어 붙인다(`member_emails`). 그날 용병은 계정이 없어 null */
  email: string | null;
  createdAt: string;
};

export const ADMIN_MEMBER_COLUMNS = `${MEMBER_COLUMNS}, created_at, member_admin_info(member_type), match_guests(match_id)`;

const adminInfo = z.object({ member_type: z.enum(["member", "guest"]) });
const guestOf = z.object({ match_id: z.string() });
// 1:1 관계라 객체로 오지만, 관계를 못 알아보면 배열로 온다. 둘 다 받는다.
const oneToOne = <T extends z.ZodType>(schema: T) => z.union([schema, z.array(schema)]).nullable();
const extraSchema = z.object({
  created_at: z.string(),
  member_admin_info: oneToOne(adminInfo),
  match_guests: oneToOne(guestOf).optional(),
});

const single = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

export const toAdminMember = (row: unknown): AdminMember => {
  const extra = extraSchema.parse(row);
  return {
    ...toMember(row),
    memberType: single(extra.member_admin_info)?.member_type ?? null,
    guestMatchId: single(extra.match_guests)?.match_id ?? null,
    email: null,
    createdAt: extra.created_at,
  };
};

/**
 * 매치 하나에서 볼 사람: 승인된 멤버와 **그 매치의** 그날 용병. 미투표자, "투표 없이 온 사람"
 * 후보, 득점자 고르기가 쓴다. 매치를 주지 않으면 그날 용병은 모두 뺀다.
 */
export const regularMembers = <T extends Pick<AdminMember, "status" | "guestMatchId">>(
  members: readonly T[],
  matchId?: string,
): T[] =>
  members.filter(
    (member) => member.status === "approved" && (member.guestMatchId === null || member.guestMatchId === matchId),
  );

export type AdminMemberGroups = {
  pending: AdminMember[];
  approved: AdminMember[];
  inactive: AdminMember[];
  rejected: AdminMember[];
};

const byName = (a: AdminMember, b: AdminMember) => a.realName.localeCompare(b.realName, "ko");

/**
 * 상태별로 나눈다. 가입 신청은 먼저 온 순서, 멤버는 관리자 먼저·이름순이다.
 * 그날 용병은 넣지 않는다 — 계정이 없고 그 매치 화면에서만 다룬다.
 */
export const groupForAdmin = (members: readonly AdminMember[]): AdminMemberGroups => {
  const pick = (status: Member["status"]) =>
    members.filter((member) => member.status === status && member.guestMatchId === null);
  return {
    pending: pick("pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    approved: pick("approved").sort(
      (a, b) => Number(b.role === "admin") - Number(a.role === "admin") || byName(a, b),
    ),
    inactive: pick("inactive").sort(byName),
    rejected: pick("rejected").sort(byName),
  };
};
