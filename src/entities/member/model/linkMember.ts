import { z } from "zod";

/** 개인 링크의 주인(PLAN.md §4). 링크 화면이 "홍길동님으로 들어가기"에 쓴다 */
export type LinkMember = { id: string; realName: string; jerseyNumber: number | null };

const rowSchema = z.object({ id: z.string(), real_name: z.string(), jersey_number: z.number().int().nullable() });

/** `link_member` 의 결과. 맞는 링크가 없으면(지웠거나 휴면) null 이다 */
export const toLinkMember = (row: unknown): LinkMember | null => {
  if (row === null) return null;
  const parsed = rowSchema.parse(row);
  return { id: parsed.id, realName: parsed.real_name, jerseyNumber: parsed.jersey_number };
};
