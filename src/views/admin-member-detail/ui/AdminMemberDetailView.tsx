import { notFound } from "next/navigation";
import { formatDeadline, seoulToday } from "@/entities/match";
import { footLabel } from "@/entities/member";
import { fetchAdminMembers } from "@/entities/member/server";
import { positionLabel } from "@/entities/position";
import { fetchMemberRatings } from "@/entities/rating/server";
import { computeMemberStats, periodRange } from "@/entities/stats";
import { fetchStatsSource } from "@/entities/stats/server";
import { RatingForm, saveRatings } from "@/features/rating-edit";
import { isUuid } from "@/shared/lib";
import { chipClass, Panel, Screen } from "@/shared/ui";
import { memberBack } from "../lib/back";

const percent = (rate: number | null) => (rate === null ? "–" : `${Math.round(rate * 100)}%`);

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-box bg-bg-subtle px-3 py-2.5">
      <p className="text-xs font-semibold text-text-secondary">{label}</p>
      <p className="mt-0.5 text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>
      {note && <p className="text-xs text-text-tertiary">{note}</p>}
    </div>
  );
}

/**
 * 선수 상세(PLAN.md §7 관리자, 관리자 전용): 프로필 · 능력치(매기기) · 올해 기록.
 * 멤버 목록 · 통계의 멤버별 표 · 매치 관리(참석 명단 · 그날 용병) · 스쿼드 빌더 · 팀 나누기에서 선수를 누르면 온다.
 * 그날 용병도 연다(능력치를 매겨 자동 배치 · 팀 나누기에 쓴다). 능력치는 관리자만 읽고 쓴다(RLS).
 * 뒤로 가기는 온 화면(`from`)으로 간다.
 */
export default async function AdminMemberDetailView({ memberId, from }: { memberId: string; from?: string | string[] }) {
  if (!isUuid(memberId)) notFound();
  const members = await fetchAdminMembers();
  const member = members.find((candidate) => candidate.id === memberId);
  if (member === undefined) notFound();
  const guest = member.guestMatchId !== null;

  const [ratings, season] = await Promise.all([
    fetchMemberRatings(member.id),
    fetchStatsSource(periodRange("season", seoulToday())),
  ]);
  const stats = computeMemberStats(season).find((row) => row.memberId === member.id) ?? null;

  return (
    <Screen
      title={member.realName}
      overline={`${member.jerseyNumber === null ? "" : `#${member.jerseyNumber} · `}선수 상세`}
      back={memberBack(from, member.guestMatchId)}
      width="wide"
    >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          <Panel
            title="프로필"
            aside={
              <span className="flex gap-1.5">
                {member.role === "admin" && <span className={chipClass("accent")}>관리자</span>}
                {member.memberType === "guest" && <span className={chipClass("muted")}>{guest ? "그날 용병" : "용병"}</span>}
                {member.status === "inactive" && <span className={chipClass("warn")}>휴면</span>}
              </span>
            }
            flush
          >
            <dl className="divide-y divide-border text-sm">
              {[
                ["등번호", member.jerseyNumber === null ? "없음" : String(member.jerseyNumber)],
                ["선호 포지션", member.preferredPositions.map((code, index) => `${index + 1}. ${positionLabel(code)}`).join(" · ")],
                ["주발", member.feet.map(footLabel).join(" · ")],
                // 그날 용병은 계정이 없다
                ...(guest ? [] : [["이메일", member.email ?? "없음"]]),
              ].map(([term, detail]) => (
                <div key={term} className="flex items-baseline justify-between gap-4 px-3 py-2.5 md:px-4">
                  <dt className="shrink-0 text-text-secondary">{term}</dt>
                  <dd className="min-w-0 text-right font-semibold break-all">{detail}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="올해 기록" aside="지난 매치만">
            {stats === null ? (
              <p className="text-sm text-text-tertiary">아직 기록이 없어요.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Stat
                  label="참석률"
                  value={percent(stats.attendanceRate)}
                  note={stats.attendanceRate === null ? undefined : `${stats.attended}/${stats.confirmed}`}
                />
                <Stat
                  label="평균 출전"
                  value={stats.avgFieldQuarters === null ? "–" : stats.avgFieldQuarters.toFixed(1)}
                  note={stats.keeperQuarters > 0 ? `키퍼 ${stats.keeperQuarters}쿼터` : "쿼터"}
                />
                <Stat label="골" value={String(stats.goals)} />
                <Stat label="도움" value={String(stats.assists)} />
              </div>
            )}
          </Panel>
        </div>

        <Panel
          title="능력치"
          aside={ratings.updatedAt ? `${formatDeadline(ratings.updatedAt)} 저장 · 관리자만` : "관리자만"}
        >
          <RatingForm action={saveRatings} memberId={member.id} initial={ratings.values} />
        </Panel>
      </div>
    </Screen>
  );
}
