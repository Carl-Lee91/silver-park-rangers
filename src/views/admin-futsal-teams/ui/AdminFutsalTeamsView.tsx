import { notFound, redirect } from "next/navigation";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import { fetchTeamAssignments } from "@/entities/futsal/server";
import { FORMAT_LABELS, formatMatchDate, isFutsal, matchTitle } from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { fetchAdminMembers } from "@/entities/member/server";
import { fieldStrength } from "@/entities/rating";
import { fetchAllRatings } from "@/entities/rating/server";
import { futsalPool, saveTeams, TeamBuilder } from "@/features/futsal-teams";
import { publishSquad } from "@/features/squad-builder";
import { adminMatchPath, adminSquadPath } from "@/shared/config";
import { chipClass, Screen } from "@/shared/ui";
import { playerTips } from "@/widgets/player-tip";

/** 풋살 팀 나누기(PLAN.md §6 "풋살", 관리자 전용). 축구 매치면 스쿼드 빌더로 보낸다 */
export default async function AdminFutsalTeamsView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();
  if (!isFutsal(match)) redirect(adminSquadPath(match.id));

  const [attendance, members, ratings, saved] = await Promise.all([
    fetchMatchAttendance(match.id),
    fetchAdminMembers(),
    fetchAllRatings(),
    fetchTeamAssignments(match.id),
  ]);
  const strengths = Object.fromEntries(Object.entries(ratings).map(([id, values]) => [id, fieldStrength(values)]));
  const players = futsalPool(attendance, members, saved, strengths);
  const shown = new Set(players.map((player) => player.id));

  return (
    <Screen
      title="팀 나누기"
      overline={`${formatMatchDate(match.date)} ${match.startsAt} · ${matchTitle(match)} · ${FORMAT_LABELS[match.format]}`}
      back={{ href: adminMatchPath(match.id), label: "매치" }}
      width="wide"
      actions={<span className={chipClass("band")}>{match.squadPublishedAt !== null ? "공개됨" : "공개 전"}</span>}
    >
      <TeamBuilder
        matchId={match.id}
        format={match.format}
        players={players}
        initialTeamCount={match.teamCount === 3 ? 3 : 2}
        initialAssignments={saved}
        published={match.squadPublishedAt !== null}
        saveAction={saveTeams}
        publishAction={publishSquad}
        tips={playerTips(
          members.filter((member) => shown.has(member.id)),
          ratings,
        )}
      />
    </Screen>
  );
}
