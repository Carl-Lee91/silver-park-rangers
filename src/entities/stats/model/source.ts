import { z } from "zod";
import type { AttendanceResponse } from "@/entities/attendance";
import { POSITION_CODES, type Position } from "@/entities/position";

export type StatsMatch = {
  id: string;
  date: string;
  opponent: string | null;
  /** 실제 출석을 한 사람이라도 정했는지. 정하지 않은 매치는 참석률에 넣지 않는다 */
  confirmed: boolean;
  hasSquad: boolean;
  /** 결과를 남긴 쿼터의 점수(우리 = 골 기록 수) */
  quarterScores: { number: number; ours: number; theirs: number }[];
};

export type StatsMember = {
  id: string;
  realName: string;
  status: "approved" | "inactive";
  memberType: "member" | "guest";
  preferredPositions: Position[];
  /** 승인된 날(없으면 가입 신청한 날). 이 전 매치는 세지 않는다 */
  joinedOn: string;
};

export type StatsEntry = {
  matchId: string;
  memberId: string;
  response: AttendanceResponse | null;
  attended: boolean | null;
  fieldQuarters: number;
  keeperQuarters: number;
  /** 필드로 뛴 쿼터의 포지션(쿼터마다 하나) */
  positions: Position[];
  goals: number;
  assists: number;
};

export type StatsSource = { matches: StatsMatch[]; members: StatsMember[]; entries: StatsEntry[] };

const schema = z.object({
  matches: z.array(
    z.object({
      id: z.string(),
      match_date: z.string(),
      opponent: z.string().nullable(),
      confirmed: z.boolean(),
      has_squad: z.boolean(),
      quarter_scores: z.array(z.object({ number: z.number().int(), ours: z.number().int(), theirs: z.number().int() })).default([]),
    }),
  ),
  members: z.array(
    z.object({
      id: z.string(),
      real_name: z.string(),
      status: z.enum(["approved", "inactive"]),
      member_type: z.enum(["member", "guest"]),
      preferred_positions: z.array(z.enum(POSITION_CODES)),
      joined_on: z.string(),
    }),
  ),
  entries: z.array(
    z.object({
      match_id: z.string(),
      member_id: z.string(),
      response: z.enum(["yes", "no", "maybe"]).nullable(),
      attended: z.boolean().nullable(),
      field_quarters: z.number().int(),
      keeper_quarters: z.number().int(),
      positions: z.array(z.enum(POSITION_CODES)),
      goals: z.number().int().default(0),
      assists: z.number().int().default(0),
    }),
  ),
});

/** `admin_stats_source` RPC 가 준 값을 읽는다. */
export const toStatsSource = (json: unknown): StatsSource => {
  const parsed = schema.parse(json);
  return {
    matches: parsed.matches.map((row) => ({
      id: row.id,
      date: row.match_date,
      opponent: row.opponent,
      confirmed: row.confirmed,
      hasSquad: row.has_squad,
      quarterScores: row.quarter_scores,
    })),
    members: parsed.members.map((row) => ({
      id: row.id,
      realName: row.real_name,
      status: row.status,
      memberType: row.member_type,
      preferredPositions: row.preferred_positions,
      joinedOn: row.joined_on,
    })),
    entries: parsed.entries.map((row) => ({
      matchId: row.match_id,
      memberId: row.member_id,
      response: row.response,
      attended: row.attended,
      fieldQuarters: row.field_quarters,
      keeperQuarters: row.keeper_quarters,
      positions: row.positions,
      goals: row.goals,
      assists: row.assists,
    })),
  };
};
