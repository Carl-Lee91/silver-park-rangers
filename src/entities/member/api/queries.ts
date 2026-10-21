import type { DbClient } from "@/shared/api";
import type { Position } from "@/entities/position";
import type { GateAccess } from "../model/gate";
import type { Foot, MemberRole, MemberStatus } from "../model/member";

type AccessRow = { status: MemberStatus | null; role: MemberRole | null; is_owner: boolean };

/**
 * 게이트 판단에 필요한 것(멤버 상태·역할, 어드민 계정 여부)을 한 번에 읽는다.
 * proxy 가 요청마다 부르므로 RPC 하나로 끝낸다(`my_access`).
 * 읽지 못하면 `ok: false` — 그때 proxy 는 막지도 보내지도 않는다(데이터는 RLS 가 지킨다).
 */
export const selectGateAccess = async (
  client: DbClient,
): Promise<{ ok: true; access: GateAccess } | { ok: false }> => {
  const { data, error } = await client.rpc("my_access").single<AccessRow>();
  if (error || data === null) return { ok: false };
  return {
    ok: true,
    access: {
      member: data.status === null || data.role === null ? null : { status: data.status, role: data.role },
      isOwner: data.is_owner,
    },
  };
};

export type NewMember = {
  realName: string;
  feet: Foot[];
  preferredPositions: Position[];
  jerseyNumber: number | null;
};

export type InsertMemberResult = { ok: true } | { ok: false; reason: "jersey-taken" | "failed" };

/**
 * 온보딩(신청 정보가 빠진 계정). 역할·상태는 보내지 않는다 — DB 기본값(일반·승인 대기)이
 * 들어가고, 다른 값을 보내면 RLS 가 거부한다.
 *
 * 두 번 눌러 이미 행이 있으면 성공으로 본다(on conflict do nothing). 그래서 남는 23505 는
 * 등번호 겹침이다 — DB 트리거가 같은 코드로 막는다.
 */
export const insertMember = async (client: DbClient, userId: string, input: NewMember): Promise<InsertMemberResult> => {
  const { error } = await client.from("members").upsert(
    {
      id: userId,
      real_name: input.realName,
      feet: input.feet,
      preferred_positions: input.preferredPositions,
      jersey_number: input.jerseyNumber,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error === null) return { ok: true };
  return { ok: false, reason: error.code === "23505" ? "jersey-taken" : "failed" };
};
