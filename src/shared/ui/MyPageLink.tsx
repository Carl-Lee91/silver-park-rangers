"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/shared/config";
import { ACCOUNT_ITEM } from "./account";

/**
 * 내 정보로 가는 링크(PLAN.md §7 "내 정보 · 로그아웃"). 팀원 화면 맨 아래 줄과 관리 메뉴에서 로그아웃 옆에 둔다.
 * 내 정보 화면에 있으면 지금 화면으로 표시한다.
 */
export default function MyPageLink({ className = "" }: { className?: string }) {
  const current = usePathname() === ROUTES.me;
  return (
    <Link href={ROUTES.me} aria-current={current ? "page" : undefined} className={`${ACCOUNT_ITEM} ${className}`}>
      <UserRound aria-hidden="true" className="size-4 shrink-0" />내 정보
    </Link>
  );
}
