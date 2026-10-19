import Link from "next/link";
import { seoulToday } from "@/entities/match";
import { computeMemberStats, computeTeamSummary, PERIOD_LABELS, periodRange, type StatsPeriod } from "@/entities/stats";
import { fetchStatsSource } from "@/entities/stats/server";
import { ROUTES } from "@/shared/config";
import AttendanceTrendChart from "./AttendanceTrendChart";
import MemberStatsList from "./MemberStatsList";

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {note && <p className="text-xs text-text-tertiary">{note}</p>}
    </div>
  );
}

/** 관리자 통계(PLAN.md §10 2차). 지난 매치만 센다. 용병은 멤버 통계에서 빠진다. */
export default async function AdminStatsView({ period }: { period: StatsPeriod }) {
  const source = await fetchStatsSource(periodRange(period, seoulToday()));
  const summary = computeTeamSummary(source);
  const stats = computeMemberStats(source);
  const active = stats.filter((row) => row.status === "approved");
  const rates = active.flatMap((row) => (row.attendanceRate === null ? [] : [row.attendanceRate]));
  const teamRate = rates.length === 0 ? null : rates.reduce((sum, rate) => sum + rate, 0) / rates.length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">통계</h1>

      <nav aria-label="기간" className="flex gap-2">
        {(Object.keys(PERIOD_LABELS) as StatsPeriod[]).map((key) => (
          <Link
            key={key}
            href={`${ROUTES.adminStats}?period=${key}`}
            aria-current={key === period ? "page" : undefined}
            className="rounded-lg border border-border px-3 py-1.5 text-sm aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-contrast"
          >
            {PERIOD_LABELS[key]}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-3 gap-2">
        <Tile label="지난 매치" value={`${summary.matchCount}`} note={`출석 확정 ${summary.confirmedCount}`} />
        <Tile
          label="매치당 출석"
          value={summary.avgAttended === null ? "–" : `${summary.avgAttended.toFixed(1)}명`}
          note="용병 포함"
        />
        <Tile
          label="멤버 평균 참석률"
          value={teamRate === null ? "–" : `${Math.round(teamRate * 100)}%`}
          note={`멤버 ${active.length}명`}
        />
      </div>

      <AttendanceTrendChart trend={summary.trend} />

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">멤버별</h2>
        <p className="text-xs text-text-tertiary">
          참석률은 실제 출석을 정한 매치만 세요. 가입하기 전 매치와 용병은 빠져요.
        </p>
        {active.length === 0 ? (
          <p className="rounded-xl bg-bg-subtle p-4 text-sm text-text-tertiary">아직 멤버가 없어요.</p>
        ) : (
          <MemberStatsList stats={active} />
        )}
      </section>
    </div>
  );
}
