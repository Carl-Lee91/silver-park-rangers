import { createSupabaseServerClient, getAuthUserId } from "@/shared/api";
import { ATTENDANCE_COLUMNS, toAttendance, type Attendance, type AttendanceResponse } from "./model/attendance";

export const fetchMatchAttendance = async (matchId: string): Promise<Attendance[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("match_attendance")
    .select(ATTENDANCE_COLUMNS)
    .eq("match_id", matchId);
  if (error) throw new Error(`참석 명단을 읽지 못했습니다 — ${error.message}`);
  return data.map(toAttendance);
};

/** 매치별 내 응답. 투표하지 않은 매치는 들어 있지 않다. */
export const fetchMyResponses = async (
  matchIds: readonly string[],
): Promise<Record<string, AttendanceResponse>> => {
  const userId = await getAuthUserId();
  if (userId === null || matchIds.length === 0) return {};

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("match_attendance")
    .select("match_id, response")
    .eq("member_id", userId)
    .in("match_id", [...matchIds]);
  if (error) throw new Error(`내 투표를 읽지 못했습니다 — ${error.message}`);

  const responses: Record<string, AttendanceResponse> = {};
  for (const row of data as { match_id: string; response: AttendanceResponse | null }[]) {
    if (row.response !== null) responses[row.match_id] = row.response;
  }
  return responses;
};

/** 이 매치의 내 투표. 아직 안 했으면 null. */
export const fetchMyAttendance = async (matchId: string): Promise<Attendance | null> => {
  const userId = await getAuthUserId();
  if (userId === null) return null;
  const all = await fetchMatchAttendance(matchId);
  return all.find((row) => row.memberId === userId) ?? null;
};
