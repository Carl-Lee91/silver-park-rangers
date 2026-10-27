import { z } from "zod";
import type { MatchFormat } from "@/entities/match";

type FutsalFormat = Exclude<MatchFormat, "football">;

/**
 * 팀원 · 공유 링크에 보이는 사람: 이름 · 등번호만(능력치 · 용병 구분 없음). 선수 id 는 팀원 화면의 ! 단추에 쓰고,
 * 공유 링크는 멤버 id 를 주지 않아서 null 이다.
 */
export type TeamMember = { id: string | null; name: string; jerseyNumber: number | null };

const byNumberThenName = (a: TeamMember, b: TeamMember) =>
  (a.jerseyNumber ?? Number.MAX_SAFE_INTEGER) - (b.jerseyNumber ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "ko");

/** 관리자 화면: 선수 id → 팀 번호(1부터) */
export const toTeamAssignments = (rows: unknown): Record<string, number> =>
  Object.fromEntries(
    z
      .array(z.object({ member_id: z.string(), team_number: z.number().int() }))
      .parse(rows)
      .map((row) => [row.member_id, row.team_number]),
  );

const person = z.object({ real_name: z.string(), jersey_number: z.number().int().nullable() });

/** 팀원 화면: 팀마다 이름 · 등번호(등번호 순, 없으면 뒤에 이름순) */
export const toTeamLists = (rows: unknown, teamCount: number): TeamMember[][] => {
  const teams: TeamMember[][] = Array.from({ length: teamCount }, () => []);
  const schema = z.array(
    z.object({ member_id: z.string(), team_number: z.number().int(), members: z.union([person, z.array(person)]) }),
  );
  for (const row of schema.parse(rows)) {
    const member = Array.isArray(row.members) ? row.members[0] : row.members;
    if (member && row.team_number >= 1 && row.team_number <= teamCount) {
      teams[row.team_number - 1].push({ id: row.member_id, name: member.real_name, jerseyNumber: member.jersey_number });
    }
  }
  return teams.map((team) => team.sort(byNumberThenName));
};

const time = z.string().transform((value) => value.slice(0, 5));
/** 풋살 종류(공유 링크는 풋살 매치만 준다). 엔티티끼리는 값을 가져오지 않아 여기 적고, 타입으로 매치 종류와 같은지 확인한다 */
const FORMATS = ["futsal5", "futsal6"] as const satisfies readonly FutsalFormat[];
const sharedSchema = z.object({
  match_id: z.string(),
  match_date: z.string(),
  starts_at: time,
  ends_at: time,
  venue: z.string().nullable(),
  opponent: z.string().nullable(),
  format: z.enum(FORMATS),
  team_count: z.number().int(),
  members: z.array(z.object({ team_number: z.number().int(), name: z.string(), jersey_number: z.number().int().nullable() })),
});

export type SharedTeams = {
  /** 팀원이 로그인해서 투표하러 갈 매치 */
  matchId: string;
  match: { date: string; startsAt: string; endsAt: string; venue: string | null; opponent: string | null; format: FutsalFormat };
  teams: TeamMember[][];
};

/** 공유 링크(`shared_teams`): 공개된 풋살 매치의 정보와 팀 명단. 공개 전이거나 풋살이 아니면 null */
export const toSharedTeams = (json: unknown): SharedTeams | null => {
  if (json === null || json === undefined) return null;
  const parsed = sharedSchema.parse(json);
  const teams: TeamMember[][] = Array.from({ length: parsed.team_count }, () => []);
  for (const member of parsed.members) {
    if (member.team_number >= 1 && member.team_number <= parsed.team_count) {
      teams[member.team_number - 1].push({ id: null, name: member.name, jerseyNumber: member.jersey_number });
    }
  }
  return {
    matchId: parsed.match_id,
    match: {
      date: parsed.match_date,
      startsAt: parsed.starts_at,
      endsAt: parsed.ends_at,
      venue: parsed.venue,
      opponent: parsed.opponent,
      format: parsed.format,
    },
    teams: teams.map((team) => team.sort(byNumberThenName)),
  };
};
