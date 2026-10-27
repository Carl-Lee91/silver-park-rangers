"use client";

import { useActionState, useId, useState } from "react";
import { RATING_ATTRIBUTES, RATING_KEYS, RATING_MAX, ratingTone, type RatingKey, type RatingTone, type RatingValues } from "@/entities/rating";
import { HelpTip, Select, SubmitButton, useToast, type ActionState } from "@/shared/ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  memberId: string;
  initial: RatingValues;
};

type FormValues = Record<RatingKey, string>;

const TONE_TEXT: Record<RatingTone, string> = {
  best: "text-fit-best",
  good: "text-fit-good",
  fair: "text-fit-fair",
  poor: "text-fit-poor",
};

const LEGEND: { tone: RatingTone; label: string; dot: string }[] = [
  { tone: "best", label: "9~10 팀 최고", dot: "bg-fit-best" },
  { tone: "good", label: "7~8 잘함", dot: "bg-fit-good" },
  { tone: "fair", label: "4~6 평균", dot: "bg-fit-fair" },
  { tone: "poor", label: "1~3 약함", dot: "bg-fit-poor" },
];

/** 위에서부터 10 → 1. 잘하는 사람을 먼저 고르기 쉽게 */
const SCORES = Array.from({ length: RATING_MAX }, (_, index) => String(RATING_MAX - index));

const toForm = (values: RatingValues): FormValues =>
  Object.fromEntries(RATING_KEYS.map((key) => [key, values[key] === null ? "" : String(values[key])])) as FormValues;

const fromForm = (formData: FormData): FormValues =>
  Object.fromEntries(RATING_KEYS.map((key) => [key, String(formData.get(key) ?? "")])) as FormValues;

/**
 * 능력치 매기기(PLAN.md §5 "능력치", 관리자 전용). 풋볼매니저 능력치 표처럼 항목마다 숫자에 색을 붙이고,
 * 이름 옆 ? 단추로 무엇을 보는지 알려 준다. 매기지 않은 칸은 "미평가"다(0 이 아니다).
 */
export default function RatingForm({ action, memberId, initial }: Props) {
  const id = useId();
  const [values, setValues] = useState<FormValues>(() => toForm(initial));
  const [saved, setSaved] = useState<FormValues>(() => toForm(initial));
  const { show, toast } = useToast();
  const [state, formAction] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (!result.error) {
      setSaved(fromForm(formData));
      show("능력치를 저장했어요.");
    }
    return result;
  }, {});
  const dirty = RATING_KEYS.some((key) => values[key] !== saved[key]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="memberId" value={memberId} />
      <ul aria-label="점수 기준" className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
        {LEGEND.map((item) => (
          <li key={item.tone} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-2 rounded-full ${item.dot}`} />
            {item.label}
          </li>
        ))}
      </ul>

      <div className="flex flex-col divide-y divide-border">
        {RATING_ATTRIBUTES.map(({ key, label, help }) => {
          const value = values[key] === "" ? null : Number(values[key]);
          const tone = ratingTone(value);
          return (
            <div key={key} className="grid grid-cols-[minmax(0,1fr)_2.5rem_7.5rem] items-center gap-3 py-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <label htmlFor={`${id}-${key}`} className="font-semibold">
                  {label}
                </label>
                <HelpTip label={label}>{help}</HelpTip>
              </div>
              <span
                data-testid={`rating-${key}`}
                className={`text-right text-xl font-extrabold tabular-nums ${tone ? TONE_TEXT[tone] : "text-text-tertiary"}`}
              >
                {value ?? "–"}
              </span>
              <Select
                id={`${id}-${key}`}
                name={key}
                value={values[key]}
                onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                fieldSize="md"
              >
                <option value="">미평가</option>
                {SCORES.map((score) => (
                  <option key={score} value={score}>
                    {score}
                  </option>
                ))}
              </Select>
            </div>
          );
        })}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton
        disabled={!dirty}
        className="h-12 w-full rounded-box bg-primary text-base font-bold text-primary-contrast disabled:opacity-40"
      >
        능력치 저장
      </SubmitButton>
      {toast}
    </form>
  );
}
