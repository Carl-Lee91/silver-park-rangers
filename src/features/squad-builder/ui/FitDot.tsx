import { FIT_LABELS, type Fit } from "../model/fit";

/** 적합도 색. 점(bg) · 자리 테두리(ring) · 글자(text) */
export const FIT_DOT: Record<Fit, string> = {
  best: "bg-fit-best",
  good: "bg-fit-good",
  fair: "bg-fit-fair",
  poor: "bg-fit-poor",
};
export const FIT_RING: Record<Fit, string> = {
  best: "ring-fit-best",
  good: "ring-fit-good",
  fair: "ring-fit-fair",
  poor: "ring-fit-poor",
};
const FIT_TEXT: Record<Fit, string> = {
  best: "text-fit-best",
  good: "text-fit-good",
  fair: "text-fit-fair",
  poor: "text-fit-poor",
};

type Props = {
  fit: Fit;
  /** 순위 글자를 보이게 둔다. 아니면 화면 읽기 프로그램에만 읽힌다(색만으로 알리지 않게) */
  showLabel?: boolean;
  className?: string;
};

/** 자리 적합도 점(풋볼매니저의 포지션 익숙도). 1순위 초록 · 2순위 연두 · 3순위 노랑 · 선호 아님 빨강 */
export default function FitDot({ fit, showLabel = false, className = "" }: Props) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 ${className}`}>
      <span aria-hidden="true" className={`size-2 rounded-full ${FIT_DOT[fit]}`} />
      <span className={showLabel ? `text-xs font-semibold ${FIT_TEXT[fit]}` : "sr-only"}>{FIT_LABELS[fit]}</span>
    </span>
  );
}
