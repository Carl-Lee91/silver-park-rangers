import { fieldStrength, type RatingValues } from "../model/rating";
import RatingBars from "./RatingBars";

/** 능력치 묶음: 머리 줄(능력치 · 필드 평균)과 막대. 아직 안 매겼으면 그렇다고 적는다(선수 정보 툴팁 · 고른 선수) */
export default function RatingSummary({ values }: { values: RatingValues | null }) {
  const strength = values === null ? null : fieldStrength(values);
  return (
    <div>
      <p className="mb-1.5 flex justify-between text-xs font-bold text-text-secondary">
        <span>능력치</span>
        {strength !== null && <span className="tabular-nums">평균 {strength.toFixed(1)}</span>}
      </p>
      {values === null ? <p className="text-xs text-text-tertiary">능력치를 아직 매기지 않았어요.</p> : <RatingBars values={values} />}
    </div>
  );
}
