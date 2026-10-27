import type { ReactNode } from "react";
import { RESPONSE_LABELS } from "@/entities/attendance";
import { ActionButton } from "@/shared/ui";
import { confirmFromSquad, setAttended } from "../api/actions";
import { addableMembers, squadDefaults, type ConfirmRow } from "../model/confirm";
import AddAttendee from "./AddAttendee";

type Props = {
  matchId: string;
  rows: ConfirmRow[];
  members: { id: string; realName: string }[];
  hasSquad: boolean;
  /** 한꺼번에 확정할 기준의 이름: 축구는 "스쿼드", 풋살은 "팀 명단" */
  squadLabel?: string;
  /** 이름 앞 ! 단추(선수 정보, 멤버 id → 단추) */
  tips?: Readonly<Record<string, ReactNode>>;
};

const STATE = { true: "출석", false: "불참", null: "미확정" } as const;

/** 매치 후 실제 출석을 정한다. 참석률·노쇼율 통계가 이 값을 쓴다(PLAN.md §10 2차). */
export default function AttendanceConfirm({ matchId, rows, members, hasSquad, squadLabel = "스쿼드", tips }: Props) {
  const confirmed = rows.filter((row) => row.attended !== null).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-secondary">
        {confirmed}/{rows.length}명 확정
      </p>
      {hasSquad && (
        <ActionButton
          action={confirmFromSquad}
          fields={{ matchId, rows: JSON.stringify(squadDefaults(rows)) }}
          label={`${squadLabel}대로 확정`}
          tone="primary"
          confirmMessage={`${squadLabel}에 든 사람은 출석, 아닌 사람은 불참으로 정할까요? 하나씩 다시 고칠 수 있어요.`}
        />
      )}
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.memberId} className="flex items-center justify-between gap-2 rounded-box border border-border px-3 py-2">
            <span className="min-w-0 text-sm">
              {tips?.[row.memberId] && <span className="mr-1 inline-flex align-middle">{tips[row.memberId]}</span>}
              {row.jerseyNumber !== null && <span className="mr-1 text-xs text-text-tertiary tabular-nums">{row.jerseyNumber}</span>}
              <span className="font-semibold">{row.realName}</span>
              <span className="ml-1.5 text-xs text-text-tertiary">
                {row.response ? `투표 ${RESPONSE_LABELS[row.response]}` : "투표 없음"}
                {row.inSquad && " · 스쿼드"}
              </span>
              <span className="block text-xs text-text-secondary">{STATE[String(row.attended) as keyof typeof STATE]}</span>
            </span>
            <span className="grid w-36 shrink-0 grid-cols-2 gap-1">
              <ActionButton
                action={setAttended}
                fields={{ matchId, memberId: row.memberId, attended: row.attended === true ? "null" : "true" }}
                label={row.attended === true ? "출석 ✓" : "출석"}
                tone={row.attended === true ? "primary" : "neutral"}
              />
              <ActionButton
                action={setAttended}
                fields={{ matchId, memberId: row.memberId, attended: row.attended === false ? "null" : "false" }}
                label={row.attended === false ? "불참 ✓" : "불참"}
                tone={row.attended === false ? "danger" : "neutral"}
              />
            </span>
          </li>
        ))}
      </ul>
      <AddAttendee matchId={matchId} members={addableMembers(members, rows)} />
    </div>
  );
}
