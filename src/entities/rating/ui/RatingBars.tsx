import { RATING_ATTRIBUTES, RATING_MAX, ratingTone, type RatingTone, type RatingValues } from "../model/rating";

const FILL: Record<RatingTone, string> = {
  best: "bg-fit-best",
  good: "bg-fit-good",
  fair: "bg-fit-fair",
  poor: "bg-fit-poor",
};

/**
 * 능력치를 막대와 숫자로(선수 정보 툴팁 · 스쿼드 빌더의 고른 선수). 막대 길이는 10점 만점 기준이고 색은 점수 단계다.
 * 매기지 않은 항목은 막대 없이 "–", 골키퍼는 매겼을 때만 보인다(선택 항목).
 */
export default function RatingBars({ values }: { values: RatingValues }) {
  const shown = RATING_ATTRIBUTES.filter(({ key }) => key !== "goalkeeping" || values.goalkeeping !== null);
  return (
    <dl className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1 text-xs">
      {shown.map(({ key, label }) => {
        const value = values[key];
        const tone = ratingTone(value);
        return (
          <div key={key} className="contents">
            <dt className="text-text-secondary">{label}</dt>
            <dd className="flex items-center gap-2">
              {value === null || tone === null ? (
                <span className="h-1.5 flex-1 rounded-full bg-bg-base" />
              ) : (
                <div
                  role="meter"
                  aria-label={label}
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={RATING_MAX}
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-base"
                >
                  <div className={`h-full rounded-full ${FILL[tone]}`} style={{ width: `${(value / RATING_MAX) * 100}%` }} />
                </div>
              )}
              <span className="w-5 text-right font-bold tabular-nums">{value ?? "–"}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
