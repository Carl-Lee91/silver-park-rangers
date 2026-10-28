import { z } from "zod";

/** 금액 설정(PLAN.md §10). 0 이면 그 항목은 받지 않는다 */
export type DuesSettings = { monthlyFee: number; matchFee: number; noShowFine: number };

const rowSchema = z.object({ monthly_fee: z.number().int(), match_fee: z.number().int(), no_show_fine: z.number().int() });

export const SETTINGS_COLUMNS = "monthly_fee, match_fee, no_show_fine";

export const toDuesSettings = (row: unknown): DuesSettings => {
  const parsed = rowSchema.parse(row);
  return { monthlyFee: parsed.monthly_fee, matchFee: parsed.match_fee, noShowFine: parsed.no_show_fine };
};
