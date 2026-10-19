import type { ReactNode } from "react";

/**
 * 세로 경기장(위가 상대 골문). 크기는 105×68m 비율이다. 자리는 `PitchSpot` 으로 얹는다.
 * 빌더(누르는 자리)와 쿼터 보드(보기만)가 같이 쓴다.
 */
export default function Pitch({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div role="group" aria-label={label} className="relative aspect-[68/105] w-full overflow-hidden rounded-xl bg-pitch">
      <svg viewBox="0 0 68 105" aria-hidden="true" className="absolute inset-0 size-full">
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
