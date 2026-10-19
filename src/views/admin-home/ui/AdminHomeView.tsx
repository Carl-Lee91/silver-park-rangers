import Link from "next/link";
import { groupForAdmin } from "@/entities/member";
import { fetchAdminMembers } from "@/entities/member/server";
import { ROUTES } from "@/shared/config";

export default async function AdminHomeView() {
  const groups = groupForAdmin(await fetchAdminMembers());
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
      <p className="text-sm text-text-tertiary">매치·스쿼드 관리는 다음에 여기에 생겨요.</p>
    </div>
  );
}
