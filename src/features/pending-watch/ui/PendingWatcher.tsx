"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { watchMembers } from "@/entities/member/realtime";

type Props = {
  /** 바뀜을 듣는 방법. 테스트에서 바꿔 끼운다 */
  watch?: (onChange: () => void) => () => void;
};

/**
 * 관리 화면을 열어 둔 동안 가입 신청이 들어오면 화면을 새로 그린다(가입 신청 수·목록).
 * 그리는 것은 없다.
 */
export default function PendingWatcher({ watch = watchMembers }: Props) {
  const router = useRouter();
  useEffect(() => watch(() => router.refresh()), [watch, router]);
  return null;
}
