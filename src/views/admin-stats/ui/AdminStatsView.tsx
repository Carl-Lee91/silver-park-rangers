import Link from "next/link";
import { formatMatchDate, seoulToday } from "@/entities/match";
import { FormStrip, recentResults, ResultRow } from "@/entities/result";
import {
  computeMemberStats,
  computeTeamSummary,
  PERIOD_LABELS,
  periodRange,
  topScorers,
  type StatsPeriod,
} from "@/entities/stats";
import { fetchStatsSource } from "@/entities/stats/server";
import { adminMatchPath, ROUTES } from "@/shared/config";
import { Panel, Screen, tabClass } from "@/shared/ui";
import AttendanceTrendChart from "./AttendanceTrendChart";
import MemberStatsTable from "./MemberStatsTable";

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-box border border-border bg-bg-panel px-3 py-3 md:px-4">
      <p className="text-xs font-semibold text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight whitespace-nowrap tabular-nums">{value}</p>
      {note && <p className="text-xs text-text-tertiary">{note}</p>}
    </div>
  );
}

/** 관리자 통계(PLAN.md §10 2차, §7 관리자). 지난 매치만 센다. 용병은 멤버 통계에서 빠진다. */
export default async function AdminStatsView({ period }: { period: StatsPeriod }) {
  const source = await fetchStatsSource(periodRange(period, seoulToday()));
  const summary = computeTeamSummary(source);
  const stats = computeMemberStats(source);
  const active = stats.filter((row) => row.status === "approved");
  const rates = active.flatMap((row) => (row.attendanceRate === null ? [] : [row.attendanceRate]));
  const teamRate = rates.length === 0 ? null : rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const form = recentResults(source.matches.map((match) => ({ ...match, quarters: match.quarterScores })));
  const scorers = topScorers(active);

  return (
    <Screen title="통계" overline={`${PERIOD_LABELS[period]} · 지난 매치 ${summary.matchCount}`} width="wide">
      <nav aria-label="기간" className="-mt-2 flex overflow-x-auto border-b border-border">
        {(Object.keys(PERIOD_LABELS) as StatsPeriod[]).map((key) => (
          <Link
            key={key}
            href={`${ROUTES.adminStats}?period=${key}`}
            aria-current={key === period ? "page" : undefined}
            className={tabClass()}
          >
            {PERIOD_LABELS[key]}
          </Link>
        ))}
      </nav>

      {/* 모바일은 2칸·3칸 두 줄, 데스크톱은 다섯 칸 한 줄(lg:contents 로 안쪽 줄을 풀어 놓는다) */}
      <div className="flex flex-col gap-2 md:gap-3 lg:grid lg:grid-cols-5">
        <div className="grid grid-cols-2 gap-2 md:gap-3 lg:contents">
          <Tile
            label="쿼터 전적"
            value={`${summary.record.win}승 ${summary.record.draw}무 ${summary.record.loss}패`}
            note="결과를 남긴 쿼터만"
          />
          <Tile label="득실" value={`${summary.goalsFor} : ${summary.goalsAgainst}`} />
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3 lg:contents">
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
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
        <Panel title="매치별 실제 출석">
          <AttendanceTrendChart trend={summary.trend} />
        </Panel>

        <div className="flex flex-col gap-4 lg:gap-6">
          <Panel title="최근 폼" aside={form.length > 0 && "오른쪽이 최신"} flush>
            <div className="p-3 md:p-4">
              <FormStrip results={form} />
            </div>
            {form.length > 0 && (
              <ul className="divide-y divide-border border-t border-border">
                {form.map((result) => (
                  <li key={result.matchId} className="even:bg-bg-row">
                    <ResultRow result={result} dateLabel={formatMatchDate(result.date)} href={adminMatchPath(result.matchId)} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="득점 순위" aside="골 · 도움" flush>
            {scorers.length === 0 ? (
              <p className="p-3 text-sm text-text-tertiary md:p-4">아직 골 기록이 없어요.</p>
            ) : (
              <ol className="divide-y divide-border">
                {scorers.map((row, index) => (
                  <li
                    key={row.memberId}
                    className="grid min-h-11 grid-cols-[1.5rem_minmax(0,1fr)_2.5rem_2.5rem] items-center gap-2 px-3 text-sm even:bg-bg-row md:px-4"
                  >
                    <span className={`font-extrabold tabular-nums ${index === 0 ? "text-primary" : "text-text-tertiary"}`}>
                      {index + 1}
                    </span>
                    <span className="truncate font-semibold">{row.realName}</span>
                    <span className="text-right font-extrabold tabular-nums">{row.goals}</span>
                    <span className="text-right text-text-secondary tabular-nums">{row.assists}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="멤버별" aside="머리글을 눌러 정렬" flush>
        <p className="border-b border-border px-3 py-2 text-xs text-text-tertiary md:px-4">
          참석률은 실제 출석을 정한 매치만 세요. 가입하기 전 매치와 용병은 빠져요.
        </p>
        {active.length === 0 ? (
          <p className="p-3 text-sm text-text-tertiary md:p-4">아직 멤버가 없어요.</p>
        ) : (
          <MemberStatsTable stats={active} />
        )}
      </Panel>
    </Screen>
  );
}
