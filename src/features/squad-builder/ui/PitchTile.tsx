import { Jersey } from "@/entities/formation";
import type { Position } from "@/entities/position";
import { FIT_LABELS, type Fit } from "../model/fit";
import FitDot, { FIT_STROKE } from "./FitDot";

type Props = {
  position: Position;
  /** 등번호. 없으면 유니폼에 포지션을 넣는다 */
  number: number | null;
  /** 이름. 빈자리면 null */
  name: string | null;
  keeper: boolean;
  /** 앉은 사람에게 이 자리가 맞는 정도 */
  fit: Fit | null;
  /** 고른 선수에게 이 자리가 맞는 정도. 풋볼매니저가 자리를 추천하듯 유니폼 테두리 색으로 보인다. 맞지 않으면 null */
  candidate: Fit | null;
  selected: boolean;
  noted: boolean;
};

/**
 * 경기장 위 한 자리(SlotButton 안). 유니폼 안에 등번호를 넣고, 자리 포지션은 유니폼 왼쪽 위에 작게 둔다
 * (번호가 없으면 유니폼에 포지션). 이름표 앞 점은 그 자리가 앉은 사람의 선호 몇 순위인지다.
 */
export default function PitchTile({ position, number, name, keeper, fit, candidate, selected, noted }: Props) {
  const highlight = selected ? "stroke-text-primary" : candidate !== null ? FIT_STROKE[candidate] : undefined;
  const numbered = name !== null && number !== null;

  return (
    <>
      <span className="relative">
        {numbered && (
          <span className="absolute -top-1.5 -left-4 z-10 rounded-chip bg-bg-base/90 px-1 text-[9px] leading-tight font-bold text-text-secondary">
            {position}
          </span>
        )}{" "}
        <Jersey
          label={numbered ? String(number) : position}
          tone={name === null ? "empty" : keeper ? "keeper" : "kit"}
          highlight={highlight}
        />
      </span>{" "}
      <span className="flex max-w-18 items-center gap-1 rounded-chip bg-bg-base/85 px-1 py-px text-[11px] text-text-primary">
        <span className="truncate">
          {name ?? "빈자리"}
          {noted && " ✎"}
        </span>
        {fit !== null && <FitDot fit={fit} className="order-first" />}
      </span>
      {candidate !== null && <span className="sr-only"> 고른 선수 {FIT_LABELS[candidate]}</span>}
    </>
  );
}
