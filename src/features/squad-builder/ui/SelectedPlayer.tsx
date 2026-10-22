import type { ReactNode } from "react";
import type { Fit } from "../model/fit";
import FitDot from "./FitDot";

type Props = {
  title: string;
  /** 선호 포지션 · 주발 · 시간 */
  details: string | null;
  /** 자리에서 골랐으면 그 자리가 맞는 정도 */
  fit: Fit | null;
  /** 다음에 무엇을 누르면 되는지 */
  hint: string;
  /** 자리에서 고른 사람만 뺄 수 있다 */
  onRemove?: () => void;
  /** 시간·메모 편집기 */
  children?: ReactNode;
};

/** 고른 선수(또는 자리). 풋볼매니저에서 선수를 누르면 뜨는 정보 칸처럼 선수 표 위에 놓인다. */
export default function SelectedPlayer({ title, details, fit, hint, onRemove, children }: Props) {
  return (
    <section aria-label="고른 선수" className="flex flex-col gap-3 rounded-xl border border-primary/50 bg-bg-subtle/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            <span className="truncate">{title}</span>
            {fit !== null && <FitDot fit={fit} showLabel />}
          </p>
          {details && <p className="mt-0.5 text-xs text-text-secondary">{details}</p>}
          <p className="mt-1 text-xs text-text-tertiary">{hint}</p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="h-11 shrink-0 rounded-xl border border-border px-4 text-sm font-semibold text-danger"
          >
            빼기
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
