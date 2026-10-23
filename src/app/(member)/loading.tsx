import { PageLoading } from "@/shared/ui";

/** 팀원 화면의 "불러오는 중". 아래 내 정보 · 로그아웃 줄(레이아웃)은 그대로 두고 본문 자리만 바뀐다. */
export default function Loading() {
  return (
    <>
      <div aria-hidden="true" className="min-h-14 bg-kit md:min-h-16" />
      <main className="mx-auto flex w-full max-w-page flex-1 flex-col px-4 md:px-6 lg:px-8">
        <PageLoading />
      </main>
    </>
  );
}
