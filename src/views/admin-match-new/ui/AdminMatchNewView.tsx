import { formatMatchDate, seoulToday } from "@/entities/match";
import { fetchPastMatches, fetchUpcomingMatches } from "@/entities/match/server";
import { createMatch, MatchForm, suggestNewMatch } from "@/features/match-form";

/** 매치 만들기. 가장 늦은 매치의 다음 주 같은 요일·시간·장소로 미리 채운다(suggestNewMatch). */
export default async function AdminMatchNewView() {
  const today = seoulToday();
  const [upcoming, past] = await Promise.all([fetchUpcomingMatches(today), fetchPastMatches(today, 1)]);
  const previous = upcoming.at(-1) ?? past[0] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-narrow flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold">매치 만들기</h1>
        {previous && (
          <p className="mt-2 text-sm text-text-secondary">
            {formatMatchDate(previous.date)} 매치의 시간·쿼터 수·장소를 불러왔어요. 날짜는 그다음 주 같은 요일이에요.
          </p>
        )}
      </header>
      <MatchForm action={createMatch} submitLabel="매치 만들기" initial={suggestNewMatch(previous, today)} />
    </div>
  );
}
