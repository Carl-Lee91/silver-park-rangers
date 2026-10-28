"use client";

import { useActionState, useId, useState } from "react";
import { RESPONSE_LABELS, type AttendanceResponse } from "@/entities/attendance";
import { MissingHint, Select, SubmitButton, type ActionState } from "@/shared/ui";
import type { ProxyChoice } from "../model/proxyVote";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  matchId: string;
  /** 고를 사람(아직 투표 안 한 사람 먼저, `proxyVoteChoices`) */
  choices: readonly ProxyChoice[];
};

const RESPONSES: AttendanceResponse[] = ["yes", "maybe", "no"];

/**
 * 대신 투표(PLAN.md §4). 단톡방에 "참석"이라고만 쓰는 사람을 관리자가 대신 남긴다. 남기고 나면 사람 칸을 비워
 * 다음 사람을 받는다.
 */
export default function ProxyVoteForm({ action, matchId, choices }: Props) {
  const id = useId();
  const [memberId, setMemberId] = useState("");
  const [response, setResponse] = useState<AttendanceResponse | "">("");
  const [done, setDone] = useState<string | null>(null);
  const [state, formAction] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.error === undefined) {
      const label = choices.find((choice) => choice.id === formData.get("memberId"))?.label.split(" · ")[0] ?? "";
      setDone(`${label} → ${RESPONSE_LABELS[formData.get("response") as AttendanceResponse]}으로 남겼어요.`);
      setMemberId("");
      setResponse("");
    }
    return result;
  }, {});

  const missing = [memberId === "" ? "누구 대신" : null, response === "" ? "참석 여부" : null].filter(
    (item): item is string => item !== null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="response" value={response} />
      <div>
        <label htmlFor={`${id}-member`} className="text-sm font-semibold">
          누구 대신
        </label>
        <Select
          id={`${id}-member`}
          name="memberId"
          value={memberId}
          onChange={(event) => {
            setMemberId(event.target.value);
            setDone(null);
          }}
          className="mt-2"
        >
          <option value="">사람 고르기</option>
          {choices.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {choice.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {RESPONSES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={response === option}
            onClick={() => setResponse(option)}
            className="h-11 rounded-box border border-border-strong bg-bg-subtle text-sm font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:font-bold aria-pressed:text-primary-contrast"
          >
            {RESPONSE_LABELS[option]}
          </button>
        ))}
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {done && <p className="text-sm text-text-secondary">{done}</p>}
      <SubmitButton
        disabled={missing.length > 0}
        className="h-11 w-full rounded-box bg-primary text-sm font-semibold text-primary-contrast disabled:opacity-40"
      >
        대신 투표
      </SubmitButton>
      <MissingHint items={missing} />
    </form>
  );
}
