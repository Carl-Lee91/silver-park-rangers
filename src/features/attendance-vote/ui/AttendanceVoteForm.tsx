"use client";

import { useActionState, useState } from "react";
import { RESPONSE_LABELS, type AttendanceResponse } from "@/entities/attendance";
import { timeWindowOptions, type QuarterTime } from "@/entities/match";
import { MissingHint, Select, SubmitButton } from "@/shared/ui";
import { playableQuarters, type Vote, type VoteState } from "../model/attendanceVote";

type Props = {
  action: (state: VoteState, formData: FormData) => Promise<VoteState>;
  matchId: string;
  schedule: readonly QuarterTime[];
  /** 이미 한 투표. 없으면 null */
  current: Vote | null;
  open: boolean;
};

const RESPONSES: AttendanceResponse[] = ["yes", "maybe", "no"];

const playableSummary = (schedule: readonly QuarterTime[], quarters: number[]) => {
  if (quarters.length === 0) return "뛸 수 있는 쿼터가 없어요. 시간을 다시 골라 주세요.";
  if (quarters.length === schedule.length) return `${schedule.length}쿼터 모두 뛸 수 있어요.`;
  const from = schedule[quarters[0]].startsAt;
  const to = schedule[quarters[quarters.length - 1]].endsAt;
  return `${from}~${to} · ${quarters.length}쿼터 뛸 수 있어요.`;
};

/** 참석 · 미정 · 불참을 고르고, 오는 사람은 도착·떠나는 시간을 고른다(PLAN.md §6). */
export default function AttendanceVoteForm({ action, matchId, schedule, current, open }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [response, setResponse] = useState<AttendanceResponse | "">(current?.response ?? "");
  const [arriveAt, setArriveAt] = useState(current?.arriveAt ?? "");
  const [leaveAt, setLeaveAt] = useState(current?.leaveAt ?? "");

  const coming = response === "yes" || response === "maybe";
  const options = timeWindowOptions(schedule);
  const playable = playableQuarters(schedule, arriveAt, leaveAt);
  const missing =
    response === "" ? ["참석 · 미정 · 불참"] : coming && playable.length === 0 ? ["뛸 수 있는 시간(도착·떠나는 시간)"] : [];
  const ready = missing.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="response" value={response} />

      <div className="grid grid-cols-3 gap-2">
        {RESPONSES.map((option) => (
          <button
            key={option}
            type="button"
            disabled={!open}
            aria-pressed={response === option}
            onClick={() => setResponse(option)}
            className="h-12 rounded-xl border border-border text-base font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-contrast disabled:opacity-60"
          >
            {RESPONSE_LABELS[option]}
          </button>
        ))}
      </div>

      {coming && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="arriveAt" className="text-sm font-semibold">
                도착
              </label>
              <Select
                id="arriveAt"
                name="arriveAt"
                value={arriveAt}
                disabled={!open}
                onChange={(event) => setArriveAt(event.target.value)}
                className="mt-2"
              >
                {options.arrive.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="leaveAt" className="text-sm font-semibold">
                떠나는 시간
              </label>
              <Select
                id="leaveAt"
                name="leaveAt"
                value={leaveAt}
                disabled={!open}
                onChange={(event) => setLeaveAt(event.target.value)}
                className="mt-2"
              >
                {options.leave.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <p className="text-sm text-text-secondary">{playableSummary(schedule, playable)}</p>
        </>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      {open ? (
        <>
          <SubmitButton
            disabled={!ready}
            className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-contrast disabled:opacity-40"
          >
            {current ? "투표 바꾸기" : "투표하기"}
          </SubmitButton>
          <MissingHint items={missing} />
        </>
      ) : (
        <p className="text-sm text-text-secondary">투표가 마감됐어요.</p>
      )}
    </form>
  );
}
