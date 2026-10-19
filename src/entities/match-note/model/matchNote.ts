import { z } from "zod";

/** 멤버 id → 이 매치의 특이사항. 관리자 이상만 읽을 수 있다(RLS). */
export type MatchNotes = Record<string, string>;

const rowsSchema = z.array(z.object({ member_id: z.string(), note: z.string() }));

export const toMatchNotes = (rows: unknown): MatchNotes =>
  Object.fromEntries(rowsSchema.parse(rows).map((row) => [row.member_id, row.note]));
