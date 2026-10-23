/**
 * 하위 탭(쿼터 탭 · 기간 탭 · 이미지 탭) 모양(PLAN.md §7 "테마"). 풋볼매니저처럼 고른 탭은 굵은 글자에
 * 하늘색 밑줄이다. 버튼 탭은 aria-selected, 링크 탭은 aria-current="page" 로 고른 것을 알린다.
 */
export const tabClass = (extra = "") =>
  [
    "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 border-b-2 border-transparent px-3 text-sm font-medium text-text-secondary",
    "aria-selected:border-primary aria-selected:font-bold aria-selected:text-text-primary",
    "aria-[current=page]:border-primary aria-[current=page]:font-bold aria-[current=page]:text-text-primary",
    extra,
  ]
    .filter(Boolean)
    .join(" ");

export type ChipTone = "accent" | "warn" | "muted" | "danger" | "good";

const CHIP_TONES: Record<ChipTone, string> = {
  accent: "bg-primary/15 text-primary",
  warn: "bg-fit-fair/15 text-fit-fair",
  muted: "bg-bg-subtle text-text-secondary",
  danger: "border border-danger text-danger",
  good: "bg-result-win/15 text-result-win",
};

/** 작은 칩(참석 · 미정 · 투표 전 · 공개됨 · D-3 같은 표시). 색만이 아니라 글자로 뜻을 적는다 */
export const chipClass = (tone: ChipTone, extra = "") =>
  ["inline-flex shrink-0 items-center rounded-chip px-2 py-0.5 text-xs font-bold whitespace-nowrap", CHIP_TONES[tone], extra]
    .filter(Boolean)
    .join(" ");
