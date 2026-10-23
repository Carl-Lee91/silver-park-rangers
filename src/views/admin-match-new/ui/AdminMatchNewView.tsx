import { formatMatchDate, seoulToday } from "@/entities/match";
import { fetchPastMatches, fetchUpcomingMatches } from "@/entities/match/server";
import { createMatch, MatchForm, suggestNewMatch } from "@/features/match-form";
import { ROUTES } from "@/shared/config";
import { Panel, Screen } from "@/shared/ui";

/** 매치 만들기. 가장 늦은 매치의 다음 주 같은 요일·시간·장소로 미리 채운다(suggestNewMatch). */
export default async function AdminMatchNewView() {
  const today = seoulToday();
  const [upcoming, past] = await Promise.all([fetchUpcomingMatches(today), fetchPastMatches(today, 1)]);
  const previous = upcoming.at(-1) ?? past[0] ?? null;

  return (
    <Screen title="매치 만들기" overline="일정" back={{ href: ROUTES.adminMatches, label: "매치" }} width="wide">
      <div className="flex w-full max-w-narrow flex-col gap-4">
        {previous && (
          <p className="text-sm text-text-secondary">
            {formatMatchDate(previous.date)} 매치의 시간·쿼터 수·장소를 불러왔어요. 날짜는 그다음 주 같은 요일이에요.
          </p>
        )}
        <Panel title="매치 정보">
          <MatchForm action={createMatch} submitLabel="매치 만들기" initial={suggestNewMatch(previous, today)} />
        </Panel>
      </div>
    </Screen>
  );
}
