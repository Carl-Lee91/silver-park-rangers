"use client";

import { useState } from "react";
import { positionLabel, type Position } from "@/entities/position";
import type { MemberStats } from "@/entities/stats";
import { Select } from "@/shared/ui";

type SortKey = "attendance" | "response" | "noShows" | "quarters" | "goals";

const SORTS: { key: SortKey; label: string; value: (row: MemberStats) => number | null }[] = [
  { key: "attendance", label: "참석률 높은 순", value: (row) => row.attendanceRate },
  { key: "response", label: "응답률 낮은 순", value: (row) => (row.responseRate === null ? null : -row.responseRate) },
  { key: "noShows", label: "노쇼 많은 순", value: (row) => row.noShows },
  { key: "quarters", label: "평균 출전 많은 순", value: (row) => row.avgFieldQuarters },
  { key: "goals", label: "득점 많은 순", value: (row) => row.goals },
];

const percent = (rate: number | null) => (rate === null ? "–" : `${Math.round(rate * 100)}%`);

/** 멤버별 통계. 낼 수 없는 값(null)은 –로 쓰고, 어느 정렬에서든 맨 뒤에 둔다. */
export default function MemberStatsList({ stats }: { stats: readonly MemberStats[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("attendance");
  const sort = SORTS.find((candidate) => candidate.key === sortKey)!;
  const sorted = [...stats].sort((a, b) => {
    const left = sort.value(a);
    const right = sort.value(b);
    if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
    return right - left || a.realName.localeCompare(b.realName, "ko");
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="memberSort" className="text-xs text-text-secondary">
          정렬
        </label>
        <Select
          id="memberSort"
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as SortKey)}
          fieldSize="md"
          className="w-44"
        >
          {SORTS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((row) => (
          <li key={row.memberId} className="rounded-xl border border-border p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold">{row.realName}</h3>
              <span className="text-sm">
                <span className="text-text-secondary">참석률 </span>
                <span className="font-semibold">{percent(row.attendanceRate)}</span>
                {row.attendanceRate !== null && (
                  <span className="ml-1 text-xs text-text-tertiary">
                    {row.attended}/{row.confirmed}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary-soft" aria-hidden="true">
              <div className="h-full rounded-full bg-chart" style={{ width: `${(row.attendanceRate ?? 0) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-text-secondary">
              응답 {percent(row.responseRate)} · 노쇼 {row.noShows}
              {row.yesConfirmed > 0 && `/${row.yesConfirmed}`} · 평균 출전{" "}
              {row.avgFieldQuarters === null ? "–" : `${row.avgFieldQuarters.toFixed(1)}쿼터`}
              {row.keeperQuarters > 0 && ` · 키퍼 ${row.keeperQuarters}쿼터`}
              {(row.goals > 0 || row.assists > 0) && ` · 골 ${row.goals} · 도움 ${row.assists}`}
            </p>
            {row.fieldQuarters > 0 && (
              <details className="mt-1 text-xs">
                <summary className="cursor-pointer text-text-tertiary">
                  포지션별 출전 · 선호 포지션에서 {percent(row.preferredShare)}
                </summary>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {(Object.entries(row.positionCounts) as [Position, number][])
                    .sort((a, b) => b[1] - a[1])
                    .map(([position, count]) => (
                      <li key={position} className="rounded-md bg-bg-subtle px-1.5 py-0.5">
                        {positionLabel(position)} {count}
                      </li>
                    ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
