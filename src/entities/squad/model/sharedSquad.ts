import { z } from "zod";
import { POSITION_CODES } from "@/entities/position";
import type { SavedQuarter } from "./savedSquad";

/**
 * 공유 링크(/s/[token])로 보는 스쿼드. `shared_squad` RPC 가 준다.
 * 사람은 실명과, 매치마다 다른 가짜 키(memberId 자리)로만 나온다 — 멤버 id·멤버/용병 구분은 없다.
 */
export type SharedSquad = {
  matchId: string;
  match: {
    date: string;
    startsAt: string;
    endsAt: string;
    quarterCount: number;
    venue: string | null;
    opponent: string | null;
  };
  quarters: SavedQuarter[];
};

const time = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/)
  .transform((value) => value.slice(0, 5));

const schema = z.object({
  match_id: z.string(),
  match_date: z.string(),
  starts_at: time,
  ends_at: time,
  quarter_count: z.number().int(),
  venue: z.string().nullable(),
  opponent: z.string().nullable(),
  quarters: z.array(
    z.object({
      number: z.number().int(),
      formation_name: z.string(),
      slots: z.array(
        z.object({
          slot_index: z.number().int(),
          position: z.enum(POSITION_CODES),
          x: z.number(),
          y: z.number(),
          member_key: z.string().nullable(),
          name: z.string().nullable(),
          jersey_number: z.number().int().nullable().default(null),
        }),
      ),
    }),
  ),
});

/** 공개 전이거나 틀린 토큰이면 RPC 가 null 을 준다. */
export const toSharedSquad = (json: unknown): SharedSquad | null => {
  if (json === null) return null;
  const parsed = schema.parse(json);
  return {
    matchId: parsed.match_id,
    match: {
      date: parsed.match_date,
      startsAt: parsed.starts_at,
      endsAt: parsed.ends_at,
      quarterCount: parsed.quarter_count,
      venue: parsed.venue,
      opponent: parsed.opponent,
    },
    quarters: parsed.quarters.map((quarter) => ({
      number: quarter.number,
      formationName: quarter.formation_name,
      slots: quarter.slots.map((slot) => ({
        slotIndex: slot.slot_index,
        position: slot.position,
        x: slot.x,
        y: slot.y,
        memberId: slot.member_key,
        memberName: slot.name,
        jerseyNumber: slot.jersey_number,
      })),
    })),
  };
};

/** 한 쿼터라도 뛰는 사람 수 */
export const countPlayers = (quarters: readonly SavedQuarter[]) =>
  new Set(quarters.flatMap((quarter) => quarter.slots.flatMap((slot) => (slot.memberId ? [slot.memberId] : [])))).size;
