import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AttendanceMeter, groupAttendance, ResponseChip } from "@/entities/attendance";
import { fetchMatchAttendance, fetchMyResponses } from "@/entities/attendance/server";
import {
  dDayLabel,
  formatDeadline,
  formatMatchDate,
  isFutsal,
  isVotingOpen,
  MatchCard,
  MatchSummary,
  quarterSchedule,
  seoulToday,
  votingClosesAt,
} from "@/entities/match";
import { fetchPastMatches, fetchUpcomingMatches } from "@/entities/match/server";
import { isAdmin } from "@/entities/member";
import { fetchMyMember } from "@/entities/member/server";
import { FormStrip, recentResults, ResultRow, withQuarterResults } from "@/entities/result";
import { fetchMatchResults } from "@/entities/result/server";
import { InstallAppCard } from "@/features/app-install";
import { AttendanceVoteForm, submitVote } from "@/features/attendance-vote";
import { matchPath, ROUTES } from "@/shared/config";
import { chipClass, Panel, Screen } from "@/shared/ui";

/** 최근 폼에 볼 지난 매치 수. 결과를 안 남긴 매치가 섞여도 5개를 채우게 넉넉히 읽는다 */
const PAST_FOR_FORM = 10;

/**
 * 홈(PLAN.md §7 일반): 다음 매치(미리보기 · 내 응답 · 참석 인원 · 바로 투표), 최근 폼, 그 뒤의 다가오는 매치.
 * 개인 링크로 들어오면 여기에 닿는다 — 다음 매치 칸에서 화면을 옮기지 않고 바로 투표한다(PLAN.md §4).
 * 데스크톱은 왼쪽에 다음 매치, 오른쪽에 최근 폼과 일정을 둔다.
 */
export default async function HomeView() {
  const me = await fetchMyMember();
  if (me === null) redirect(ROUTES.onboarding);

  const today = seoulToday();
  const [matches, past] = await Promise.all([fetchUpcomingMatches(today), fetchPastMatches(today, PAST_FOR_FORM)]);
  const [next, ...later] = matches;
  // 오늘 매치는 끝나고 결과를 남기면 바로 최근 폼에 든다.
  const played = [...matches.filter((match) => match.date === today), ...past];
  const [responses, nextAttendance, results] = await Promise.all([
    fetchMyResponses(matches.map((match) => match.id)),
    next ? fetchMatchAttendance(next.id) : Promise.resolve([]),
    fetchMatchResults(played.map((match) => match.id)),
  ]);
  const form = recentResults(withQuarterResults(played, results));
  const groups = groupAttendance(nextAttendance);
  const mine = nextAttendance.find((row) => row.memberId === me.id && row.response !== null);

  return (
    <Screen
      title="홈"
      overline="Silver Park Rangers"
      actions={
        <Link
          href={ROUTES.me}
          className="inline-flex h-11 items-center rounded-box bg-kit-label px-3 text-sm font-bold text-kit"
        >
          내 정보
        </Link>
      }
    >
      <p className="text-sm text-text-secondary">{me.realName}님, 안녕하세요</p>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
        <Panel
          title="다음 매치"
          aside={next && <span className={chipClass("accent")}>{dDayLabel(next.date, today)}</span>}
          flush
        >
          {next ? (
            <>
              <MatchSummary match={next} framed={false} />
              <div className="flex flex-col gap-3 border-t border-border p-3 md:p-4">
                <p className="text-xs font-semibold text-text-tertiary">{formatMatchDate(next.date)}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
                    내 응답 <ResponseChip response={responses[next.id]} open={isVotingOpen(next)} />
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {isVotingOpen(next) ? `${formatDeadline(votingClosesAt(next).toISOString())} 마감` : "투표 마감됨"}
                  </span>
                </div>
                <AttendanceMeter
                  counts={{ yes: groups.yes.length, maybe: groups.maybe.length, no: groups.no.length }}
                />
                {isVotingOpen(next) ? (
                  <>
                    <AttendanceVoteForm
                      action={submitVote}
                      matchId={next.id}
                      schedule={quarterSchedule(next)}
                      current={mine ? { response: mine.response!, arriveAt: mine.arriveAt, leaveAt: mine.leaveAt } : null}
                      open
                      askTime={!isFutsal(next)}
                    />
                    <Link
                      href={matchPath(next.id)}
                      className="flex h-11 items-center justify-center rounded-box border border-border-strong bg-bg-subtle text-sm font-semibold"
                    >
                      매치 자세히 보기
                    </Link>
                  </>
                ) : (
                  <Link
                    href={matchPath(next.id)}
                    className="flex h-12 items-center justify-center rounded-box border border-border-strong bg-bg-subtle text-base font-semibold"
                  >
                    매치 보기
                  </Link>
                )}
              </div>
            </>
          ) : (
            <p className="p-3 text-sm text-text-secondary md:p-4">다가오는 매치가 없어요.</p>
          )}
        </Panel>

        <div className="flex flex-col gap-4 lg:gap-6">
          <InstallAppCard dismissible />
          <Panel title="최근 폼" aside={form.length > 0 && "오른쪽이 최신"} flush>
            <div className="p-3 md:p-4">
              <FormStrip results={form} />
            </div>
            {form[0] && (
              <div className="border-t border-border">
                <ResultRow result={form[0]} dateLabel={`${formatMatchDate(form[0].date)} · 지난 매치`} href={matchPath(form[0].matchId)} />
              </div>
            )}
          </Panel>

          {later.length > 0 && (
            <Panel title="다가오는 매치" aside={`${later.length}`} flush>
              <ul className="divide-y divide-border">
                {later.map((match) => (
                  <li key={match.id} className="even:bg-bg-row">
                    <MatchCard
                      match={match}
                      href={matchPath(match.id)}
                      aside={<ResponseChip response={responses[match.id]} open={isVotingOpen(match)} />}
                    />
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {isAdmin(me) && (
            <Link
              href={ROUTES.admin}
              className="flex min-h-13 items-center gap-3 rounded-box border border-border bg-bg-panel px-3 md:px-4"
            >
              <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
              <span className="font-bold">관리 화면</span>
              <span className="ml-auto text-xs text-text-tertiary">관리자만 보여요</span>
            </Link>
          )}
        </div>
      </div>
    </Screen>
  );
}
