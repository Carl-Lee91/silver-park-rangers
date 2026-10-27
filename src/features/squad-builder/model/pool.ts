import type { Attendance, AttendanceResponse } from "@/entities/attendance";
import { availableQuarters, type QuarterTime } from "@/entities/match";
import type { AdminMember, Foot, MemberType } from "@/entities/member";
import type { Position } from "@/entities/position";
import { preferenceScore, type SquadPlayer } from "@/entities/squad";
import type { Builder } from "./builder";

/** 빌더 벤치에 오르는 사람 */
export type BuilderPlayer = {
  id: string;
  realName: string;
  /** 관리자만 보는 구분(용병 표시) */
  memberType: MemberType | null;
  jerseyNumber: number | null;
  preferredPositions: Position[];
  feet: Foot[];
  /** 저장된 스쿼드에 있는데 투표를 바꾼 사람은 no·null 일 수 있다 */
  response: AttendanceResponse | null;
  arriveAt: string | null;
  leaveAt: string | null;
  availableQuarters: number[];
};

/**
 * 후보 명단. 참석·미정으로 투표한 사람이고, 참석이 먼저다.
 * 저장된 스쿼드에 이미 있는 사람은 투표를 바꿨어도 남긴다 — 빼야 한다는 걸 보여야 하니까.
 */
export const buildPool = (
  attendance: readonly Attendance[],
  members: readonly AdminMember[],
  schedule: readonly QuarterTime[],
  placed: ReadonlySet<string>,
): BuilderPlayer[] => {
  const byId = new Map(members.map((member) => [member.id, member]));
  const rank = (response: AttendanceResponse | null) => (response === "yes" ? 0 : response === "maybe" ? 1 : 2);

  return attendance
    .filter((row) => row.response === "yes" || row.response === "maybe" || placed.has(row.memberId))
    .flatMap((row) => {
      const member = byId.get(row.memberId);
      if (member === undefined) return [];
      return [
        {
          id: member.id,
          realName: member.realName,
          memberType: member.memberType,
          jerseyNumber: member.jerseyNumber,
          preferredPositions: member.preferredPositions,
          feet: member.feet,
          response: row.response,
          arriveAt: row.arriveAt,
          leaveAt: row.leaveAt,
          availableQuarters: availableQuarters(schedule, row),
        },
      ];
    })
    .sort((a, b) => rank(a.response) - rank(b.response) || a.realName.localeCompare(b.realName, "ko"));
};

const placedAnywhere = (builder: Builder) =>
  new Set(builder.flatMap((quarter) => quarter.slots.flatMap((slot) => (slot.memberId ? [slot.memberId] : []))));

/**
 * 자동 배치·점검에 넘길 선수. 참석한 사람과, 미정이어도 관리자가 직접 넣은 사람이다.
 * 자동 배치는 미정인 사람을 스스로 넣지 않는다.
 */
export const squadPlayersFor = (
  pool: readonly BuilderPlayer[],
  builder: Builder,
  /** 선수 전력(관리자 전용 능력치). 없는 사람은 null — 자동 배치 스타일이 평균으로 본다 */
  strengths: Readonly<Record<string, number | null>> = {},
): SquadPlayer[] => {
  const placed = placedAnywhere(builder);
  return pool
    .filter((player) => player.response === "yes" || placed.has(player.id))
    .map(({ id, preferredPositions, availableQuarters: quarters }) => ({
      id,
      preferredPositions,
      availableQuarters: quarters,
      strength: strengths[id] ?? null,
    }));
};

/**
 * 같은 등번호를 쓰는 사람(참석했거나 스쿼드에 든 사람만). 멤버끼리는 DB 가 막지만
 * 그날 용병은 멤버 번호와 겹칠 수 있다(PLAN.md §4).
 */
const duplicateNumbers = (pool: readonly BuilderPlayer[], placed: ReadonlySet<string>): string[] => {
  const byNumber = new Map<number, string[]>();
  for (const player of pool) {
    if (player.jerseyNumber === null || !(player.response === "yes" || placed.has(player.id))) continue;
    byNumber.set(player.jerseyNumber, [...(byNumber.get(player.jerseyNumber) ?? []), player.realName]);
  }
  return [...byNumber]
    .filter(([, names]) => names.length > 1)
    .sort(([a], [b]) => a - b)
    .map(([number, names]) => `${number}번을 ${names.join("·")}님이 같이 써요.`);
};

/** 자동 배치·점검이 못 보는 문제: 불참으로 바꾼 사람, 못 오는 쿼터에 들어간 사람, 겹친 등번호 */
export const placementIssues = (pool: readonly BuilderPlayer[], builder: Builder): string[] => {
  const issues: string[] = [];
  const placed = placedAnywhere(builder);
  for (const player of pool) {
    if (placed.has(player.id) && player.response === "no") issues.push(`${player.realName}님은 불참으로 바꿨어요.`);
  }
  builder.forEach((quarter, index) => {
    for (const slot of quarter.slots) {
      const player = pool.find((candidate) => candidate.id === slot.memberId);
      if (player && player.response !== "no" && !player.availableQuarters.includes(index)) {
        issues.push(`${player.realName}님은 ${index + 1}쿼터에 못 와요.`);
      }
    }
  });
  return [...issues, ...duplicateNumbers(pool, placed)];
};

/**
 * 고른 자리를 선호 순위가 높은 사람부터 놓는다. 풋볼매니저가 자리를 고르면 맞는 선수를 위로 올리듯.
 * 순위가 같으면 원래 순서이고, 고른 자리가 없으면 그대로다.
 */
export const sortByFit = <T extends { preferredPositions: readonly Position[] }>(
  players: readonly T[],
  position: Position | null,
): T[] =>
  position === null
    ? [...players]
    : [...players].sort((a, b) => preferenceScore(b, position) - preferenceScore(a, position));
