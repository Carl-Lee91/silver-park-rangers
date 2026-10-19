import type { Position } from "@/entities/position";

/** 자동 배치와 점검이 보는 선수 정보. 멤버 정보에서 필요한 것만 옮겨 담는다. */
export type SquadPlayer = {
  id: string;
  /** 1~3개, 순서가 우선순위다. 1순위가 GK 면 전담 키퍼다. */
  preferredPositions: readonly Position[];
  /** 뛸 수 있는 쿼터 번호(0부터). 도착·떠나는 시간으로 계산한다(`entities/match`). */
  availableQuarters: readonly number[];
};

export type SquadQuarter = {
  /** 키퍼를 뺀 필드 슬롯의 포지션. 순서가 슬롯 번호다. */
  fieldSlots: readonly Position[];
};

export type SquadInput = {
  players: readonly SquadPlayer[];
  quarters: readonly SquadQuarter[];
};

export type QuarterLineup = {
  keeperId: string | null;
  /** `fieldSlots` 와 같은 순서. 빈 슬롯은 null */
  fieldIds: (string | null)[];
};

export type SquadWarning =
  | { kind: "keeper-missing"; quarter: number }
  | { kind: "field-short"; quarter: number; emptySlots: number }
  | { kind: "below-guarantee"; playerId: string; played: number; guaranteed: number };
