"use client";

import { isFocusStyle, type AssignStyle } from "@/entities/squad";
import { useConfirm } from "@/shared/ui";

type Kind = AssignStyle["kind"];

const OPTIONS: { kind: Kind; label: string; note: string }[] = [
  { kind: "default", label: "기본", note: "출전 시간만 공평하게 나눠요. 능력치는 보지 않아요." },
  { kind: "balanced", label: "균등", note: "쿼터마다 전력이 비슷하게 나눠요." },
  { kind: "front", label: "초반 집중", note: "앞 쿼터일수록 잘하는 사람을 몰아요." },
  { kind: "back", label: "후반 집중", note: "뒤 쿼터일수록 잘하는 사람을 몰아요." },
  { kind: "focus", label: "쿼터 지정", note: "고른 쿼터에 잘하는 사람을 몰아요." },
];

const WHERE: Partial<Record<Kind, string>> = { front: "앞 쿼터", back: "뒤 쿼터", focus: "고른 쿼터" };

/** 쿼터 지정을 처음 고르면 가운데 쿼터(6쿼터면 3 · 4쿼터)를 몬다 */
const middleQuarters = (count: number) => [...new Set([Math.floor((count - 1) / 2), Math.floor(count / 2)])];

const styleOf = (kind: Kind, count: number): AssignStyle =>
  kind === "focus" ? { kind, quarters: middleQuarters(count) } : { kind };

const CHIP =
  "h-11 rounded-box border border-border-strong bg-bg-subtle px-3 text-sm font-medium aria-pressed:border-primary aria-pressed:bg-primary/15 aria-pressed:font-bold aria-pressed:text-primary";

/**
 * 자동 배치 스타일 고르기(PLAN.md §6 "자동 배치 스타일"). 집중형(초반 · 후반 · 쿼터 지정)은 일부러 몰아서
 * 이어서 오래 쉬는 사람이 생길 수 있어 고를 때 경고 창으로 한 번 더 묻는다.
 */
export default function AssignStylePicker({
  value,
  quarterCount,
  rated,
  onChange,
}: {
  value: AssignStyle;
  quarterCount: number;
  /** 능력치를 매긴 선수가 있는지. 없으면 어느 스타일이든 기본과 같다 */
  rated: boolean;
  onChange: (style: AssignStyle) => void;
}) {
  const { confirm, dialog } = useConfirm();

  const choose = async (kind: Kind) => {
    if (kind === value.kind) return;
    const next = styleOf(kind, quarterCount);
    if (isFocusStyle(next)) {
      const label = OPTIONS.find((option) => option.kind === kind)!.label;
      const ok = await confirm({
        message: `${label}은 잘하는 사람을 ${WHERE[kind]}에 몰아요. 출전 수는 그대로지만, 일부 선수는 3쿼터 넘게 이어서 쉴 수 있어요. 이 스타일로 할까요?`,
        confirmLabel: "이 스타일로",
      });
      if (!ok) return;
    }
    onChange(next);
  };

  const toggleQuarter = (quarter: number) => {
    if (value.kind !== "focus") return;
    const has = value.quarters.includes(quarter);
    if (has && value.quarters.length === 1) return; // 하나는 남긴다
    const quarters = has ? value.quarters.filter((item) => item !== quarter) : [...value.quarters, quarter].sort((a, b) => a - b);
    onChange({ kind: "focus", quarters });
  };

  return (
    <fieldset>
      <legend className="text-xs font-semibold text-text-secondary">자동 배치 스타일</legend>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {OPTIONS.map((option) => (
          <button
            key={option.kind}
            type="button"
            aria-pressed={value.kind === option.kind}
            onClick={() => void choose(option.kind)}
            className={CHIP}
          >
            {option.label}
          </button>
        ))}
      </div>
      {value.kind === "focus" && (
        <div role="group" aria-label="전력을 몰 쿼터" className="mt-1.5 flex flex-wrap gap-1.5">
          {Array.from({ length: quarterCount }, (_, quarter) => (
            <button
              key={quarter}
              type="button"
              aria-pressed={value.quarters.includes(quarter)}
              onClick={() => toggleQuarter(quarter)}
              className={`${CHIP} min-w-11 px-2`}
            >
              {quarter + 1}쿼터
            </button>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-xs text-text-tertiary">
        {rated
          ? OPTIONS.find((option) => option.kind === value.kind)!.note
          : "능력치를 매긴 선수가 없어 어느 스타일이든 기본과 같아요. 능력치는 관리 › 멤버 › 선수 상세에서 매겨요."}
      </p>
      {dialog}
    </fieldset>
  );
}
