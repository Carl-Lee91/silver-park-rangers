import type { QuarterMark } from "../model/builder";

const MARK_LABELS: Record<QuarterMark, string> = { field: "출전", keeper: "키퍼", rest: "쉼", away: "못 옴" };

const MARK_STYLE: Record<QuarterMark, string> = {
  field: "size-2 rounded-full bg-kit",
  keeper: "size-2 rounded-full bg-kakao",
  rest: "size-2 rounded-full border border-text-tertiary",
  away: "h-px w-2 bg-text-tertiary",
};

/** 쿼터별 출전 점 — 출전표 한 줄. 필드는 유니폼 색, 키퍼는 키퍼 색, 쉼은 빈 동그라미, 못 옴은 줄. 지금 쿼터에 밑줄 */
export default function QuarterDots({ marks, current }: { marks: readonly QuarterMark[]; current: number }) {
  return (
    <span
      role="img"
      aria-label={marks.map((mark, index) => `${index + 1}쿼터 ${MARK_LABELS[mark]}`).join(", ")}
      className="flex items-center gap-1"
    >
      {marks.map((mark, index) => (
        <span
          key={index}
          className={`flex h-3 w-2.5 items-center justify-center ${index === current ? "border-b border-text-secondary" : ""}`}
        >
          <span className={MARK_STYLE[mark]} />
        </span>
      ))}
    </span>
  );
}
