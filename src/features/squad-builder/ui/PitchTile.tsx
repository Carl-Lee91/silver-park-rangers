import type { Position } from "@/entities/position";
import { FIT_LABELS, type Fit } from "../model/fit";
import FitDot, { FIT_RING } from "./FitDot";

type Props = {
  position: Position;
  /** 등번호를 붙인 이름. 빈자리면 null */
  label: string | null;
  keeper: boolean;
  /** 앉은 사람에게 이 자리가 맞는 정도 */
  fit: Fit | null;
  /** 고른 선수에게 이 자리가 맞는 정도. 풋볼매니저가 자리를 추천하듯 테두리 색으로 보인다. 맞지 않으면 null */
  candidate: Fit | null;
  selected: boolean;
  noted: boolean;
};

/**
 * 경기장 위 한 자리(SlotButton 안). 동그라미는 포지션 코드다 — 관리자 빌더는 번호 대신 포지션을 두고
 * 이름 앞에 번호를 붙인다(PLAN.md §10 등번호). 필드는 우리 유니폼 색, 키퍼는 키퍼 색이다.
 * 이름표 앞 점은 그 자리가 앉은 사람의 선호 몇 순위인지다.
 */
export default function PitchTile({ position, label, keeper, fit, candidate, selected, noted }: Props) {
  const shirt =
    label === null
      ? "border border-dashed border-text-primary/70 bg-bg-base/30 text-text-primary"
      : keeper
        ? "bg-kakao text-kakao-label"
        : "bg-kit text-kit-label";
  const ring = selected
    ? "ring-3 ring-text-primary"
    : candidate !== null
      ? `ring-2 ring-offset-2 ring-offset-pitch ${FIT_RING[candidate]}`
      : "";

  return (
    <>
      <span className={`flex size-9 items-center justify-center rounded-full text-[11px] font-bold shadow-sm ${shirt} ${ring}`}>
        {position}
      </span>{" "}
      <span className="flex max-w-18 items-center gap-1 rounded bg-bg-base/85 px-1 py-px text-[11px] text-text-primary">
        <span className="truncate">
          {label ?? "빈자리"}
          {noted && " ✎"}
        </span>
        {fit !== null && <FitDot fit={fit} className="order-first" />}
      </span>
      {candidate !== null && <span className="sr-only"> 고른 선수 {FIT_LABELS[candidate]}</span>}
    </>
  );
}
