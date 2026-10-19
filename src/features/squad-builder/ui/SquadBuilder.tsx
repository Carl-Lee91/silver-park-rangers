"use client";

import { useActionState, useState } from "react";
import { attendanceTimeNote } from "@/entities/attendance";
import { keeperSlotIndex, Pitch, PitchSpot, type Formation } from "@/entities/formation";
import type { QuarterTime } from "@/entities/match";
import { autoAssign, evaluateSquad, isDedicatedKeeper } from "@/entities/squad";
import { ActionButton, type ActionState } from "@/shared/ui";
import {
  applyFormation,
  applyLineup,
  copyQuarter,
  handleTap,
  placedIn,
  toLineup,
  toSavePayload,
  toSquadQuarters,
  removeMember,
  type Builder,
  type Selection,
  type TapTarget,
} from "../model/builder";
import { placementIssues, squadPlayersFor, type BuilderPlayer } from "../model/pool";
import { warningMessage } from "../model/warnings";
import NoteEditor from "./NoteEditor";
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

const RESPONSE_BADGE = { maybe: "미정", no: "불참" } as const;

/**
 * 쿼터별 스쿼드를 짠다(PLAN.md §7 스쿼드 빌더). 고친 것은 화면에만 있다가 "저장"할 때 한 번에 저장된다.
 * 넣고 빼기는 탭 두 번이다 — 벤치 선수(또는 자리)를 고르고, 놓을 자리(또는 선수)를 누른다.
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

  const [saveState, saveFormAction, saving] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await saveAction(previous, formData);
    if (!result.error) setSavedPayload(String(formData.get("quarters")));
    return result;
  }, {});

  const byId = new Map(pool.map((player) => [player.id, player]));
  const nameOf = (memberId: string) => byId.get(memberId)?.realName ?? "알 수 없음";
  const input = { players: squadPlayersFor(pool, builder), quarters: toSquadQuarters(builder) };
  const inSquad = new Set(input.players.map((player) => player.id));
  const report = evaluateSquad(input, toLineup(builder));
  const messages = [...report.warnings.map((warning) => warningMessage(warning, nameOf)), ...placementIssues(pool, builder)];
  const troubled = new Set(
    report.warnings.flatMap((warning) => (warning.kind === "below-guarantee" ? [] : [warning.quarter])),
  );

  const current = builder[quarter];
  const placed = placedIn(builder, quarter);
  const bench = pool.filter((player) => !placed.has(player.id) && player.availableQuarters.includes(quarter));
  const away = pool.filter((player) => !placed.has(player.id) && !player.availableQuarters.includes(quarter));
  const selectedMember = selection?.kind === "slot" ? current.slots[selection.index].memberId : null;
  // 특이사항을 쓸 사람: 벤치에서 고른 사람이나 자리에서 고른 사람
  const noteTarget = selection?.kind === "bench" ? selection.memberId : selectedMember;
  const noted = Object.entries(notes).sort(([a], [b]) => nameOf(a).localeCompare(nameOf(b), "ko"));

  const change = (next: Builder) => {
    setBuilder(next);
    setSelection(null);
  };
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

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="쿼터" className="-mx-4 flex gap-2 overflow-x-auto px-4">
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
            className="relative shrink-0 rounded-lg border border-border px-3 py-2 text-sm aria-selected:border-primary aria-selected:bg-primary aria-selected:text-primary-contrast"
          >
            {index + 1}쿼터 <span className="text-xs opacity-80">{time.startsAt}</span>
            {troubled.has(index) && (
              <span aria-hidden="true" className="absolute -top-1 -right-1 size-2.5 rounded-full bg-danger" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="formation" className="text-sm font-semibold">
            포메이션
          </label>
          <select
            id="formation"
            value={current.formationName}
            onChange={(event) => changeFormation(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-border bg-bg-base px-3 text-sm"
          >
            {formations.map((formation) => (
              <option key={formation.id} value={formation.name}>
                {formation.name}
              </option>
            ))}
          </select>
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

      <Pitch label="경기장">
        {current.slots.map((slot, index) => {
          const name = slot.memberId === null ? null : nameOf(slot.memberId);
          const selected = selection?.kind === "slot" && selection.index === index;
          const keeper = index === keeperSlotIndex(current.slots);
          return (
            <PitchSpot key={index} x={slot.x} y={slot.y}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => tap({ kind: "slot", index })}
                className="flex w-16 flex-col items-center gap-0.5"
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-full text-[11px] font-bold ${
                    name === null ? "border border-dashed border-white/80 text-white" : keeper ? "bg-kakao text-kakao-label" : "bg-white text-text-primary"
                  } ${selected ? "ring-3 ring-kakao" : ""}`}
                >
                  {slot.position}
                </span>{" "}
                <span className="max-w-16 truncate rounded bg-black/40 px-1 text-[11px] text-white">
                  {name ?? "빈자리"}
                  {slot.memberId !== null && notes[slot.memberId] && " ✎"}
                </span>
              </button>
            </PitchSpot>
          );
        })}
      </Pitch>

      {selectedMember !== null && selection?.kind === "slot" && (
        <div className="flex items-center justify-between rounded-lg bg-bg-subtle px-3 py-2 text-sm">
          <span>{nameOf(selectedMember)} — 다른 자리를 누르면 바꿔요.</span>
          <button
            type="button"
            onClick={() => change(removeMember(builder, quarter, selection.index))}
            className="font-semibold text-danger"
          >
            빼기
          </button>
        </div>
      )}

      {windowAction && noteTarget !== null && byId.has(noteTarget) && (
        <TimeWindowEditor
          key={`window-${noteTarget}`}
          action={windowAction}
          matchId={matchId}
          memberId={noteTarget}
          name={nameOf(noteTarget)}
          schedule={schedule}
          arriveAt={byId.get(noteTarget)!.arriveAt}
          leaveAt={byId.get(noteTarget)!.leaveAt}
        />
      )}

      {noteAction && noteTarget !== null && (
        <NoteEditor
          key={noteTarget}
          action={noteAction}
          matchId={matchId}
          memberId={noteTarget}
          name={nameOf(noteTarget)}
          note={notes[noteTarget] ?? null}
        />
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">
          벤치 <span className="text-text-secondary">{bench.length}</span>
        </h2>
        <div role="group" aria-label="벤치" className="flex flex-wrap gap-2">
          {bench.length === 0 && <p className="text-sm text-text-tertiary">이 쿼터에 남은 사람이 없어요.</p>}
          {bench.map((player) => {
            const stat = statOf(player);
            const note = attendanceTimeNote(player);
            const average = seasonAverages[player.id];
            const badge = player.response === "maybe" || player.response === "no" ? RESPONSE_BADGE[player.response] : null;
            return (
              <button
                key={player.id}
                type="button"
                aria-pressed={selection?.kind === "bench" && selection.memberId === player.id}
                onClick={() => tap({ kind: "bench", memberId: player.id })}
                className="rounded-lg border border-border px-2.5 py-1.5 text-left text-sm aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-contrast"
              >
                <span className="font-semibold">{player.realName}</span>
                {player.memberType === "guest" && <span className="ml-1 text-xs opacity-70">용병</span>}
                {badge && <span className="ml-1 text-xs text-danger">{badge}</span>}
                {notes[player.id] && <span className="ml-1 text-xs opacity-70">메모</span>}
                <span className="block text-xs opacity-70">
                  {player.preferredPositions.join("·")}
                  {stat && ` · ${stat}`}
                  {note && ` · ${note}`}
                  {average != null && ` · 올해 평균 ${average.toFixed(1)}`}
                </span>
              </button>
            );
          })}
        </div>
        {away.length > 0 && (
          <p className="mt-3 text-xs text-text-tertiary">
            이 쿼터엔 못 와요: {away.map((player) => player.realName).join(", ")}
          </p>
        )}
      </section>

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

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-bg-base px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={runAutoAssign} className="h-11 rounded-lg border border-border text-sm font-semibold">
            자동 배치
          </button>
          {quarter > 0 && (
            <button
              type="button"
              onClick={reassignFromHere}
              className="col-span-2 row-start-2 h-11 rounded-lg border border-border text-sm font-semibold"
            >
              {quarter + 1}쿼터부터 다시 배치
            </button>
          )}
          <form action={saveFormAction}>
            <input type="hidden" name="matchId" value={matchId} />
            <input type="hidden" name="quarters" value={payload} />
            <button
              type="submit"
              disabled={saving || !dirty}
              className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-contrast disabled:opacity-40"
            >
              저장
            </button>
          </form>
        </div>
        {saveState.error && (
          <p role="alert" className="text-sm text-danger">
            {saveState.error}
          </p>
        )}
        <ActionButton
          action={publishAction}
          fields={{ matchId, publish: published ? "0" : "1" }}
          label={published ? "공개 취소" : "공개하기"}
          disabled={dirty}
        />
        <p className="text-xs text-text-tertiary">
          {dirty ? "저장하지 않은 변경이 있어요. 저장한 뒤에 공개할 수 있어요." : published ? "팀원에게 공개돼 있어요." : "저장됨 · 아직 팀원에게 공개 전이에요."}
        </p>
      </div>
    </div>
  );
}
