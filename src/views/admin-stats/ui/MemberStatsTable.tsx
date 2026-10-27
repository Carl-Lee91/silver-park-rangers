"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Position } from "@/entities/position";
import { rateScale, type MemberStats, type RateScale } from "@/entities/stats";
import { adminMemberPath } from "@/shared/config";

type Direction = "descending" | "ascending";

type Column = {
  key: string;
  label: string;
  /** 정렬 값. 낼 수 없으면 null — 어느 방향이든 맨 뒤 */
  value: (row: MemberStats) => number | null;
  cell: (row: MemberStats) => ReactNode;
};

const TONE: Record<RateScale, string> = {
  best: "text-fit-best",
  good: "text-fit-good",
  fair: "text-fit-fair",
  poor: "text-fit-poor",
};

const percent = (rate: number | null) => (rate === null ? "–" : `${Math.round(rate * 100)}%`);

/** 비율 + 색 단계(90 · 75 · 60%) */
function Rate({ rate }: { rate: number | null }) {
  const scale = rateScale(rate);
  return <span className={`font-bold ${scale ? TONE[scale] : "text-text-tertiary"}`}>{percent(rate)}</span>;
}

const COLUMNS: Column[] = [
  {
    key: "attendance",
    label: "참석률",
    value: (row) => row.attendanceRate,
    cell: (row) => (
      <span className="flex items-center justify-end gap-2">
        <span aria-hidden="true" className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-primary-soft md:block">
          <span className="block h-full rounded-full bg-chart" style={{ width: `${(row.attendanceRate ?? 0) * 100}%` }} />
        </span>
        <Rate rate={row.attendanceRate} />
        {row.attendanceRate !== null && (
          <span className="text-xs text-text-tertiary">
            {row.attended}/{row.confirmed}
          </span>
        )}
      </span>
    ),
  },
  { key: "response", label: "응답률", value: (row) => row.responseRate, cell: (row) => <Rate rate={row.responseRate} /> },
  {
    key: "noShows",
    label: "노쇼",
    value: (row) => row.noShows,
    cell: (row) => (
      <span className={row.noShows > 0 ? "font-bold text-danger" : "text-text-tertiary"}>
        {row.noShows}
        {row.yesConfirmed > 0 && <span className="text-xs font-normal text-text-tertiary">/{row.yesConfirmed}</span>}
      </span>
    ),
  },
  {
    key: "quarters",
    label: "평균 출전",
    value: (row) => row.avgFieldQuarters,
    cell: (row) => <span className="font-semibold">{row.avgFieldQuarters === null ? "–" : row.avgFieldQuarters.toFixed(1)}</span>,
  },
  {
    key: "keeper",
    label: "키퍼",
    value: (row) => row.keeperQuarters,
    cell: (row) => <span className={row.keeperQuarters > 0 ? "" : "text-text-tertiary"}>{row.keeperQuarters}</span>,
  },
  { key: "goals", label: "골", value: (row) => row.goals, cell: (row) => <span className="font-bold">{row.goals}</span> },
  { key: "assists", label: "도움", value: (row) => row.assists, cell: (row) => row.assists },
  {
    key: "preferred",
    label: "선호 자리",
    value: (row) => row.preferredShare,
    cell: (row) => <span className="text-text-secondary">{percent(row.preferredShare)}</span>,
  },
];

const positionLine = (counts: MemberStats["positionCounts"]) =>
  (Object.entries(counts) as [Position, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([position, count]) => `${position} ${count}`)
    .join(" · ");

/**
 * 멤버별 표(풋볼매니저 선수 표). 머리글을 누르면 그 칸으로 많은 순, 한 번 더 누르면 적은 순이다.
 * 낼 수 없는 값(null)은 –로 쓰고 어느 정렬에서든 맨 뒤에 둔다. 모바일은 이름 칸을 붙인 채 옆으로 민다.
 */
export default function MemberStatsTable({ stats }: { stats: readonly MemberStats[] }) {
  const [sort, setSort] = useState<{ key: string; direction: Direction }>({ key: "attendance", direction: "descending" });
  const column = COLUMNS.find((candidate) => candidate.key === sort.key)!;
  const sign = sort.direction === "descending" ? 1 : -1;
  const sorted = [...stats].sort((a, b) => {
    const left = column.value(a);
    const right = column.value(b);
    if (left === null || right === null) return left === right ? a.realName.localeCompare(b.realName, "ko") : left === null ? 1 : -1;
    return sign * (right - left) || a.realName.localeCompare(b.realName, "ko");
  });

  const sortBy = (key: string) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "descending" ? "ascending" : "descending" }
        : { key, direction: "descending" },
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-176 border-collapse text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-border-strong text-xs text-text-tertiary">
            <th scope="col" className="sticky left-0 z-10 bg-bg-panel px-3 text-left font-semibold md:px-4">
              이름
            </th>
            {COLUMNS.map((item) => {
              const active = item.key === sort.key;
              return (
                <th key={item.key} scope="col" aria-sort={active ? sort.direction : undefined} className="px-1 text-right">
                  <button
                    type="button"
                    onClick={() => sortBy(item.key)}
                    className={`inline-flex h-11 items-center justify-end gap-1 border-b-2 px-2 font-semibold ${
                      active ? "border-primary text-primary" : "border-transparent"
                    }`}
                  >
                    {item.label}
                    {active && <span aria-hidden="true">{sort.direction === "descending" ? "▼" : "▲"}</span>}
                  </button>
                </th>
              );
            })}
            <th scope="col" className="px-3 text-left font-semibold md:px-4">
              포지션별
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.memberId} className="border-b border-border last:border-b-0 odd:bg-bg-panel even:bg-bg-row">
              <th scope="row" className="sticky left-0 z-10 bg-inherit px-3 py-1 text-left font-bold md:px-4">
                <Link href={adminMemberPath(row.memberId)} className="inline-flex h-11 items-center underline-offset-4 hover:underline">
                  {row.realName}
                </Link>
              </th>
              {COLUMNS.map((item) => (
                <td key={item.key} className="px-3 py-2.5 text-right">
                  {item.cell(row)}
                </td>
              ))}
              <td className="px-3 py-2.5 text-xs text-text-secondary md:px-4">{positionLine(row.positionCounts) || "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
