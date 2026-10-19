import Link from "next/link";
import type { ReactNode } from "react";
import { fetchMyGate } from "@/entities/member/server";
import { SignOutButton } from "@/features/sign-out";
import { ROUTES } from "@/shared/config";

/** 관리 화면 공통 틀. 어드민 계정이면 표시를 달고, 관리자(선수)면 팀 화면으로 가는 길을 둔다. */
export default async function AdminShell({ children }: { children: ReactNode }) {
  const viewer = await fetchMyGate();

  return (
    <div className="mx-auto flex w-full max-w-100 flex-1 flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-bg-base px-4">
        <Link href={ROUTES.admin} className="flex items-center gap-2 font-bold">
          관리
          {viewer === "owner" && (
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-contrast">
              어드민
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href={ROUTES.adminMatches}>매치</Link>
          <Link href={ROUTES.adminMembers}>멤버</Link>
          {viewer === "admin" && <Link href={ROUTES.home}>팀 화면</Link>}
          <SignOutButton />
        </nav>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
