"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeAdminNav, ADMIN_NAV } from "../lib/nav";

/**
 * 관리 메뉴 줄. 지금 화면의 메뉴를 표시한다(aria-current).
 * 좁은 화면에서는 머리글 아래 둘째 줄로 내려가 옆으로 밀어 본다(AdminShell).
 */
export default function AdminNav({ className = "" }: { className?: string }) {
  const active = activeAdminNav(usePathname());

  return (
    <nav aria-label="관리 메뉴" className={`flex items-center gap-1 overflow-x-auto text-sm ${className}`}>
      {ADMIN_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item === active ? "page" : undefined}
          className="shrink-0 rounded-lg px-3 py-1.5 text-text-secondary aria-[current=page]:bg-bg-subtle aria-[current=page]:font-semibold aria-[current=page]:text-text-primary"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
