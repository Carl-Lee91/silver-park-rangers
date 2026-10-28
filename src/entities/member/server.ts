import { z } from "zod";
import { createSupabaseServerClient, getAuthUserId } from "@/shared/api";
import { insertMember, selectGateAccess, type InsertMemberResult, type NewMember } from "./api/queries";
import { ADMIN_MEMBER_COLUMNS, attachLogins, toAdminMember, type AdminMember } from "./model/adminMember";
import { gateOf, type Gate } from "./model/gate";
import { toLinkMember, type LinkMember } from "./model/linkMember";
import { MEMBER_COLUMNS, toMember, type Member } from "./model/member";

/** 지금 로그인한 사람의 멤버 정보. 로그인 안 했거나 온보딩 전(또는 어드민 계정)이면 null. */
export const fetchMyMember = async (): Promise<Member | null> => {
  const userId = await getAuthUserId();
  if (userId === null) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`멤버 정보를 읽지 못했습니다 — ${error.message}`);
  return data === null ? null : toMember(data);
};

/** 지금 사람의 게이트 상태. 화면이 어떤 단추를 보일지 정할 때 쓴다(`permissions`). */
export const fetchMyGate = async (): Promise<Gate> => {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthUserId();
  if (userId === null) return "signed-out";
  const result = await selectGateAccess(supabase);
  if (!result.ok) throw new Error("접근 권한을 읽지 못했습니다");
  return gateOf(true, result.access);
};

/**
 * 선수 정보 ! 단추에 쓰는 프로필(등번호 · 선호 포지션 · 주발). 승인된 팀원은 승인된 사람 것만 읽는다(RLS) —
 * 휴면 등으로 못 읽는 사람은 빠진다. 멤버/용병 구분은 다른 표라서 여기 없다.
 */
export const fetchMemberProfiles = async (ids: readonly string[]): Promise<Member[]> => {
  if (ids.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("members").select(MEMBER_COLUMNS).in("id", [...ids]);
  if (error) throw new Error(`선수 정보를 읽지 못했습니다 — ${error.message}`);
  return (data as unknown[]).map(toMember);
};

const loginRows = z.array(
  z.object({ member_id: z.string(), email: z.string().nullable(), via_link: z.boolean().default(false) }),
);

/**
 * 관리 화면의 멤버 전체(멤버/용병 구분·그날 용병·로그인 방법과 이메일 포함). 관리자 이상만 부른다 —
 * 그 밖의 사람이 부르면 RLS 때문에 구분이 비어 오고, 이메일 함수는 거부한다.
 */
export const fetchAdminMembers = async (): Promise<AdminMember[]> => {
  const supabase = await createSupabaseServerClient();
  const [members, emails] = await Promise.all([
    supabase.from("members").select(ADMIN_MEMBER_COLUMNS),
    supabase.rpc("member_emails"),
  ]);
  if (members.error) throw new Error(`멤버 목록을 읽지 못했습니다 — ${members.error.message}`);
  if (emails.error) throw new Error(`이메일을 읽지 못했습니다 — ${emails.error.message}`);

  return attachLogins(members.data.map(toAdminMember), loginRows.parse(emails.data));
};

/**
 * 개인 링크의 주인(PLAN.md §4). 로그인 전에도 부른다 — 맞는 링크면 이름 · 등번호만 준다(`link_member`).
 * 링크 모양이 아니거나 맞는 사람이 없으면(새 링크로 바뀜 · 휴면) null.
 */
export const fetchLinkMember = async (token: string): Promise<LinkMember | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("link_member", { link_token: token }).maybeSingle();
  if (error) {
    // 링크 모양(uuid)이 아니면 DB 가 22P02 로 거부한다. 틀린 링크와 같다.
    if (error.code === "22P02") return null;
    throw new Error(`링크를 확인하지 못했습니다 — ${error.message}`);
  }
  return toLinkMember(data);
};

/** 그 사람의 개인 링크 토큰(관리자만 읽는다, RLS). 아직 만들지 않았으면 null */
export const fetchMemberLinkToken = async (memberId: string): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("member_links").select("token").eq("member_id", memberId).maybeSingle();
  if (error) throw new Error(`개인 링크를 읽지 못했습니다 — ${error.message}`);
  return data === null ? null : String(data.token);
};

/** 지금 로그인한 사람의 멤버 행을 만든다(온보딩). 로그인하지 않았으면 실패. */
export const createMyMember = async (input: NewMember): Promise<InsertMemberResult> => {
  const userId = await getAuthUserId();
  if (userId === null) return { ok: false, reason: "failed" };
  return insertMember(await createSupabaseServerClient(), userId, input);
};

/**
 * 다른 사람이 이미 쓰는 등번호(내 번호와 그날 용병 번호는 빼고). 로그인 전(가입 신청)에도 부른다 —
 * RLS 로는 다른 사람 행을 못 보므로 번호만 주는 함수로 읽는다. 겹치면 DB 가 막는다.
 */
export const fetchTakenJerseyNumbers = async (): Promise<number[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("taken_jersey_numbers");
  if (error) throw new Error(`등번호를 읽지 못했습니다 — ${error.message}`);
  return z.array(z.number().int()).parse(data);
};
