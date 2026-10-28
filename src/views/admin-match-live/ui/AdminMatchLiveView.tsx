import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import { formatMatchDate, isFutsal, matchTitle, quarterSchedule, seoulToday } from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { regularMembers } from "@/entities/member";
import { fetchAdminMembers } from "@/entities/member/server";
import { fetchMatchResult } from "@/entities/result/server";
import { quarterChanges } from "@/entities/squad";
import { fetchSquad } from "@/entities/squad/server";
import { setAttended } from "@/features/attendance-confirm";
import { arrivalRows, LiveBoard, type LiveQuarterPlan } from "@/features/match-live";
import { ResultEditor } from "@/features/result-record";
import { adminMatchPath, adminSquadPath } from "@/shared/config";
import { ActionButton, chipClass, Panel, Screen } from "@/shared/ui";

/**
 * 경기 당일 현장 모드(PLAN.md §10, 관리자). 구장에서 휴대폰 하나로: 지금 쿼터 · 다음 쿼터 교체 안내, 도착 체크
 * (= 실제 출석), 쿼터가 끝나면 바로 결과 기록. 풋살은 쿼터가 없어 도착 체크만 있다.
 */
export default async function AdminMatchLiveView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();

  const futsal = isFutsal(match);
  const [attendance, squad, result, members] = await Promise.all([
    fetchMatchAttendance(match.id),
    futsal ? Promise.resolve([]) : fetchSquad(match.id),
    futsal ? Promise.resolve(null) : fetchMatchResult(match.id),
    futsal ? Promise.resolve([]) : fetchAdminMembers(),
  ]);
  const schedule = quarterSchedule(match);
  const person = (slot: { memberName: string | null; jerseyNumber: number | null }) => ({
    name: slot.memberName ?? "(볼 수 없음)",
    jerseyNumber: slot.jerseyNumber,
  });
  const plans: LiveQuarterPlan[] = schedule.map((_, index) => {
    const quarter = squad.find((saved) => saved.number === index + 1);
    if (quarter === undefined) return { number: index + 1, formationName: "아직 안 짰어요", comingIn: [], goingOut: [], moved: [] };
    const changes = quarterChanges(squad.find((saved) => saved.number === index) ?? null, quarter);
    return {
      number: quarter.number,
      formationName: quarter.formationName,
      comingIn: changes.comingIn.map((slot) => ({ ...person(slot), position: slot.position })),
      goingOut: changes.goingOut.map((slot) => ({ ...person(slot), position: slot.position })),
      moved: changes.moved.map(({ slot, from }) => ({ ...person(slot), from, to: slot.position })),
    };
  });
  const rows = arrivalRows(attendance, squad);
  const arrived = rows.filter((row) => row.arrived).length;

  return (
    <Screen
      title="현장"
      overline={`${formatMatchDate(match.date)} · ${matchTitle(match)}`}
      back={{ href: adminMatchPath(match.id), label: "매치 관리" }}
      width="page"
    >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        {!futsal && (
          <Panel title="쿼터" aside={`${schedule[0].startsAt}~${schedule[schedule.length - 1].endsAt}`}>
            {squad.length === 0 ? (
              <p className="text-sm text-text-secondary">
                스쿼드를 저장하면 쿼터마다 누가 들어가고 나오는지 여기 나와요.{" "}
                <Link href={adminSquadPath(match.id)} className="font-semibold text-primary underline">
                  스쿼드 짜기
                </Link>
              </p>
            ) : (
              <LiveBoard schedule={schedule} plans={plans} today={match.date === seoulToday()} />
            )}
          </Panel>
        )}

        <Panel title="도착 체크" aside={`도착 ${arrived}/${rows.length}`} flush>
          <p className="border-b border-border px-3 py-2 text-xs text-text-tertiary md:px-4">
            도착을 누르면 실제 출석으로 남아요. 먼저 뛰는 사람이 위에 있어요.
          </p>
          {rows.length === 0 ? (
            <p className="p-3 text-sm text-text-secondary md:p-4">올 사람이 없어요.</p>
          ) : (
            <ul>
              {rows.map((row) => (
                <li key={row.memberId} className="flex min-h-14 items-center gap-3 px-3 py-1.5 even:bg-bg-row md:px-4">
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {row.jerseyNumber !== null && <span className="mr-1 text-xs text-text-tertiary tabular-nums">{row.jerseyNumber}</span>}
                    {row.realName}
                  </span>
                  {!row.arrived && row.firstQuarter !== null && <span className={chipClass("muted")}>{row.firstQuarter}쿼터부터</span>}
                  {row.arrived ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={chipClass("good")}>도착</span>
                      <div className="w-20">
                        <ActionButton action={setAttended} fields={{ matchId: match.id, memberId: row.memberId, attended: "" }} label="취소" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 shrink-0">
                      <ActionButton
                        action={setAttended}
                        fields={{ matchId: match.id, memberId: row.memberId, attended: "true" }}
                        label="도착"
                        tone="primary"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {!futsal && result !== null && (
          <Panel title="결과 기록" aside="쿼터가 끝나면" className="lg:col-span-2">
            <ResultEditor
              matchId={match.id}
              quarterCount={match.quarterCount}
              scores={result.scores}
              goals={result.goals}
              squad={squad}
              members={regularMembers(members, match.id).map((member) => ({ id: member.id, realName: member.realName }))}
            />
          </Panel>
        )}
      </div>
    </Screen>
  );
}
