import { LogOut } from "lucide-react";
import { ACCOUNT_ITEM, SubmitButton } from "@/shared/ui";
import { signOutAction } from "../api/signOutAction";

/** 로그아웃. 내 정보 링크(MyPageLink)와 같은 모양으로 나란히 놓인다(PLAN.md §7 "내 정보 · 로그아웃") */
export default function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <SubmitButton className={`${ACCOUNT_ITEM} ${className}`}>
        <LogOut aria-hidden="true" className="size-4 shrink-0" />
        로그아웃
      </SubmitButton>
    </form>
  );
}
