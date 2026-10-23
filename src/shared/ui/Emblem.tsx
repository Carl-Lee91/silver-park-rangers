/**
 * 팀 엠블럼 파일. 지금은 임시 "SPR" 방패다 — 팀 엠블럼을 받으면 이 파일(public/emblem.svg)을 바꾼다
 * (PLAN.md §7 "테마", docs/SETUP.md). 하늘색 띠 위에서도, 어두운 바탕 위에서도 보이게 남색 방패에 하늘색 테두리다.
 */
export const EMBLEM_SRC = "/emblem.svg";

/**
 * 엠블럼. 옆에 팀 이름이나 화면 제목이 있으면 꾸밈이라 읽지 않고(label 없음),
 * 혼자 있으면 팀 이름(label)으로 읽는다. 크기는 className(h-*, w-*)으로 준다.
 */
export default function Emblem({ label, className = "h-8 w-7" }: { label?: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 작은 SVG 하나라 이미지 최적화가 필요 없다
    <img src={EMBLEM_SRC} alt={label ?? ""} className={`shrink-0 object-contain ${className}`} />
  );
}
