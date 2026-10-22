import { FIT_LABELS, type Fit } from "../model/fit";
import { FIT_DOT } from "./FitDot";

const ORDER: readonly Fit[] = ["best", "good", "fair", "poor"];

/** 자리 적합도 점의 뜻. 색만으로는 무엇인지 알 수 없어서(색각 이상이면 빨강·초록도 구분이 어렵다) 경기장 아래에 둔다. */
export default function FitLegend() {
  return (
    <ul aria-label="자리 적합도" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
      {ORDER.map((fit) => (
        <li key={fit} className="inline-flex items-center gap-1">
          <span aria-hidden="true" className={`size-2 rounded-full ${FIT_DOT[fit]}`} />
          {FIT_LABELS[fit]}
        </li>
      ))}
    </ul>
  );
}
