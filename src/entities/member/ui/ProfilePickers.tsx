"use client";

import { POSITIONS, type Position } from "@/entities/position";
import { FEET, type Foot } from "../model/member";
import { isPositionLocked, toggleFoot, togglePosition } from "../model/profileRules";

const chip =
  "flex h-11 items-center justify-center gap-1.5 rounded-box border border-border px-3 text-sm font-medium aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-contrast disabled:opacity-40";

/** 주발 고르기(복수). 고른 값은 숨은 입력칸 `feet` 로 폼에 실린다. */
export function FootPicker({ value, onChange }: { value: readonly Foot[]; onChange: (next: Foot[]) => void }) {
  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {FEET.map(({ code, label }) => (
          <button key={code} type="button" aria-pressed={value.includes(code)} onClick={() => onChange(toggleFoot(value, code))} className={chip}>
            {label}
          </button>
        ))}
      </div>
      {value.map((code) => (
        <input key={code} type="hidden" name="feet" value={code} />
      ))}
    </>
  );
}

/**
 * 선호 포지션 고르기(3개, 누른 순서가 우선순위). 1순위가 골키퍼면 골키퍼 하나다 —
 * 그때와 3개를 다 고른 뒤에는 나머지 단추가 막힌다(PLAN.md §5).
 * 숨은 입력칸 `preferredPositions` 를 고른 순서대로 그려서 서버가 그 순서 그대로 받는다.
 */
export function PositionPicker({ value, onChange }: { value: readonly Position[]; onChange: (next: Position[]) => void }) {
  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {POSITIONS.map(({ code, label }) => {
          const rank = value.indexOf(code) + 1;
          return (
            <button
              key={code}
              type="button"
              aria-pressed={rank > 0}
              disabled={isPositionLocked(value, code)}
              onClick={() => onChange(togglePosition(value, code))}
              className={chip}
            >
              <span>{label}</span>
              {rank > 0 && (
                <>
                  {" "}
                  <span className="text-xs opacity-80">{rank}순위</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {value.map((code) => (
        <input key={code} type="hidden" name="preferredPositions" value={code} />
      ))}
    </>
  );
}
