import Link from "next/link";
import { MatchCard } from "@/entities/match";
import { fetchUpcomingMatches } from "@/entities/match/server";
import { groupForAdmin } from "@/entities/member";
import { fetchAdminMembers } from "@/entities/member/server";
import { adminMatchPath, ROUTES } from "@/shared/config";
import { Panel, Screen } from "@/shared/ui";

const TILE = "flex min-h-20 items-center justify-between gap-3 rounded-box border border-border bg-bg-panel p-4";

export default async function AdminHomeView() {
  const [members, upcoming] = await Promise.all([fetchAdminMembers(), fetchUpcomingMatches()]);
  const groups = groupForAdmin(members);
  const next = upcoming[0];
  const waiting = groups.pending.length;

  return (
    <Screen title="관리" overline="Silver Park Rangers" width="wide">
      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        <Link href={ROUTES.adminMembers} className={TILE}>
          <span>
            <span className="block text-xs font-semibold text-text-secondary">가입 신청</span>
            <span className="mt-1 block text-lg font-extrabold">{waiting > 0 ? `${waiting}명이 기다려요` : "새 신청 없음"}</span>
          </span>
          {waiting > 0 && (
            <span className="flex size-7 items-center justify-center rounded-full bg-danger text-sm font-bold text-bg-base">
              {waiting}
            </span>
          )}
        </Link>
        <Link href={ROUTES.adminMembers} className={TILE}>
          <span>
            <span className="block text-xs font-semibold text-text-secondary">멤버</span>
            <span className="mt-1 block text-2xl font-extrabold tabular-nums">{groups.approved.length}명</span>
          </span>
        </Link>
        <Link href={ROUTES.adminFormations} className={TILE}>
          <span>
            <span className="block text-xs font-semibold text-text-secondary">포메이션</span>
            <span className="mt-1 block font-bold">기본 4-3-3 · 4-4-2 + 커스텀 만들기</span>
          </span>
        </Link>
      </div>
      <Panel
        title="다음 매치"
        aside={
          <Link href={ROUTES.adminMatchNew} className="inline-flex h-8 items-center font-bold text-primary">
            매치 만들기
          </Link>
        }
        flush
      >
        {next ? (
          <MatchCard match={next} href={adminMatchPath(next.id)} />
        ) : (
          <p className="p-3 text-sm text-text-tertiary md:p-4">다가오는 매치가 없어요.</p>
        )}
      </Panel>
    </Screen>
  );
}
