import { keeperSlotIndex, type Formation } from "@/entities/formation";
import type { Position } from "@/entities/position";
import { seatByPreference, type QuarterLineup, type SavedQuarter, type SquadQuarter } from "@/entities/squad";

export type BuilderSlot = { position: Position; x: number; y: number; memberId: string | null };
export type BuilderQuarter = { formationName: string; slots: BuilderSlot[] };
/** 쿼터 순서대로(0이 1쿼터). 화면에서 고치는 스쿼드 전체 */
export type Builder = BuilderQuarter[];

export type Selection = { kind: "bench"; memberId: string } | { kind: "slot"; index: number } | null;
export type TapTarget = { kind: "bench"; memberId: string } | { kind: "slot"; index: number };

const fromFormation = (formation: Formation): BuilderQuarter => ({
  formationName: formation.name,
  slots: formation.slots.map((slot) => ({ ...slot, memberId: null })),
});

/** 저장된 쿼터는 그대로, 없는 쿼터는 기본 포메이션으로 빈 채 시작한다. */
export const initialBuilder = (quarterCount: number, saved: readonly SavedQuarter[], fallback: Formation): Builder =>
  Array.from({ length: quarterCount }, (_, index) => {
    const quarter = saved.find((candidate) => candidate.number === index + 1);
    if (quarter === undefined) return fromFormation(fallback);
    return {
      formationName: quarter.formationName,
      slots: quarter.slots.map(({ position, x, y, memberId }) => ({ position, x, y, memberId })),
    };
  });

const updateQuarter = (builder: Builder, quarter: number, slots: BuilderSlot[], formationName?: string): Builder =>
  builder.map((current, index) =>
    index === quarter ? { formationName: formationName ?? current.formationName, slots } : current,
  );

/**
 * 한 사람을 자리에 넣는다.
 * - 벤치에서 오면 그 자리에 있던 사람은 벤치로 간다.
 * - 이미 다른 자리에서 뛰고 있으면 두 자리를 서로 바꾼다(빈자리로 옮기면 원래 자리가 빈다).
 */
export const placeMember = (builder: Builder, quarter: number, memberId: string, slotIndex: number): Builder => {
  const slots = builder[quarter].slots.map((slot) => ({ ...slot }));
  const from = slots.findIndex((slot) => slot.memberId === memberId);
  if (from === slotIndex) return builder;
  const occupant = slots[slotIndex].memberId;
  slots[slotIndex].memberId = memberId;
  if (from !== -1) slots[from].memberId = occupant;
  return updateQuarter(builder, quarter, slots);
};

export const removeMember = (builder: Builder, quarter: number, slotIndex: number): Builder =>
  updateQuarter(
    builder,
    quarter,
    builder[quarter].slots.map((slot, index) => (index === slotIndex ? { ...slot, memberId: null } : slot)),
  );

/** 탭 두 번(고르고 → 놓기)으로 넣고 빼고 바꾼다. 같은 것을 다시 누르면 고르기를 푼다. */
export const handleTap = (
  builder: Builder,
  quarter: number,
  selection: Selection,
  target: TapTarget,
): { builder: Builder; selection: Selection } => {
  const slots = builder[quarter].slots;

  if (target.kind === "bench") {
    if (selection?.kind === "slot") {
      return { builder: placeMember(builder, quarter, target.memberId, selection.index), selection: null };
    }
    const same = selection?.kind === "bench" && selection.memberId === target.memberId;
    return { builder, selection: same ? null : target };
  }

  if (selection === null) return { builder, selection: target };
  if (selection.kind === "bench") {
    return { builder: placeMember(builder, quarter, selection.memberId, target.index), selection: null };
  }
  if (selection.index === target.index) return { builder, selection: null };

  const selectedMember = slots[selection.index].memberId;
  const targetMember = slots[target.index].memberId;
  if (selectedMember !== null) {
    return { builder: placeMember(builder, quarter, selectedMember, target.index), selection: null };
  }
  if (targetMember !== null) {
    return { builder: placeMember(builder, quarter, targetMember, selection.index), selection: null };
  }
  return { builder, selection: target };
};

const fieldIndexes = (slots: readonly BuilderSlot[]) => {
  const keeper = keeperSlotIndex(slots);
  return slots.flatMap((_, index) => (index === keeper ? [] : [index]));
};

/**
 * 포메이션을 바꾼다. 뛰던 사람은 그대로 두되, 키퍼는 키퍼 자리에, 필드 선수는 선호 포지션
 * 점수가 가장 크게 다시 앉힌다. 자리가 모자라면 남는 사람은 벤치로 간다.
 */
export const applyFormation = (
  builder: Builder,
  quarter: number,
  formation: Formation,
  preferencesOf: (memberId: string) => readonly Position[],
): Builder => {
  const current = builder[quarter].slots;
  const currentKeeper = keeperSlotIndex(current);
  const keeper = currentKeeper === -1 ? null : current[currentKeeper].memberId;
  const fielders = fieldIndexes(current)
    .map((index) => current[index].memberId)
    .filter((memberId): memberId is string => memberId !== null);

  const slots: BuilderSlot[] = formation.slots.map((slot) => ({ ...slot, memberId: null }));
  const newKeeper = keeperSlotIndex(slots);
  if (newKeeper !== -1) slots[newKeeper].memberId = keeper;

  const targets = fieldIndexes(slots);
  const seats = seatByPreference(
    fielders.map((id) => ({ id, preferredPositions: preferencesOf(id) })),
    targets.map((index) => slots[index].position),
  );
  seats.forEach((memberId, order) => {
    slots[targets[order]].memberId = memberId;
  });
  return updateQuarter(builder, quarter, slots, formation.name);
};

/** 앞 쿼터를 그대로 복사한다. 그 쿼터에 못 오는 사람은 뺀다. */
export const copyQuarter = (
  builder: Builder,
  from: number,
  to: number,
  canPlay: (memberId: string, quarter: number) => boolean,
): Builder =>
  updateQuarter(
    builder,
    to,
    builder[from].slots.map((slot) => ({
      ...slot,
      memberId: slot.memberId !== null && canPlay(slot.memberId, to) ? slot.memberId : null,
    })),
    builder[from].formationName,
  );

/** 자동 배치 결과(키퍼 + 필드 순서)를 자리에 넣는다. */
export const applyLineup = (builder: Builder, lineup: readonly QuarterLineup[]): Builder =>
  builder.map((quarter, index) => {
    const slots = quarter.slots.map((slot) => ({ ...slot }));
    const keeper = keeperSlotIndex(slots);
    if (keeper !== -1) slots[keeper].memberId = lineup[index].keeperId;
    fieldIndexes(slots).forEach((slotIndex, order) => {
      slots[slotIndex].memberId = lineup[index].fieldIds[order] ?? null;
    });
    return { ...quarter, slots };
  });

/** 자동 배치·점검(entities/squad)에 넘길 쿼터 모양. 키퍼 자리는 빼고 필드 슬롯만 넘긴다. */
export const toSquadQuarters = (builder: Builder): SquadQuarter[] =>
  builder.map((quarter) => ({ fieldSlots: fieldIndexes(quarter.slots).map((index) => quarter.slots[index].position) }));

export const toLineup = (builder: Builder): QuarterLineup[] =>
  builder.map((quarter) => {
    const keeper = keeperSlotIndex(quarter.slots);
    return {
      keeperId: keeper === -1 ? null : quarter.slots[keeper].memberId,
      fieldIds: fieldIndexes(quarter.slots).map((index) => quarter.slots[index].memberId),
    };
  });

/** `save_squad` RPC 가 받는 모양 */
export const toSavePayload = (builder: Builder) =>
  builder.map((quarter, index) => ({
    number: index + 1,
    formation_name: quarter.formationName,
    slots: quarter.slots.map((slot, slotIndex) => ({
      slot_index: slotIndex,
      position: slot.position,
      x: slot.x,
      y: slot.y,
      member_id: slot.memberId,
    })),
  }));

/** 이 쿼터에 뛰는 사람 */
export const placedIn = (builder: Builder, quarter: number) =>
  new Set(builder[quarter].slots.flatMap((slot) => (slot.memberId === null ? [] : [slot.memberId])));

/**
 * 드래그를 놓았을 때(dnd-kit onDragEnd). 끄는 것: "bench:<멤버 id>" · "slot:<자리 번호>",
 * 놓는 곳: "slot:<자리 번호>" · "bench". 결과는 탭 두 번과 같다 — 넣기·바꾸기·빼기.
 */
export const handleDrop = (builder: Builder, quarter: number, activeId: string, overId: string | null): Builder => {
  if (overId === null) return builder;
  const slots = builder[quarter].slots;
  const fromSlot = activeId.startsWith("slot:") ? Number(activeId.slice("slot:".length)) : null;
  const memberId = activeId.startsWith("bench:")
    ? activeId.slice("bench:".length)
    : fromSlot !== null
      ? (slots[fromSlot]?.memberId ?? null)
      : null;
  if (memberId === null) return builder;

  if (overId === "bench") return fromSlot === null ? builder : removeMember(builder, quarter, fromSlot);
  if (overId.startsWith("slot:")) return placeMember(builder, quarter, memberId, Number(overId.slice("slot:".length)));
  return builder;
};
