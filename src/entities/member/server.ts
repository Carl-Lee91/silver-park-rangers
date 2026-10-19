import { createSupabaseServerClient, getAuthUserId } from "@/shared/api";
import { insertMember, type NewMember } from "./api/queries";
import { MEMBER_COLUMNS, toMember, type Member } from "./model/member";

/** 지금 로그인한 사람의 멤버 정보. 로그인 안 했거나 온보딩 전이면 null. */
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

/** 지금 로그인한 사람의 멤버 행을 만든다(온보딩). 로그인하지 않았으면 false. */
export const createMyMember = async (input: NewMember): Promise<boolean> => {
  const userId = await getAuthUserId();
  if (userId === null) return false;
  return insertMember(await createSupabaseServerClient(), userId, input);
};
