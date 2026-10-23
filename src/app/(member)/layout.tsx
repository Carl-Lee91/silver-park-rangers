import { SignOutButton } from "@/features/sign-out";
import { MyPageLink } from "@/shared/ui";

/**
 * 팀원 화면(홈 · 매치 · 내 정보) 공통 틀. 맨 아래에 "내 정보 · 로그아웃" 줄을 늘 둔다 —
 * 어느 화면에서든 내 정보로 바로 간다(PLAN.md §7 "내 정보 · 로그아웃"). 새 팀원 화면은 이 묶음 안에 만든다(routes.test.ts).
 */
export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <footer className="border-t border-border bg-bg-panel">
        <nav
          aria-label="내 계정"
          className="mx-auto flex w-full max-w-page items-center justify-center gap-2 px-4 py-2 md:justify-end md:px-6 lg:px-8"
        >
          <MyPageLink />
          <SignOutButton />
        </nav>
      </footer>
    </>
  );
}
