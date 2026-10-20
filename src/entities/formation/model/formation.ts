import { z } from "zod";
import { POSITION_CODES, type Position } from "@/entities/position";

/** x·y 는 경기장 안 위치(0~100). y=0 이 상대 골문, y=100 이 우리 골문이다. */
export type FormationSlot = { position: Position; x: number; y: number };

export type Formation = {
  id: string;
  name: string;
  /** 4-3-3 · 4-4-2. 고치거나 지울 수 없다 */
  isPreset: boolean;
  slots: FormationSlot[];
};

export const FORMATION_COLUMNS = "id, name, is_preset, slots";

const coordinate = z.number().min(0).max(100);
const slotSchema = z.object({ position: z.enum(POSITION_CODES), x: coordinate, y: coordinate });

const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_preset: z.boolean(),
  // slots 는 jsonb 라 DB 가 모양을 지키지 않는다. 여기서 확인한다.
  slots: z.array(slotSchema),
});

export const toFormation = (row: unknown): Formation => {
  const parsed = rowSchema.parse(row);
  return { id: parsed.id, name: parsed.name, isPreset: parsed.is_preset, slots: parsed.slots };
};

/** 첫 GK 슬롯이 키퍼 자리다. 없으면 -1. 키퍼로 뛴 쿼터는 출전으로 세지 않는다(PLAN.md §6). */
export const keeperSlotIndex = (slots: readonly { position: Position }[]) =>
  slots.findIndex((slot) => slot.position === "GK");
