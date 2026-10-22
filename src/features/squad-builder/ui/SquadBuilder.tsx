"use client";

import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useActionState, useState } from "react";
import { attendanceTimeNote } from "@/entities/attendance";
import { keeperSlotIndex, Pitch, PitchSpot, type Formation } from "@/entities/formation";
import type { QuarterTime } from "@/entities/match";
import { footLabel } from "@/entities/member";
import { autoAssign, evaluateSquad, isDedicatedKeeper } from "@/entities/squad";
import { ActionButton, type ActionState, Select, SubmitButton } from "@/shared/ui";
import {
  applyFormation,
  applyLineup,
  copyQuarter,
  handleDrop,
  handleTap,
  toLineup,
  toSavePayload,
  toSquadQuarters,
  removeMember,
  type Builder,
  type Selection,
  type TapTarget,
} from "../model/builder";
import { fitOf } from "../model/fit";
import { placementIssues, squadPlayersFor, type BuilderPlayer } from "../model/pool";
import { warningMessage } from "../model/warnings";
import { SlotButton } from "./dnd";
import NoteEditor from "./NoteEditor";
import PitchTile from "./PitchTile";
import SelectedPlayer from "./SelectedPlayer";
import SquadList from "./SquadList";
import TimeWindowEditor from "./TimeWindowEditor";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

type Props = {
  matchId: string;
  schedule: readonly QuarterTime[];
  pool: readonly BuilderPlayer[];
  formations: readonly Formation[];
  initial: Builder;
  published: boolean;
  saveAction: Action;
  publishAction: Action;
  /** 올해 경기당 평균 필드 출전 쿼터(관리자 통계). 없는 사람은 표시하지 않는다 */
  seasonAverages?: Record<string, number | null>;
  /** 이 매치의 특이사항(멤버 id → 메모). 관리자만 본다 */
  notes?: Record<string, string>;
  /** 특이사항 저장(features/match-note). 없으면 편집기를 띄우지 않는다 */
  noteAction?: Action;
  /** 당일 도착·떠나는 시간 저장(features/attendance-adjust). 없으면 띄우지 않는다 */
  windowAction?: Action;
};

/**
 * 쿼터별 스쿼드를 짠다(PLAN.md §7 스쿼드 빌더). 고친 것은 화면에만 있다가 "저장"할 때 한 번에 저장된다.
 * 넣고 빼기는 탭 두 번이다 — 벤치 선수(또는 자리)를 고르고, 놓을 자리(또는 선수)를 누른다.
 *
 * 생김새는 풋볼매니저 24 전술 화면이다(모바일·태블릿은 풋볼매니저 모바일). 쿼터 탭(전술 슬롯), 경기장,
 * 선수 표를 둔다.
 */
export default function SquadBuilder({
  matchId,
  schedule,
  pool,
  formations,
  initial,
  published,
  saveAction,
  publishAction,
  seasonAverages = {},
  notes = {},
  noteAction,
  windowAction,
}: Props) {
  const [builder, setBuilder] = useState(initial);
  const [quarter, setQuarter] = useState(0);
  const [selection, setSelection] = useState<Selection>(null);
  const [savedPayload, setSavedPayload] = useState(() => JSON.stringify(toSavePayload(initial)));
  const payload = JSON.stringify(toSavePayload(builder));
  const dirty = payload !== savedPayload;

  const [saveState, saveFormAction] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await saveAction(previous, formData);
    if (!result.error) setSavedPayload(String(formData.get("quarters")));
    return result;
  }, {});

  const byId = new Map(pool.map((player) => [player.id, player]));
  const nameOf = (memberId: string) => byId.get(memberId)?.realName ?? "알 수 없음";
  /** 고른 선수 칸 제목: 등번호가 있으면 앞에 붙인다 */
  const labelOf = (memberId: string) => {
    const number = byId.get(memberId)?.jerseyNumber;
    return number == null ? nameOf(memberId) : `${number} ${nameOf(memberId)}`;
  };
  const input = { players: squadPlayersFor(pool, builder), quarters: toSquadQuarters(builder) };
  const inSquad = new Set(input.players.map((player) => player.id));
  const report = evaluateSquad(input, toLineup(builder));
  const messages = [...report.warnings.map((warning) => warningMessage(warning, nameOf)), ...placementIssues(pool, builder)];
  const troubled = new Set(
    report.warnings.flatMap((warning) => (warning.kind === "below-guarantee" ? [] : [warning.quarter])),
  );

  const current = builder[quarter];
  const keeper = keeperSlotIndex(current.slots);
  const selectedSlot = selection?.kind === "slot" ? current.slots[selection.index] : null;
  // 고른 사람: 벤치에서 고른 사람이나 자리에서 고른 사람. 특이사항·시간을 고치고, 맞는 자리를 보인다
  const selectedMember = selection?.kind === "bench" ? selection.memberId : (selectedSlot?.memberId ?? null);
  const selectedPlayer = selectedMember === null ? undefined : byId.get(selectedMember);
  const noted = Object.entries(notes).sort(([a], [b]) => nameOf(a).localeCompare(nameOf(b), "ko"));

  const change = (next: Builder) => {
    setBuilder(next);
    setSelection(null);
  };
  // 드래그: 마우스는 8px 움직여야, 손가락은 0.2초 눌러야 시작한다(탭·스크롤과 안 부딪히게).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const draggingName = (() => {
    if (dragging === null) return null;
    if (dragging.startsWith("bench:")) return nameOf(dragging.slice("bench:".length));
    const memberId = current.slots[Number(dragging.slice("slot:".length))]?.memberId;
    return memberId ? nameOf(memberId) : null;
  })();

  const tap = (target: TapTarget) => {
    const next = handleTap(builder, quarter, selection, target);
    setBuilder(next.builder);
    setSelection(next.selection);
  };

  /** 끝난 쿼터(지금 쿼터 앞)는 그대로 두고 지금 쿼터부터 다시 짠다(PLAN.md §10 당일 변동). */
  const reassignFromHere = () => {
    if (!window.confirm(`1~${quarter}쿼터는 그대로 두고 ${quarter + 1}쿼터부터 필드를 다시 짤까요?`)) return;
    const lineup = toLineup(builder);
    change(
      applyLineup(
        builder,
        autoAssign(input, { startQuarter: quarter, current: lineup, keepers: lineup.map((row) => row.keeperId) }),
      ),
    );
  };

  const runAutoAssign = () => {
    const lineup = toLineup(builder);
    const hasField = lineup.some((row) => row.fieldIds.some((id) => id !== null));
    if (hasField && !window.confirm("필드 배치를 새로 짤까요? 키퍼 자리는 그대로 둬요.")) return;
    change(applyLineup(builder, autoAssign(input, { keepers: lineup.map((row) => row.keeperId) })));
  };

  const changeFormation = (name: string) => {
    const formation = formations.find((candidate) => candidate.name === name);
    if (formation) change(applyFormation(builder, quarter, formation, (id) => byId.get(id)?.preferredPositions ?? []));
  };

  /** 출전 수 / 보장 수. 전담 키퍼는 키퍼 쿼터를 센다. 자동 배치 대상이 아니면 null */
  const statOf = (player: BuilderPlayer) => {
    const kept = report.keeperCounts[player.id] ?? 0;
    if (isDedicatedKeeper(player)) return `키퍼 ${kept}`;
    if (!inSquad.has(player.id)) return null;
    const played = report.fieldCounts[player.id] ?? 0;
    return `출전 ${played}/${report.guaranteed[player.id] ?? 0}${kept > 0 ? ` · 키퍼 ${kept}` : ""}`;
  };

  /** 고른 선수 칸의 둘째 줄: 선호 포지션 · 주발 · 시간 · 용병 */
  const detailsOf = (player: BuilderPlayer) =>
    [
      `선호 ${player.preferredPositions.join("·")}`,
      player.feet.map(footLabel).join("·"),
      attendanceTimeNote(player),
      player.memberType === "guest" ? "용병" : null,
    ]
      .filter(Boolean)
      .join(" · ");

  const selected = (() => {
    if (selection === null) return null;
    if (selectedSlot !== null && selection.kind === "slot" && selectedSlot.memberId === null) {
      return {
        title: `${selectedSlot.position} 빈자리`,
        details: null,
        fit: null,
        hint: "벤치에서 넣을 사람을 누르세요. 이 자리에 맞는 사람이 위에 와요.",
      };
    }
    if (selectedMember === null) return null;
    const label = labelOf(selectedMember);
    if (selectedSlot !== null && selection.kind === "slot") {
      return {
        title: `${selectedSlot.position} · ${label}`,
        details: selectedPlayer ? detailsOf(selectedPlayer) : null,
        fit: selectedPlayer ? fitOf(selectedPlayer.preferredPositions, selectedSlot.position) : null,
        hint: "다른 자리나 벤치 선수를 누르면 바꿔요.",
        onRemove: () => change(removeMember(builder, quarter, selection.index)),
      };
    }
    return {
      title: label,
      details: selectedPlayer ? detailsOf(selectedPlayer) : null,
      fit: null,
      hint: "놓을 자리를 누르세요. 자리 테두리 색이 이 선수에게 맞는 정도예요.",
    };
  })();

  return (
    <div className="flex flex-col gap-4">
      {/* 쿼터 탭 — 풋볼매니저의 전술 슬롯처럼 쿼터마다 포메이션을 같이 보인다 */}
      <div role="tablist" aria-label="쿼터" className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {schedule.map((time, index) => (
          <button
            key={time.startsAt}
            role="tab"
            type="button"
            aria-selected={index === quarter}
            onClick={() => {
              setQuarter(index);
              setSelection(null);
            }}
            className="relative shrink-0 rounded-lg border border-border bg-bg-subtle px-3 py-1.5 text-left text-sm aria-selected:border-primary aria-selected:bg-primary aria-selected:text-primary-contrast"
          >
            <span className="font-semibold">{index + 1}쿼터</span> <span className="text-xs opacity-80">{time.startsAt}</span>
            <span className="block text-[11px] opacity-70">{builder[index]?.formationName}</span>
            {troubled.has(index) && (
              <span aria-hidden="true" className="absolute -top-1 -right-1 size-2.5 rounded-full bg-danger" />
            )}
          </button>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(event) => setDragging(String(event.active.id))}
        onDragCancel={() => setDragging(null)}
        onDragEnd={(event) => {
          setDragging(null);
          change(handleDrop(builder, quarter, String(event.active.id), event.over ? String(event.over.id) : null));
        }}
      >
        {/* 모바일: 위에서 아래로 — 포메이션, 경기장, 고른 선수와 선수 표, 화면 아래에 붙는 저장 줄(풋볼매니저 모바일).
            태블릿 이상: 첫 줄은 왼쪽 포메이션 · 오른쪽 저장 줄, 둘째 줄은 왼쪽 경기장(스크롤해도 붙어 있다) ·
            오른쪽 고른 선수와 선수 표(풋볼매니저 24). */}
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-x-6 lg:grid-cols-5 lg:gap-x-8">
          <div className="flex items-end gap-2 md:col-start-1 md:row-start-1 lg:col-span-2">
            <div className="flex-1">
              <label htmlFor="formation" className="text-xs font-semibold text-text-secondary">
                포메이션
              </label>
              <Select
                id="formation"
                value={current.formationName}
                onChange={(event) => changeFormation(event.target.value)}
                fieldSize="md"
                className="mt-1"
              >
                {formations.map((formation) => (
                  <option key={formation.id} value={formation.name}>
                    {formation.name}
                  </option>
                ))}
              </Select>
            </div>
            {quarter > 0 && (
              <button
                type="button"
                onClick={() =>
                  change(copyQuarter(builder, quarter - 1, quarter, (id, q) => byId.get(id)?.availableQuarters.includes(q) ?? false))
                }
                className="h-10 rounded-lg border border-border px-3 text-sm"
              >
                이전 쿼터 복사
              </button>
            )}
          </div>

          <div className="order-1 md:sticky md:top-20 md:order-none md:col-start-1 md:row-start-2 lg:col-span-2">
            <Pitch label="경기장">
              {current.slots.map((slot, index) => {
                const occupant = slot.memberId === null ? undefined : byId.get(slot.memberId);
                const candidate = selectedPlayer ? fitOf(selectedPlayer.preferredPositions, slot.position) : null;
                const isSelected = selection?.kind === "slot" && selection.index === index;
                return (
                  <PitchSpot key={index} x={slot.x} y={slot.y}>
                    <SlotButton
                      index={index}
                      occupied={slot.memberId !== null}
                      aria-pressed={isSelected}
                      onClick={() => tap({ kind: "slot", index })}
                      className="flex w-18 flex-col items-center gap-0.5"
                    >
                      <PitchTile
                        position={slot.position}
                        number={occupant?.jerseyNumber ?? null}
                        name={slot.memberId === null ? null : nameOf(slot.memberId)}
                        keeper={index === keeper}
                        fit={occupant ? fitOf(occupant.preferredPositions, slot.position) : null}
                        candidate={candidate === "poor" || slot.memberId === selectedMember ? null : candidate}
                        selected={isSelected}
                        noted={slot.memberId !== null && Boolean(notes[slot.memberId])}
                      />
                    </SlotButton>
                  </PitchSpot>
                );
              })}
            </Pitch>
          </div>

          <div className="order-2 flex flex-col gap-4 md:order-none md:col-start-2 md:row-start-2 lg:col-span-3 lg:col-start-3">
            {selected && (
              <SelectedPlayer
                title={selected.title}
                details={selected.details}
                fit={selected.fit}
                hint={selected.hint}
                onRemove={"onRemove" in selected ? selected.onRemove : undefined}
              >
                {windowAction && selectedPlayer && (
                  <TimeWindowEditor
                    key={`window-${selectedPlayer.id}`}
                    action={windowAction}
                    matchId={matchId}
                    memberId={selectedPlayer.id}
                    name={selectedPlayer.realName}
                    schedule={schedule}
                    arriveAt={selectedPlayer.arriveAt}
                    leaveAt={selectedPlayer.leaveAt}
                  />
                )}
                {noteAction && selectedMember !== null && (
                  <NoteEditor
                    key={selectedMember}
                    action={noteAction}
                    matchId={matchId}
                    memberId={selectedMember}
                    name={nameOf(selectedMember)}
                    note={notes[selectedMember] ?? null}
                  />
                )}
              </SelectedPlayer>
            )}

            <SquadList
              builder={builder}
              quarter={quarter}
              pool={pool}
              selection={selection}
              onTap={tap}
              statOf={statOf}
              notes={notes}
              seasonAverages={seasonAverages}
            />

            {messages.length > 0 && (
              <section className="rounded-xl border border-danger/40 p-3">
                <h2 className="text-sm font-semibold text-danger">확인할 것</h2>
                <ul className="mt-1 flex flex-col gap-0.5 text-sm">
                  {messages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-label="특이사항" className="rounded-xl border border-border p-3">
              <h2 className="text-sm font-semibold">
                특이사항 <span className="text-xs font-normal text-text-tertiary">관리자만</span>
              </h2>
              {noted.length === 0 ? (
                <p className="mt-1 text-xs text-text-tertiary">아직 없어요. 선수를 누르면 메모를 쓸 수 있어요.</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-1 text-sm">
                  {noted.map(([memberId, note]) => (
                    <li key={memberId}>
                      <span className="font-semibold">{nameOf(memberId)}</span> <span className="text-text-secondary">{note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* 저장 줄. 모바일에서는 화면 아래에 붙어 경기장을 보면서도 누를 수 있고, 태블릿 이상에서는 포메이션 옆에 온다. */}
          <div className="sticky bottom-0 order-last -mx-4 flex flex-col gap-2 border-t border-border bg-bg-base px-4 py-3 md:static md:order-none md:col-start-2 md:row-start-1 md:mx-0 md:self-end md:border-0 md:bg-transparent md:p-0 lg:col-span-3 lg:col-start-3">
            <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-end">
              <button
                type="button"
                onClick={runAutoAssign}
                className="h-11 rounded-lg border border-border text-sm font-semibold md:h-10 md:px-4"
              >
                자동 배치
              </button>
              {quarter > 0 && (
                <button
                  type="button"
                  onClick={reassignFromHere}
                  className="col-span-2 row-start-2 h-11 rounded-lg border border-border text-sm font-semibold md:h-10 md:px-4"
                >
                  {quarter + 1}쿼터부터 다시 배치
                </button>
              )}
              <form action={saveFormAction} className="md:w-24">
                <input type="hidden" name="matchId" value={matchId} />
                <input type="hidden" name="quarters" value={payload} />
                <SubmitButton
                  disabled={!dirty}
                  className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-contrast disabled:opacity-40 md:h-10"
                >
                  저장
                </SubmitButton>
              </form>
              <div className="col-span-2 md:w-28">
                <ActionButton
                  action={publishAction}
                  fields={{ matchId, publish: published ? "0" : "1" }}
                  label={published ? "공개 취소" : "공개하기"}
                  disabled={dirty}
                />
              </div>
            </div>
            {saveState.error && (
              <p role="alert" className="text-sm text-danger">
                {saveState.error}
              </p>
            )}
            <p className="text-xs text-text-tertiary md:text-right">
              {dirty ? "저장하지 않은 변경이 있어요. 저장한 뒤에 공개할 수 있어요." : published ? "팀원에게 공개돼 있어요." : "저장됨 · 아직 팀원에게 공개 전이에요."}
            </p>
          </div>
        </div>
        <DragOverlay>
          {draggingName && (
            <span className="rounded-lg bg-primary px-2.5 py-1.5 text-sm font-semibold text-primary-contrast shadow-lg">
              {draggingName}
            </span>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
