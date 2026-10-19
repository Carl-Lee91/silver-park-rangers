import type { DbClient } from "@/shared/api";
import type { Foot } from "../model/member";
import type { GateMember } from "../model/gate";
import type { Position } from "@/entities/position";

/**
 * 게이트 판단에 필요한 것만 읽는다. proxy 가 요청마다 부르므로 가볍게 둔다.
 * 읽지 못하면 `ok: false` — 그때 proxy 는 막지도 보내지도 않는다(데이터는 RLS 가 지킨다).
 */
export const selectGateMember = async (
  client: DbClient,
  userId: string,
): Promise<{ ok: true; member: GateMember | null } | { ok: false }> => {
  const { data, error } = await client
    .from("members")
    .select("status, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) return { ok: false };
  return { ok: true, member: data as GateMember | null };
};

export type NewMember = {
  realName: string;
  feet: Foot[];
  preferredPositions: Position[];
};

/**
 * 온보딩. 역할·상태는 보내지 않는다 — DB 기본값(일반·승인 대기)이 들어가고,
 * 다른 값을 보내면 RLS 가 거부한다. 카카오 닉네임·사진은 DB 트리거가 채운다.
 *
 * 두 번 눌러 이미 행이 있으면(23505) 성공으로 본다.
 */
export const insertMember = async (client: DbClient, userId: string, input: NewMember) => {
  const { error } = await client.from("members").insert({
    id: userId,
    real_name: input.realName,
    feet: input.feet,
    preferred_positions: input.preferredPositions,
  });
  return error === null || error.code === "23505";
};
