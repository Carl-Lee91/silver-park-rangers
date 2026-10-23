/**
 * 팀 엠블럼(둥근 크레스트). 원본 assets/brand/spr_logo.png 에서 scripts/brand-icons.py 가 만든다 —
 * 파비콘 · 홈 화면 아이콘 · 미리보기 이미지도 같은 원본에서 나온다(PLAN.md §7 "테마", docs/SETUP.md "엠블럼").
 * 바깥 남색 · 흰 테두리라 하늘색 띠 위에서도, 어두운 바탕 위에서도 보인다.
 */
export const EMBLEM_SRC = "/emblem.png";

/**
 * 엠블럼. 옆에 팀 이름이나 화면 제목이 있으면 꾸밈이라 읽지 않고(label 없음),
 * 혼자 있으면 팀 이름(label)으로 읽는다. 크기는 className(size-*)으로 준다.
 */
export default function Emblem({ label, className = "size-8" }: { label?: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 미리 줄여 둔 작은 PNG 하나라 이미지 최적화가 필요 없다
    <img src={EMBLEM_SRC} alt={label ?? ""} className={`shrink-0 object-contain ${className}`} />
  );
}
