import { PageLoading } from "@/shared/ui";

/** 모든 화면의 "불러오는 중"(PLAN.md §7). 화면을 누르자마자 빈 머리띠와 기다림 표시가 먼저 뜬다. */
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
