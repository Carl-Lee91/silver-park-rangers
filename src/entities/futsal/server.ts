import { createSupabaseServerClient } from "@/shared/api";
import { toSharedTeams, toTeamAssignments, toTeamLists, type SharedTeams, type TeamMember } from "./model/roster";

/** 관리자 화면: 저장된 팀(선수 id → 팀 번호) */
export const fetchTeamAssignments = async (matchId: string): Promise<Record<string, number>> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("futsal_team_members").select("member_id, team_number").eq("match_id", matchId);
  if (error) throw new Error(`풋살 팀을 읽지 못했습니다 — ${error.message}`);
  return toTeamAssignments(data);
};

/** 팀원 화면: 팀마다 이름 · 등번호. 공개 전이면 RLS 때문에 빈 팀이 온다 */
export const fetchTeamLists = async (matchId: string, teamCount: number): Promise<TeamMember[][]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("futsal_team_members")
    .select("team_number, members(real_name, jersey_number)")
    .eq("match_id", matchId);
  if (error) throw new Error(`풋살 팀을 읽지 못했습니다 — ${error.message}`);
  return toTeamLists(data, teamCount);
};

/** 공유 링크: 공개된 풋살 매치의 팀 명단(로그인 없이). 공개 전이거나 풋살이 아니면 null */
export const fetchSharedTeams = async (token: string): Promise<SharedTeams | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("shared_teams", { token });
  if (error) throw new Error(`공유 팀을 읽지 못했습니다 — ${error.message}`);
  return toSharedTeams(data);
};

/** 팀을 저장한 풋살 매치 id(관리 › 스쿼드 목록의 상태) */
export const fetchTeamMatchIds = async (matchIds: readonly string[]): Promise<Set<string>> => {
  if (matchIds.length === 0) return new Set();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("futsal_team_members").select("match_id").in("match_id", [...matchIds]);
  if (error) throw new Error(`풋살 팀을 읽지 못했습니다 — ${error.message}`);
  return new Set((data as { match_id: string }[]).map((row) => row.match_id));
};
