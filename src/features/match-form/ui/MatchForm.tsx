"use client";

import { useActionState, useState } from "react";
import { quarterSchedule } from "@/entities/match";
import { fieldClass, Select, SubmitButton } from "@/shared/ui";
import { DEFAULT_MATCH_FORM, type MatchField, type MatchFormState, type MatchFormValues } from "../model/matchSchema";

type Props = {
  action: (state: MatchFormState, formData: FormData) => Promise<MatchFormState>;
  submitLabel: string;
  initial?: MatchFormValues;
  /** 고칠 때만 */
  matchId?: string;
};

const input = fieldClass("lg", "mt-2");
const QUARTER_COUNTS = Array.from({ length: 12 }, (_, index) => String(index + 1));

/** 쿼터 시작 시각 미리보기. 시간이 맞지 않으면 null */
const previewOf = ({ startsAt, endsAt, quarterCount }: MatchFormValues) => {
  if (!/^\d{2}:\d{2}$/.test(startsAt) || !/^\d{2}:\d{2}$/.test(endsAt) || endsAt <= startsAt) return null;
  return quarterSchedule({ startsAt, endsAt, quarterCount: Number(quarterCount) })
    .map((quarter) => quarter.startsAt)
    .join(" · ");
};

export default function MatchForm({ action, submitLabel, initial = DEFAULT_MATCH_FORM, matchId }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [values, setValues] = useState(initial);
  const set = (field: MatchField) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));
  const error = (field: MatchField) =>
    state.errors?.[field] ? <p className="mt-2 text-sm text-danger">{state.errors[field]}</p> : null;
  const preview = previewOf(values);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {matchId && <input type="hidden" name="matchId" value={matchId} />}

      <div>
        <label htmlFor="date" className="text-sm font-semibold">
          날짜
        </label>
        <input id="date" name="date" type="date" value={values.date} onChange={set("date")} className={input} />
        {error("date")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="startsAt" className="text-sm font-semibold">
            시작
          </label>
          <input id="startsAt" name="startsAt" type="time" value={values.startsAt} onChange={set("startsAt")} className={input} />
          {error("startsAt")}
        </div>
        <div>
          <label htmlFor="endsAt" className="text-sm font-semibold">
            끝
          </label>
          <input id="endsAt" name="endsAt" type="time" value={values.endsAt} onChange={set("endsAt")} className={input} />
          {error("endsAt")}
        </div>
      </div>

      <div>
        <label htmlFor="quarterCount" className="text-sm font-semibold">
          쿼터 수
        </label>
        <Select
          id="quarterCount"
          name="quarterCount"
          value={values.quarterCount}
          onChange={set("quarterCount")}
          className="mt-2"
        >
          {QUARTER_COUNTS.map((count) => (
            <option key={count} value={count}>
              {count}쿼터
            </option>
          ))}
        </Select>
        <p className="mt-2 text-xs text-text-tertiary">쿼터 시작</p>
        <p className="text-sm text-text-secondary">{preview ?? "시간을 확인해 주세요."}</p>
        {error("quarterCount")}
      </div>

      <div>
        <label htmlFor="venue" className="text-sm font-semibold">
          장소
        </label>
        <input id="venue" name="venue" value={values.venue} onChange={set("venue")} maxLength={40} className={input} />
        {error("venue")}
      </div>

      <div>
        <label htmlFor="opponent" className="text-sm font-semibold">
          상대 팀
        </label>
        <input
          id="opponent"
          name="opponent"
          value={values.opponent}
          onChange={set("opponent")}
          maxLength={30}
          className={input}
        />
        {error("opponent")}
      </div>

      <div>
        <label htmlFor="voteDeadline" className="text-sm font-semibold">
          투표 마감
        </label>
        <input
          id="voteDeadline"
          name="voteDeadline"
          type="datetime-local"
          value={values.voteDeadline}
          onChange={set("voteDeadline")}
          className={input}
        />
        <p className="mt-2 text-xs text-text-tertiary">비우면 매치가 시작할 때 마감돼요.</p>
        {error("voteDeadline")}
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}

      <SubmitButton
        className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-contrast disabled:opacity-50"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
