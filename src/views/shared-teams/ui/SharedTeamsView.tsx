import Link from "next/link";
import { TeamRoster, type SharedTeams } from "@/entities/futsal";
import { formatMatchDate, matchTitle, MatchSummary, playersPerSide } from "@/entities/match";
import { ShareActions } from "@/features/squad-share";
import { matchPath } from "@/shared/config";
import { Panel, Screen } from "@/shared/ui";

type Props = { shared: SharedTeams; shareUrl: string; title: string };

/**
 * 공유 링크로 연 풋살 팀(PLAN.md §6 "풋살"). 로그인하지 않아도 보인다. 이름 · 등번호만 있고 용병 구분 · 능력치는 없다.
 * 풋살은 공유 이미지가 없어서 링크만 공유한다.
 */
export default function SharedTeamsView({ shared, shareUrl, title }: Props) {
  return (
    <Screen title={matchTitle(shared.match)} overline={`${formatMatchDate(shared.match.date)} · Silver Park Rangers`}>
      <MatchSummary match={shared.match} />
      <Panel title="팀" aside={`${shared.teams.length}팀`}>
        <div className="flex flex-col gap-5">
          <TeamRoster teams={shared.teams} perSide={playersPerSide(shared.match.format)} />
          <ShareActions shareUrl={shareUrl} title={title} />
        </div>
      </Panel>
      <Link
        href={matchPath(shared.matchId)}
        className="flex h-12 items-center justify-center rounded-box border border-border-strong bg-bg-subtle text-sm font-semibold"
      >
        팀원이면 로그인하고 참석 투표하기
      </Link>
    </Screen>
  );
}
