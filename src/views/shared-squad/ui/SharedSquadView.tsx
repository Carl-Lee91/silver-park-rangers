import Link from "next/link";
import { MatchSummary, quarterSchedule } from "@/entities/match";
import type { SharedSquad } from "@/entities/squad";
import { ShareActions } from "@/features/squad-share";
import { matchPath } from "@/shared/config";
import { QuarterBoard } from "@/widgets/quarter-board";
import { squadImagePath } from "@/widgets/squad-image";

type Props = { token: string; squad: SharedSquad; shareUrl: string; title: string; version: string };

/**
 * 공유 링크로 연 스쿼드. 로그인하지 않아도 보인다 — 카톡에서 누르자마자 볼 수 있게(PLAN.md §8).
 * 참석 명단·멤버/용병 구분은 없다. 투표하려면 로그인한다.
 */
export default function SharedSquadView({ token, squad, shareUrl, title, version }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-100 flex-1 flex-col gap-6 px-4 py-8">
      <p className="text-sm font-medium text-primary">Silver Park Rangers</p>
      <MatchSummary match={squad.match} />
      <QuarterBoard quarters={squad.quarters} schedule={quarterSchedule(squad.match)} />
      <ShareActions
        shareUrl={shareUrl}
        title={title}
        imageUrls={{
          quarters: squadImagePath(token, "quarters", version),
          rotation: squadImagePath(token, "rotation", version),
        }}
      />
      <Link href={matchPath(squad.matchId)} className="text-sm text-text-secondary underline underline-offset-4">
        팀원이면 로그인하고 참석 투표하기
      </Link>
    </main>
  );
}
