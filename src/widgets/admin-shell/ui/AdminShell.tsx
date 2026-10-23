import Link from "next/link";
import type { ReactNode } from "react";
import { fetchMyGate } from "@/entities/member/server";
import { PendingWatcher } from "@/features/pending-watch";
import { SignOutButton } from "@/features/sign-out";
import { ROUTES } from "@/shared/config";
import AdminNav from "./AdminNav";

/**
 * 관리 화면 공통 틀. 어드민 계정이면 표시를 달고, 관리자(선수)면 팀 화면으로 가는 길을 둔다.
 *
 * 메뉴는 태블릿 이상에서 머리글 한 줄에 같이 놓이고, 모바일에서는 둘째 줄로 내려가 옆으로 밀어 본다
 * (메뉴가 하나라 같은 링크가 두 번 그려지지 않는다).
 */
export default async function AdminShell({ children }: { children: ReactNode }) {
  const viewer = await fetchMyGate();

  return (
    <div className="flex w-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-bg-base">
        <div className="mx-auto flex w-full max-w-wide flex-wrap items-center gap-x-6 px-4 md:h-14 md:flex-nowrap md:px-6 lg:px-8">
          <Link href={ROUTES.admin} className="flex h-14 items-center gap-2 font-bold md:h-auto">
            관리
            {viewer === "owner" && (
              <span className="rounded-chip bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-contrast">
                어드민
              </span>
            )}
          </Link>
          <AdminNav className="order-last basis-full pb-2 md:order-none md:basis-auto md:pb-0" />
          <div className="ml-auto flex items-center gap-4 text-sm">
            {viewer === "admin" && (
              <Link href={ROUTES.home} className="inline-flex h-11 items-center">
                팀 화면
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-wide flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8">{children}</main>
      <PendingWatcher />
    </div>
  );
}
