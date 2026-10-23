import Link from "next/link";
import { formatMatchDate, matchTitle, MatchSummary, quarterSchedule } from "@/entities/match";
import type { SharedSquad } from "@/entities/squad";
import { ShareActions } from "@/features/squad-share";
import { matchPath } from "@/shared/config";
import { Panel, Screen } from "@/shared/ui";
import { QuarterBoard } from "@/widgets/quarter-board";
import { squadImagePath } from "@/widgets/squad-image";

type Props = { token: string; squad: SharedSquad; shareUrl: string; title: string; version: string };

/**
 * 공유 링크로 연 스쿼드. 로그인하지 않아도 보인다 — 카톡에서 누르자마자 볼 수 있게(PLAN.md §8).
 * 참석 명단·멤버/용병 구분은 없다. 투표하려면 로그인한다.
 */
export default function SharedSquadView({ token, squad, shareUrl, title, version }: Props) {
  return (
    <Screen title={matchTitle(squad.match)} overline={`${formatMatchDate(squad.match.date)} · Silver Park Rangers`}>
      <MatchSummary match={squad.match} />
      <Panel title="스쿼드" aside={`${squad.match.quarterCount}쿼터`}>
        <div className="flex flex-col gap-5">
          <QuarterBoard quarters={squad.quarters} schedule={quarterSchedule(squad.match)} />
          <ShareActions
            shareUrl={shareUrl}
            title={title}
            imageUrls={{
              quarters: squadImagePath(token, "quarters", version),
              rotation: squadImagePath(token, "rotation", version),
            }}
          />
        </div>
      </Panel>
      <Link
        href={matchPath(squad.matchId)}
        className="flex h-12 items-center justify-center rounded-box border border-border-strong bg-bg-subtle text-sm font-semibold"
      >
        팀원이면 로그인하고 참석 투표하기
      </Link>
    </Screen>
  );
}
