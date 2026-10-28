"use client";

import { useActionState, useId, useState } from "react";
import { fieldClass, MissingHint, Select, SubmitButton, useToast, type ActionState } from "@/shared/ui";
import { MANUAL_CATEGORIES } from "../model/entrySchema";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** 오늘(YYYY-MM-DD). 날짜 칸의 처음 값 */
  today: string;
};

/**
 * 장부에 직접 적기(PLAN.md §10): 구장비 · 용품 · 기타 수입 · 지출. 월회비 · 경기비 · 벌금은 체크표의 받음으로만 남긴다.
 * 적고 나면 금액 · 메모를 비워 다음 줄을 받는다(날짜 · 항목은 그대로).
 */
export default function EntryForm({ action, today }: Props) {
  const id = useId();
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const { show, toast } = useToast();
  const [state, formAction] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.error === undefined) {
      show("적었어요.");
      setAmount("");
      setMemo("");
    }
    return result;
  }, {});

  const missing = [date === "" ? "날짜" : null, category === "" ? "항목" : null, amount.trim() === "" ? "금액" : null].filter(
    (item): item is string => item !== null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-date`} className="text-sm font-semibold">
            날짜
          </label>
          <input
            id={`${id}-date`}
            type="date"
            name="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClass("md", "mt-2")}
          />
        </div>
        <div>
          <label htmlFor={`${id}-category`} className="text-sm font-semibold">
            항목
          </label>
          <Select id={`${id}-category`} name="category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2">
            <option value="">고르기</option>
            <optgroup label="지출">
              {MANUAL_CATEGORIES.filter(({ income }) => !income).map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </optgroup>
            <optgroup label="수입">
              {MANUAL_CATEGORIES.filter(({ income }) => income).map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </optgroup>
          </Select>
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-amount`} className="text-sm font-semibold">
          금액(원)
        </label>
        <input
          id={`${id}-amount`}
          name="amount"
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="예: 120000"
          className={fieldClass("md", "mt-2")}
        />
      </div>
      <div>
        <label htmlFor={`${id}-memo`} className="text-sm font-semibold">
          메모 <span className="font-normal text-text-tertiary">(선택)</span>
        </label>
        <input
          id={`${id}-memo`}
          name="memo"
          value={memo}
          maxLength={100}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="예: 10월 구장 대관"
          className={fieldClass("md", "mt-2")}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton
        disabled={missing.length > 0}
        className="h-11 w-full rounded-box bg-primary text-sm font-semibold text-primary-contrast disabled:opacity-40"
      >
        장부에 적기
      </SubmitButton>
      <MissingHint items={missing} />
      {toast}
    </form>
  );
}
