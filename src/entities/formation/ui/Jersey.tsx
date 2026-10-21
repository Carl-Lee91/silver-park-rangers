import { JERSEY_PATH, JERSEY_VIEWBOX } from "../model/jersey";

export type JerseyTone = "kit" | "keeper" | "empty";

const TONES: Record<JerseyTone, { body: string; outline: string }> = {
  kit: { body: "fill-kit text-kit-label", outline: "stroke-bg-base/40" },
  keeper: { body: "fill-kakao text-kakao-label", outline: "stroke-bg-base/40" },
  empty: { body: "fill-bg-base/30 text-text-primary", outline: "stroke-text-primary/70" },
};

type Props = {
  /** 등번호. 번호가 없으면 포지션 코드 */
  label: string;
  tone: JerseyTone;
  /** 테두리를 굵게 강조할 색(stroke-* 클래스). 고른 자리 · 추천 자리에 쓴다 */
  highlight?: string;
  /** 크기(size-*) */
  className?: string;
};

/**
 * 경기장 위 선수 — 유니폼 모양 안에 등번호. 필드는 우리 유니폼 색, 키퍼는 키퍼 색, 빈자리는 점선이다
 * (PLAN.md §7 "유니폼 색"). 쿼터 보드 · 스쿼드 빌더 · 포메이션 미리보기가 같이 쓴다.
 */
export default function Jersey({ label, tone, highlight, className = "size-10" }: Props) {
  return (
    <span
      data-jersey={tone}
      className={`relative inline-flex shrink-0 items-center justify-center ${TONES[tone].body} ${className}`}
    >
      <svg viewBox={JERSEY_VIEWBOX} aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
        <path
          d={JERSEY_PATH}
          strokeLinejoin="round"
          strokeWidth={highlight ? 2.5 : 1.2}
          strokeDasharray={tone === "empty" ? "3 2" : undefined}
          className={highlight ?? TONES[tone].outline}
        />
      </svg>
      <span className="relative mt-1 text-[11px] leading-none font-bold tabular-nums">{label}</span>
    </span>
  );
}
