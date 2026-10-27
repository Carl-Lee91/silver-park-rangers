"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { useProgressWhile } from "./progress/useProgressWhile";
import { useConfirm, type ConfirmOptions } from "./useConfirm";

/** 편집 화면에서 저장하지 않고 다른 화면으로 갈 때(스쿼드 빌더 · 팀 나누기) */
export const LEAVE_UNSAVED: ConfirmOptions = {
  message: "저장하지 않은 변경이 있어요. 다른 화면으로 가면 사라져요. 갈까요?",
  confirmLabel: "나가기",
  tone: "danger",
};

type Props = {
  href: string;
  /** 가기 전에 물을 것(예: 저장하지 않은 변경이 사라진다). null 이면 그냥 링크다 */
  confirm: ConfirmOptions | null;
  className?: string;
  children: ReactNode;
};

/**
 * 가기 전에 확인을 묻는 링크(편집 중인 화면에서 다른 화면으로 갈 때). 물을 것이 있으면 단추로 그린다 —
 * 링크로 두면 누르자마자 맨 위 로딩 바가 켜져서, 취소해도 한동안 돈다.
 */
export default function ConfirmLink({ href, confirm, className, children }: Props) {
  const router = useRouter();
  const { confirm: ask, dialog } = useConfirm();
  const [pending, startTransition] = useTransition();
  useProgressWhile(pending);

  if (confirm === null) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (await ask(confirm)) startTransition(() => router.push(href));
        }}
        className={className}
      >
        {children}
      </button>
      {dialog}
    </>
  );
}
