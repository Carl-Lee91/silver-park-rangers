import { PageLoading } from "@/shared/ui";

/** 모든 화면의 "불러오는 중"(PLAN.md §7). 화면을 누르자마자 이 자리가 먼저 뜬다. */
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-100 flex-1 flex-col px-4">
      <PageLoading />
    </main>
  );
}
