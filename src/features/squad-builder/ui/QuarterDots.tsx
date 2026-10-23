import type { QuarterMark } from "../model/builder";

const MARK_LABELS: Record<QuarterMark, string> = { field: "출전", keeper: "키퍼", rest: "쉼", away: "못 옴" };

const MARK_STYLE: Record<QuarterMark, string> = {
  field: "bg-kit text-kit-label",
  keeper: "bg-kakao text-kakao-label",
  rest: "border border-text-tertiary text-text-secondary",
  away: "text-text-tertiary/50",
};

/**
 * 쿼터별 출전 칸 — 출전표 한 줄. 칸마다 쿼터 번호를 적고, 필드는 유니폼 색, 키퍼는 키퍼 색으로 채운다.
 * 쉼은 빈 칸, 못 옴은 흐린 번호다. 지금 보는 쿼터는 테두리로 표시한다.
 */
export default function QuarterDots({ marks, current }: { marks: readonly QuarterMark[]; current: number }) {
  return (
    <span
      role="img"
      aria-label={marks.map((mark, index) => `${index + 1}쿼터 ${MARK_LABELS[mark]}`).join(", ")}
      className="flex items-center gap-0.5"
    >
      {marks.map((mark, index) => (
        <span
          key={index}
          className={`flex size-4 items-center justify-center rounded-chip text-[9px] leading-none font-bold tabular-nums ${MARK_STYLE[mark]} ${
            index === current ? "outline outline-offset-1 outline-text-primary" : ""
          }`}
        >
          {index + 1}
        </span>
      ))}
    </span>
  );
}
