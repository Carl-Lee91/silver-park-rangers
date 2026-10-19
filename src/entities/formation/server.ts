import { createSupabaseServerClient } from "@/shared/api";
import { FORMATION_COLUMNS, toFormation, type Formation } from "./model/formation";

/** 기본 포메이션(4-3-3, 4-4-2)이 먼저, 그다음 커스텀을 이름순으로 */
export const fetchFormations = async (): Promise<Formation[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("formations")
    .select(FORMATION_COLUMNS)
    .order("is_preset", { ascending: false })
    .order("name");
  if (error) throw new Error(`포메이션을 읽지 못했습니다 — ${error.message}`);
  return data.map(toFormation);
};
