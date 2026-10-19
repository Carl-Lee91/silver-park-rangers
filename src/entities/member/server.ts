import { createSupabaseServerClient, getAuthUserId } from "@/shared/api";
import { insertMember, selectGateAccess, type NewMember } from "./api/queries";
import { ADMIN_MEMBER_COLUMNS, toAdminMember, type AdminMember } from "./model/adminMember";
import { gateOf, type Gate } from "./model/gate";
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
 * 관리 화면의 멤버 전체(멤버/용병 구분 포함). 관리자 이상만 부른다 —
 * 그 밖의 사람이 부르면 RLS 때문에 구분이 비어 오고, 다른 멤버도 보이지 않는다.
 */
export const fetchAdminMembers = async (): Promise<AdminMember[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("members").select(ADMIN_MEMBER_COLUMNS);
  if (error) throw new Error(`멤버 목록을 읽지 못했습니다 — ${error.message}`);
  return data.map(toAdminMember);
};

/** 지금 로그인한 사람의 멤버 행을 만든다(온보딩). 로그인하지 않았으면 false. */
export const createMyMember = async (input: NewMember): Promise<boolean> => {
  const userId = await getAuthUserId();
  if (userId === null) return false;
  return insertMember(await createSupabaseServerClient(), userId, input);
};
