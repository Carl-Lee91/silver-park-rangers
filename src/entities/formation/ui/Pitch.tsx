import type { ReactNode } from "react";

/** 잔디 줄무늬(어두운 줄)의 위쪽 y. 경기장 길이 105 를 열 줄로 나눈 홀수 줄 */
const STRIPES = [10.5, 31.5, 52.5, 73.5, 94.5];

/**
 * 세로 경기장(위가 상대 골문). 크기는 105×68m 비율이다. 자리는 `PitchSpot` 으로 얹는다.
 * 빌더(누르는 자리)와 쿼터 보드(보기만)가 같이 쓴다.
 *
 * 폭은 놓인 칸을 따르되 높이가 화면을 넘지 않게 상한(max-w-pitch)을 두고, 남는 폭은 가운데 정렬한다.
 */
export default function Pitch({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="relative mx-auto aspect-[68/105] w-full max-w-pitch overflow-hidden rounded-box bg-pitch"
    >
      <svg viewBox="0 0 68 105" aria-hidden="true" className="absolute inset-0 size-full">
        {/* 잔디 줄무늬: 열 줄 중 홀수 줄을 조금 어둡게(PLAN.md §7 "테마") */}
        <g fill="var(--color-pitch-stripe)">
          {STRIPES.map((y) => (
            <rect key={y} x="0" y={y} width="68" height="10.5" />
          ))}
        </g>
        <g fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4">
          <rect x="1.5" y="1.5" width="65" height="102" />
          <line x1="1.5" y1="52.5" x2="66.5" y2="52.5" />
          <circle cx="34" cy="52.5" r="9.15" />
          <rect x="13.84" y="1.5" width="40.32" height="16.5" />
          <rect x="24.84" y="1.5" width="18.32" height="5.5" />
          <rect x="13.84" y="87" width="40.32" height="16.5" />
          <rect x="24.84" y="98" width="18.32" height="5.5" />
        </g>
      </svg>
      {children}
    </div>
  );
}

/** 경기장 위 한 자리. x·y 는 0~100(%) */
export function PitchSpot({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
      {children}
    </div>
  );
}
