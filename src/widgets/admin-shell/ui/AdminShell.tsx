import { House } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { fetchMyGate } from "@/entities/member/server";
import { PendingWatcher } from "@/features/pending-watch";
import { SignOutButton } from "@/features/sign-out";
import { ROUTES } from "@/shared/config";
import { ACCOUNT_ITEM, chipClass, Emblem, MyPageLink } from "@/shared/ui";
import AdminNav from "./AdminNav";

/**
 * 관리 화면 공통 틀(PLAN.md §7 "관리자"). 어드민 계정이면 표시를 달고, 관리자(선수)면 팀 화면으로 가는 길을 둔다.
 *
 * 데스크톱은 풋볼매니저처럼 왼쪽 메뉴(엠블럼 · 메뉴 · 팀 화면 · 로그아웃)이고, 오른쪽 칸에 화면마다 머리띠와 본문이 온다.
 * 태블릿은 위쪽 한 줄, 모바일은 메뉴가 둘째 줄로 내려가 옆으로 밀어 본다. 같은 메뉴를 CSS 로 옮길 뿐 두 번 그리지 않는다.
 */
export default async function AdminShell({ children }: { children: ReactNode }) {
  const viewer = await fetchMyGate();

  return (
    <div className="flex w-full flex-1 flex-col lg:flex-row">
      <aside className="sticky top-0 z-20 border-b border-border bg-bg-panel lg:h-dvh lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex flex-wrap items-center gap-x-4 px-4 md:flex-nowrap md:px-6 lg:h-full lg:flex-col lg:items-stretch lg:gap-2 lg:px-3 lg:py-4">
          <Link
            href={ROUTES.admin}
            className="flex h-12 items-center gap-2.5 lg:h-auto lg:border-b lg:border-border lg:px-2 lg:pb-4"
          >
            <Emblem className="size-8 lg:size-10" />
            <span className="flex flex-col leading-tight">
              <span className="hidden text-sm font-extrabold lg:block">Silver Park Rangers</span>
              <span className="flex items-center gap-1.5 text-sm font-bold lg:text-xs lg:font-medium lg:text-text-tertiary">
                관리
                {viewer === "owner" && <span className={chipClass("accent")}>어드민</span>}
              </span>
            </span>
          </Link>
          <AdminNav className="order-last -mx-1 basis-full md:order-none md:mx-0 md:basis-auto lg:pt-2" />
          <div className="ml-auto flex items-center gap-1 lg:mt-auto lg:ml-0 lg:flex-col lg:items-stretch lg:gap-0 lg:border-t lg:border-border lg:pt-2">
            {viewer === "admin" && (
              <>
                <Link href={ROUTES.home} className={`${ACCOUNT_ITEM} lg:w-full`}>
                  <House aria-hidden="true" className="size-4 shrink-0" />팀 화면
                </Link>
                {/* 관리자는 선수라서 내 정보가 있다. 어드민 계정은 선수가 아니라 없다 */}
                <MyPageLink className="lg:w-full" />
              </>
            )}
            <SignOutButton className="lg:w-full" />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <PendingWatcher />
    </div>
  );
}
