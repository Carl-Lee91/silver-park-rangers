"use client";

import { useState } from "react";
import { formatMatchDate } from "@/entities/match";
import type { MatchTrendPoint } from "@/entities/stats";

const HEIGHT = 140;
const BAR_MAX = 24;

const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
const describe = (point: MatchTrendPoint) =>
  point.attended === null
    ? `참석 투표 ${point.yes}명 · 출석 미확정`
    : `실제 출석 ${point.attended}명${point.guestsAttended ? `(용병 ${point.guestsAttended})` : ""} · 참석 투표 ${point.yes}명`;

/**
 * 매치별 실제 출석 인원(용병 포함). 시리즈가 하나라 범례 대신 제목이 무엇을 그렸는지 말한다.
 * 값은 최댓값과 마지막 매치에만 붙이고, 나머지는 막대를 누르면(또는 포커스하면) 보인다.
 * 출석을 정하지 않은 매치는 막대 없이 "–" 로 둔다.
 */
export default function AttendanceTrendChart({ trend }: { trend: readonly MatchTrendPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  if (trend.length === 0) return <p className="text-sm text-text-tertiary">기간 안에 지난 매치가 없어요.</p>;

  const values = trend.map((point) => point.attended ?? 0);
  const top = Math.max(10, Math.ceil(Math.max(...values) / 5) * 5);
  const maxIndex = values.indexOf(Math.max(...values));
  const lastConfirmed = trend.map((point) => point.attended !== null).lastIndexOf(true);
  const labelled = new Set([maxIndex, lastConfirmed]);
  const shown = active === null ? null : trend[active];

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-semibold">매치별 실제 출석</figcaption>
      <p className="min-h-5 text-xs text-text-secondary" aria-live="polite">
        {shown ? `${formatMatchDate(shown.date)}${shown.opponent ? ` vs ${shown.opponent}` : ""} — ${describe(shown)}` : "막대를 누르면 자세히 보여요."}
      </p>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-right text-[10px] text-text-tertiary" style={{ height: HEIGHT }}>
          <span>{top}</span>
          <span>{top / 2}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1" style={{ height: HEIGHT }}>
          {[0, 0.5, 1].map((ratio) => (
            <div key={ratio} className="absolute inset-x-0 border-t border-border" style={{ top: `${ratio * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-0.5">
            {trend.map((point, index) => {
              const height = point.attended === null ? 0 : (point.attended / top) * HEIGHT;
              return (
                <button
                  key={point.matchId}
                  type="button"
                  aria-label={`${formatMatchDate(point.date)} ${describe(point)}`}
                  aria-pressed={active === index}
                  // 누르면 포커스가 먼저 열고, 클릭이 다시 닫으면 안 된다 — 늘 연다.
                  onClick={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  className="relative flex h-full flex-1 flex-col items-center justify-end outline-offset-2"
                >
                  {labelled.has(index) && point.attended !== null && (
                    <span className="mb-0.5 text-[10px] font-semibold text-text-primary">{point.attended}</span>
                  )}
                  {point.attended === null ? (
                    <span className="text-[10px] text-text-tertiary">–</span>
                  ) : (
                    <span
                      className={`w-full rounded-t-[4px] bg-primary ${active === index ? "opacity-70" : ""}`}
                      style={{ height, maxWidth: BAR_MAX }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex justify-between pl-6 text-[10px] text-text-tertiary">
        <span>{shortDate(trend[0].date)}</span>
        {trend.length > 1 && <span>{shortDate(trend[trend.length - 1].date)}</span>}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-text-secondary">표로 보기</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-text-secondary">
            <tr>
              <th className="py-1 font-medium">날짜</th>
              <th className="py-1 font-medium">참석 투표</th>
              <th className="py-1 font-medium">실제 출석</th>
            </tr>
          </thead>
          <tbody>
            {trend.map((point) => (
              <tr key={point.matchId} className="border-t border-border">
                <td className="py-1">{formatMatchDate(point.date)}</td>
                <td className="py-1">{point.yes}</td>
                <td className="py-1">
                  {point.attended === null ? "미확정" : `${point.attended}${point.guestsAttended ? ` (용병 ${point.guestsAttended})` : ""}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
