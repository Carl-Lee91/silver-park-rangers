import { z } from "zod";
import { MEMBER_COLUMNS, toMember, type Member } from "./member";

export type MemberType = "member" | "guest";

/** 관리 화면이 보는 멤버. 멤버/용병 구분은 관리자 이상만 읽을 수 있다(RLS). */
export type AdminMember = Member & {
  /** 가입 대기·거절이면 아직 정하지 않아 null */
  memberType: MemberType | null;
  createdAt: string;
};

export const ADMIN_MEMBER_COLUMNS = `${MEMBER_COLUMNS}, created_at, member_admin_info(member_type)`;

const adminInfo = z.object({ member_type: z.enum(["member", "guest"]) });
const extraSchema = z.object({
  created_at: z.string(),
  // 1:1 관계라 객체로 오지만, 관계를 못 알아보면 배열로 온다. 둘 다 받는다.
  member_admin_info: z.union([adminInfo, z.array(adminInfo)]).nullable(),
});

export const toAdminMember = (row: unknown): AdminMember => {
  const extra = extraSchema.parse(row);
  const info = Array.isArray(extra.member_admin_info)
    ? (extra.member_admin_info[0] ?? null)
    : extra.member_admin_info;
  return { ...toMember(row), memberType: info?.member_type ?? null, createdAt: extra.created_at };
};

export type AdminMemberGroups = {
  pending: AdminMember[];
  approved: AdminMember[];
  inactive: AdminMember[];
  rejected: AdminMember[];
};

const byName = (a: AdminMember, b: AdminMember) => a.realName.localeCompare(b.realName, "ko");

/** 상태별로 나눈다. 가입 신청은 먼저 온 순서, 멤버는 관리자 먼저·이름순이다. */
export const groupForAdmin = (members: readonly AdminMember[]): AdminMemberGroups => {
  const pick = (status: Member["status"]) => members.filter((member) => member.status === status);
  return {
    pending: pick("pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    approved: pick("approved").sort(
      (a, b) => Number(b.role === "admin") - Number(a.role === "admin") || byName(a, b),
    ),
    inactive: pick("inactive").sort(byName),
    rejected: pick("rejected").sort(byName),
  };
};
