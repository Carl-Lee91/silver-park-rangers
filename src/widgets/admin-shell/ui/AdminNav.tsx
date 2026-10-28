"use client";

import { CalendarDays, ChartColumn, Shirt, Users, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/shared/config";
import { tabClass } from "@/shared/ui";
import { activeAdminNav, ADMIN_NAV } from "../lib/nav";

const ICONS: Record<string, LucideIcon> = {
  [ROUTES.adminMatches]: CalendarDays,
  [ROUTES.adminSquads]: Shirt,
  [ROUTES.adminMembers]: Users,
  [ROUTES.adminDues]: Wallet,
  [ROUTES.adminStats]: ChartColumn,
};

/**
 * 관리 메뉴. 지금 화면의 메뉴를 표시한다(aria-current).
 * 태블릿 이하는 하위 탭처럼 가로 줄(좁으면 옆으로 밀어 본다), 데스크톱은 풋볼매니저처럼 왼쪽 세로 메뉴다(AdminShell).
 * 아이콘은 데스크톱에서만 보인다.
 */
export default function AdminNav({ className = "" }: { className?: string }) {
  const active = activeAdminNav(usePathname());

  return (
    <nav
      aria-label="관리 메뉴"
      className={`flex items-center gap-1 overflow-x-auto lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-visible ${className}`}
    >
      {ADMIN_NAV.map((item) => {
        const Icon = ICONS[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item === active ? "page" : undefined}
            className={tabClass(
              "group lg:justify-start lg:gap-3 lg:rounded-box lg:border-b-0 lg:text-base lg:aria-[current=page]:bg-primary/15",
            )}
          >
            <Icon aria-hidden="true" className="hidden size-5 text-text-tertiary group-aria-[current=page]:text-primary lg:block" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
