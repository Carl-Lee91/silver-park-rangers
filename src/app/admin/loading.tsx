import { PageLoading } from "@/shared/ui";

/** 관리 화면의 "불러오는 중". 관리 메뉴(레이아웃)는 그대로 두고, 오른쪽 칸에 빈 머리띠와 기다림 표시를 둔다. */
export default function Loading() {
  return (
    <>
      <div aria-hidden="true" className="min-h-14 bg-kit md:min-h-16" />
      <PageLoading />
    </>
  );
}
