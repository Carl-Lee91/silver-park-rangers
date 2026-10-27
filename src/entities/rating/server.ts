import { createSupabaseServerClient } from "@/shared/api";
import { RATING_COLUMNS, toRatings, type MemberRatings } from "./model/rating";

/** 선수 한 명의 능력치. 관리자가 아니면 RLS 때문에 빈 값(매기지 않음)으로 온다 */
export const fetchMemberRatings = async (memberId: string): Promise<MemberRatings> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("member_ratings").select(RATING_COLUMNS).eq("member_id", memberId).maybeSingle();
  if (error) throw new Error(`능력치를 읽지 못했습니다 — ${error.message}`);
  return toRatings(data);
};
