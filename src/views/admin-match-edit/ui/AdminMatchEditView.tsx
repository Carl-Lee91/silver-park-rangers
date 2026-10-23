import { notFound } from "next/navigation";
import { formatMatchDate, matchTitle } from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { MatchForm, matchToFormValues, updateMatch } from "@/features/match-form";
import { adminMatchPath } from "@/shared/config";
import { Panel, Screen } from "@/shared/ui";

export default async function AdminMatchEditView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();

  return (
    <Screen
      title="매치 고치기"
      overline={`${formatMatchDate(match.date)} ${matchTitle(match)}`}
      back={{ href: adminMatchPath(match.id), label: "매치" }}
      width="wide"
    >
      <Panel title="매치 정보" className="w-full max-w-narrow">
        <MatchForm action={updateMatch} submitLabel="저장" initial={matchToFormValues(match)} matchId={match.id} />
      </Panel>
    </Screen>
  );
}
