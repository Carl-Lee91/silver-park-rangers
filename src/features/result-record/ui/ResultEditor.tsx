import type { Goal, QuarterScore } from "@/entities/result";
import type { SavedQuarter } from "@/entities/squad";
import { ActionButton } from "@/shared/ui";
import { addGoal, removeGoal, setTheirScore } from "../api/actions";
import AddGoalForm from "./AddGoalForm";
import TheirScoreStepper from "./TheirScoreStepper";

type Person = { id: string; realName: string };

type Props = {
  matchId: string;
  quarterCount: number;
  scores: QuarterScore[];
  goals: Goal[];
  squad: SavedQuarter[];
  members: Person[];
};

/**
 * 쿼터별 결과 기록(관리자). 우리 점수는 골을 남기면 저절로 올라가고, 상대 점수는 `− 숫자 +` 로 남긴다.
 * 0:0 으로 끝난 쿼터는 "무실점"을 눌러 결과를 남긴다(TheirScoreStepper).
 */
export default function ResultEditor({ matchId, quarterCount, scores, goals, squad, members }: Props) {
  return (
    <ul className="flex flex-col gap-3">
      {Array.from({ length: quarterCount }, (_, index) => index + 1).map((quarter) => {
        const theirs = scores.find((score) => score.number === quarter)?.theirScore;
        const scored = goals.filter((goal) => goal.quarter === quarter);
        const playedIds = new Set(
          (squad.find((saved) => saved.number === quarter)?.slots ?? []).flatMap((slot) => (slot.memberId ? [slot.memberId] : [])),
        );
        const played = members.filter((member) => playedIds.has(member.id));
        const others = members.filter((member) => !playedIds.has(member.id));
        const recorded = theirs !== undefined || scored.length > 0;

        return (
          <li key={quarter} className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <p className="text-sm font-semibold">
              {quarter}쿼터{" "}
              <span className={recorded ? "tabular-nums" : "text-text-tertiary"}>
                {recorded ? `${scored.length} : ${theirs ?? 0}` : "기록 없음"}
              </span>
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-text-secondary">상대 점수</span>
              <TheirScoreStepper action={setTheirScore} matchId={matchId} quarter={quarter} theirs={theirs} hasGoals={scored.length > 0} />
            </div>
            {scored.length > 0 && (
              <ul className="flex flex-col gap-1">
                {scored.map((goal) => (
                  <li key={goal.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {goal.scorerId === null ? "득점자 모름" : (goal.scorerName ?? "알 수 없음")}
                      {goal.assistName && <span className="text-xs text-text-secondary"> (도움 {goal.assistName})</span>}
                    </span>
                    <span className="shrink-0">
                      <ActionButton action={removeGoal} fields={{ matchId, goalId: goal.id }} label="지우기" tone="danger" />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <AddGoalForm action={addGoal} matchId={matchId} quarter={quarter} played={played} others={others} />
          </li>
        );
      })}
    </ul>
  );
}
