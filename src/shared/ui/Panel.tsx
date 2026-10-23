import type { ReactNode } from "react";

type Props = {
  /** 머리 줄의 작은 굵은 제목(h2) */
  title: ReactNode;
  /** 머리 줄 오른쪽: 인원수 · 마감처럼 짧은 요약이나 작은 링크 */
  aside?: ReactNode;
  /** 목록 · 표처럼 가장자리까지 채우는 본문이면 안쪽 여백을 뺀다 */
  flush?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * 풋볼매니저 패널(PLAN.md §7 "테마"): 어두운 머리 줄 + 본문 상자. 앱 바탕보다 한 단계 밝아 위에 떠 보인다.
 * 제목이 글자면 그 이름으로 영역(region)을 읽는다.
 */
export default function Panel({ title, aside, flush = false, className = "", children }: Props) {
  return (
    <section
      aria-label={typeof title === "string" ? title : undefined}
      className={`overflow-hidden rounded-box border border-border bg-bg-panel ${className}`}
    >
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-border bg-bg-subtle px-3 md:px-4">
        <h2 className="text-xs font-bold tracking-wider text-text-secondary">{title}</h2>
        {aside && <div className="min-w-0 truncate text-right text-xs text-text-tertiary">{aside}</div>}
      </header>
      <div data-panel-body className={flush ? "" : "p-3 md:p-4"}>
        {children}
      </div>
    </section>
  );
}
