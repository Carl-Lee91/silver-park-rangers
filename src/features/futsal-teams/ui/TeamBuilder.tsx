"use client";

import { Sparkles } from "lucide-react";
import { useActionState, useState } from "react";
import { shortTeams, splitTeams, TEAM_LABELS, teamAverage, teamSizes, type TeamCount } from "@/entities/futsal";
import { playersPerSide, type MatchFormat } from "@/entities/match";
import { ActionButton, chipClass, Panel, SubmitButton, useConfirm, useToast, type ActionState } from "@/shared/ui";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** 팀 나누기 대상(참석한 사람과 이미 팀에 든 사람). 전력 · 용병 표시는 관리자 화면에만 보인다 */
export type TeamBuilderPlayer = {
  id: string;
  realName: string;
  jerseyNumber: number | null;
  /** 필드 능력치 평균(골키퍼 능력치는 안 본다). 미평가면 null — 나눌 때 평균으로 본다 */
  strength: number | null;
  /** 용병(멤버 구분 · 그날 용병). 관리자만 본다 */
  guest: boolean;
};

type Props = {
  matchId: string;
  format: MatchFormat;
  players: readonly TeamBuilderPlayer[];
  initialTeamCount: TeamCount;
  /** 저장된 팀: 선수 id → 팀 번호(1부터) */
  initialAssignments: Readonly<Record<string, number>>;
  published: boolean;
  saveAction: Action;
  publishAction: Action;
  /** 자동으로 나누기의 난수. 테스트에서 고정한다 */
  random?: () => number;
};

const TEAM_COUNTS: TeamCount[] = [2, 3];

const CHIP =
  "h-11 rounded-box border border-border-strong bg-bg-subtle px-4 text-sm font-medium aria-pressed:border-primary aria-pressed:bg-primary/15 aria-pressed:font-bold aria-pressed:text-primary";

/** 저장할 명단(팀 수 안에 든 사람만). 비교하려고 글자로 만든다 */
const payloadOf = (players: readonly TeamBuilderPlayer[], teamCount: number, assignments: Readonly<Record<string, number>>) =>
  JSON.stringify(
    players
      .filter((player) => assignments[player.id] >= 1 && assignments[player.id] <= teamCount)
      .map((player) => ({ member_id: player.id, team_number: assignments[player.id] }))
      .sort((a, b) => a.member_id.localeCompare(b.member_id)),
  );

/**
 * 풋살 팀 나누기(PLAN.md §6 "풋살"). 2 · 3팀을 고르고 "자동으로 나누기"로 팀 평균 전력이 비슷하게 나눈 뒤,
 * 사람을 누르고 → 옮길 팀을 눌러 고친다. 고친 것은 "저장"할 때 한 번에 저장되고, 공개하면 팀원이 본다.
 */
export default function TeamBuilder({
  matchId,
  format,
  players,
  initialTeamCount,
  initialAssignments,
  published,
  saveAction,
  publishAction,
  random = Math.random,
}: Props) {
  const perSide = playersPerSide(format);
  const [teamCount, setTeamCount] = useState<TeamCount>(initialTeamCount);
  const [assignments, setAssignments] = useState<Record<string, number>>({ ...initialAssignments });
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState(() => `${initialTeamCount}|${payloadOf(players, initialTeamCount, initialAssignments)}`);
  const { confirm, dialog } = useConfirm();
  const { show, toast } = useToast();

  const members = payloadOf(players, teamCount, assignments);
  const dirty = `${teamCount}|${members}` !== saved;
  const hasSaved = !saved.endsWith("|[]");
  const [state, formAction] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await saveAction(previous, formData);
    if (!result.error) {
      setSaved(`${formData.get("teamCount")}|${formData.get("members")}`);
      show("팀을 저장했어요.");
    }
    return result;
  }, {});

  const inTeam = (player: TeamBuilderPlayer) => assignments[player.id] >= 1 && assignments[player.id] <= teamCount;
  const teams = Array.from({ length: teamCount }, (_, index) => players.filter((player) => assignments[player.id] === index + 1));
  const unassigned = players.filter((player) => !inTeam(player));
  const strengths = Object.fromEntries(players.map((player) => [player.id, player.strength]));
  const short = shortTeams(
    teams.map((team) => team.map((player) => player.id)),
    perSide,
  );
  const sizes = [...new Set(teamSizes(players.length, teamCount))].join(" · ");
  const selectedPlayer = players.find((player) => player.id === selected);

  const autoSplit = async () => {
    if (players.some(inTeam) && !(await confirm({ message: "지금 팀을 새로 나눌까요?", confirmLabel: "새로 나누기" }))) return;
    const split = splitTeams(
      players.map((player) => ({ id: player.id, strength: player.strength })),
      teamCount,
      random,
    );
    setAssignments(Object.fromEntries(split.flatMap((ids, index) => ids.map((id) => [id, index + 1]))));
    setSelected(null);
  };

  const move = (team: number | null) => {
    if (selected === null) return;
    setAssignments((current) => {
      const next = { ...current };
      if (team === null) delete next[selected];
      else next[selected] = team;
      return next;
    });
    setSelected(null);
  };

  const row = (player: TeamBuilderPlayer) => (
    <li key={player.id} className="even:bg-bg-row">
      <button
        type="button"
        aria-pressed={selected === player.id}
        onClick={() => setSelected((current) => (current === player.id ? null : player.id))}
        className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm aria-pressed:bg-primary/15 aria-pressed:ring-1 aria-pressed:ring-primary md:px-4"
      >
        <span className="w-6 shrink-0 text-right text-xs text-text-tertiary tabular-nums">{player.jerseyNumber ?? ""}</span>
        <span className="truncate font-semibold">{player.realName}</span>
        {player.guest && <span className={chipClass("muted")}>용병</span>}
        <span className="ml-auto shrink-0 text-xs text-text-tertiary tabular-nums">
          {player.strength === null ? "–" : player.strength.toFixed(1)}
        </span>
      </button>
    </li>
  );

  return (
    <div className="flex flex-col gap-4">
      <Panel title="나누기" aside={`참석 ${players.length}명`}>
        <div className="flex flex-col gap-3">
          <div role="group" aria-label="팀 수" className="flex gap-1.5">
            {TEAM_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={teamCount === count}
                onClick={() => {
                  setTeamCount(count);
                  setSelected(null);
                }}
                className={CHIP}
              >
                {count}팀
              </button>
            ))}
          </div>
          <p className="text-xs text-text-tertiary">
            팀당 {sizes}명 · {perSide}명씩 뛰고 남는 사람은 교체예요. 팀 평균 전력이 비슷하게 나누고, 골키퍼 능력치와 포지션은
            보지 않아요.
          </p>
          <button
            type="button"
            onClick={() => void autoSplit()}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-box border border-border-strong bg-bg-subtle text-sm font-semibold md:self-start md:px-5"
          >
            <Sparkles aria-hidden="true" className="size-4" />
            자동으로 나누기
          </button>
        </div>
      </Panel>

      {short.length > 0 && (
        <p role="status" aria-label="모자란 팀" className="rounded-box border border-fit-fair/50 bg-fit-fair/10 px-3 py-2 text-sm">
          {short.map((index) => TEAM_LABELS[index]).join(" · ")}은 {perSide}명이 안 돼요. 팀 수를 줄이거나 사람을 옮겨 주세요.
        </p>
      )}

      {selectedPlayer && (
        <div
          role="group"
          aria-label="옮길 팀"
          className="sticky top-12 z-10 flex flex-wrap items-center gap-1.5 rounded-box border border-primary/60 bg-bg-panel p-2 lg:top-2"
        >
          <span className="px-1 text-sm font-semibold">{selectedPlayer.realName} →</span>
          {TEAM_LABELS.slice(0, teamCount).map((label, index) =>
            assignments[selectedPlayer.id] === index + 1 ? null : (
              <button key={label} type="button" onClick={() => move(index + 1)} className={CHIP}>
                {label}으로
              </button>
            ),
          )}
          {inTeam(selectedPlayer) && (
            <button type="button" onClick={() => move(null)} className={CHIP}>
              팀 빼기
            </button>
          )}
          <button type="button" onClick={() => setSelected(null)} className="h-11 px-3 text-sm text-text-tertiary">
            취소
          </button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team, index) => {
          const average = teamAverage(
            team.map((player) => player.id),
            strengths,
          );
          return (
            <Panel
              key={TEAM_LABELS[index]}
              title={TEAM_LABELS[index]}
              aside={`${team.length}명${average === null ? "" : ` · 평균 ${average.toFixed(1)}`}`}
              flush
            >
              {team.length === 0 ? (
                <p className="p-3 text-sm text-text-tertiary md:p-4">아직 아무도 없어요.</p>
              ) : (
                <ul className="divide-y divide-border">{team.map(row)}</ul>
              )}
            </Panel>
          );
        })}
        {unassigned.length > 0 && (
          <Panel title="팀 없음" aside={`${unassigned.length}명`} flush>
            <ul className="divide-y divide-border">{unassigned.map(row)}</ul>
          </Panel>
        )}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
        <form action={formAction} className="md:w-28">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="teamCount" value={teamCount} />
          <input type="hidden" name="members" value={members} />
          <SubmitButton
            disabled={!dirty}
            className="h-11 w-full rounded-box bg-primary text-sm font-bold text-primary-contrast disabled:opacity-40"
          >
            저장
          </SubmitButton>
        </form>
        <div className="md:w-28">
          <ActionButton
            action={publishAction}
            fields={{ matchId, publish: published ? "0" : "1" }}
            label={published ? "공개 취소" : "공개하기"}
            disabled={dirty || !hasSaved}
          />
        </div>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <p className="text-xs text-text-tertiary md:text-right">
        {dirty ? "저장하지 않은 변경이 있어요. 저장한 뒤에 공개할 수 있어요." : published ? "팀원에게 공개돼 있어요." : "아직 팀원에게 공개 전이에요."}
      </p>
      {toast}
      {dialog}
    </div>
  );
}
