import Link from "next/link";
import { MatchCard } from "@/entities/match";
import { fetchUpcomingMatches } from "@/entities/match/server";
import { groupForAdmin } from "@/entities/member";
import { fetchAdminMembers } from "@/entities/member/server";
import { adminMatchPath, ROUTES } from "@/shared/config";

export default async function AdminHomeView() {
  const [members, upcoming] = await Promise.all([fetchAdminMembers(), fetchUpcomingMatches()]);
  const groups = groupForAdmin(members);
  const next = upcoming[0];
  const waiting = groups.pending.length;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">관리</h1>
      <Link
        href={ROUTES.adminMembers}
        className="flex items-center justify-between rounded-xl border border-border p-4"
      >
        <span>
          <span className="block text-sm text-text-secondary">가입 신청</span>
          <span className="mt-1 block text-lg font-bold">
            {waiting > 0 ? `${waiting}명이 기다려요` : "새 신청 없음"}
          </span>
        </span>
        {waiting > 0 && (
          <span className="flex size-7 items-center justify-center rounded-full bg-danger text-sm font-bold text-primary-contrast">
            {waiting}
          </span>
        )}
      </Link>
      <Link href={ROUTES.adminMembers} className="rounded-xl border border-border p-4">
        <span className="block text-sm text-text-secondary">멤버</span>
        <span className="mt-1 block text-lg font-bold">{groups.approved.length}명</span>
      </Link>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary">다음 매치</h2>
          <Link href={ROUTES.adminMatchNew} className="text-sm font-semibold text-primary">
            매치 만들기
          </Link>
        </div>
        {next ? (
          <MatchCard match={next} href={adminMatchPath(next.id)} />
        ) : (
          <p className="rounded-xl bg-bg-subtle p-4 text-sm text-text-tertiary">다가오는 매치가 없어요.</p>
        )}
      </section>
    </div>
  );
}
