import { createSupabaseServerClient } from "@/shared/api";
import { RATING_COLUMNS, toRatings, toRatingsByMember, type MemberRatings, type RatingValues } from "./model/rating";

/** 선수 한 명의 능력치. 관리자가 아니면 RLS 때문에 빈 값(매기지 않음)으로 온다 */
export const fetchMemberRatings = async (memberId: string): Promise<MemberRatings> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("member_ratings").select(RATING_COLUMNS).eq("member_id", memberId).maybeSingle();
  if (error) throw new Error(`능력치를 읽지 못했습니다 — ${error.message}`);
  return toRatings(data);
};

/** 모든 선수의 능력치(선수 id → 항목별 값). 매기지 않은 선수는 들어 있지 않다. 관리자만 읽는다(RLS) */
export const fetchAllRatings = async (): Promise<Record<string, RatingValues>> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("member_ratings").select(RATING_COLUMNS);
  if (error) throw new Error(`능력치를 읽지 못했습니다 — ${error.message}`);
  return toRatingsByMember(data);
};
