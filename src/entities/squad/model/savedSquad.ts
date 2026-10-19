import { z } from "zod";
import { POSITION_CODES, type Position } from "@/entities/position";

export type SavedSlot = {
  slotIndex: number;
  position: Position;
  x: number;
  y: number;
  memberId: string | null;
  /** 볼 수 없는 멤버(휴면 등)거나 빈자리면 null */
  memberName: string | null;
  /** 등번호. 없으면 null */
  jerseyNumber: number | null;
};

export type SavedQuarter = { number: number; formationName: string; slots: SavedSlot[] };

export const SQUAD_COLUMNS =
  "number, formation_name, quarter_slots(slot_index, position, x, y, member_id, members(real_name, jersey_number))";

const name = z.object({ real_name: z.string(), jersey_number: z.number().int().nullable().default(null) });
const slotSchema = z.object({
  slot_index: z.number().int(),
  position: z.enum(POSITION_CODES),
  x: z.number(),
  y: z.number(),
  member_id: z.string().nullable(),
  members: z.union([name, z.array(name)]).nullable(),
});
const quarterSchema = z.object({
  number: z.number().int(),
  formation_name: z.string(),
  quarter_slots: z.array(slotSchema),
});

/** 쿼터 번호 순, 슬롯 번호 순으로 정리한다. */
export const toSavedQuarters = (rows: unknown): SavedQuarter[] =>
  z
    .array(quarterSchema)
    .parse(rows)
    .map((quarter) => ({
      number: quarter.number,
      formationName: quarter.formation_name,
      slots: quarter.quarter_slots
        .map((slot) => {
          const member = Array.isArray(slot.members) ? (slot.members[0] ?? null) : slot.members;
          return {
            slotIndex: slot.slot_index,
            position: slot.position,
            x: slot.x,
            y: slot.y,
            memberId: slot.member_id,
            memberName: member?.real_name ?? null,
            jerseyNumber: member?.jersey_number ?? null,
          };
        })
        .sort((a, b) => a.slotIndex - b.slotIndex),
    }))
    .sort((a, b) => a.number - b.number);
