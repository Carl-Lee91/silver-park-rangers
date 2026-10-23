import type { ReactNode } from "react";
import BackLink from "./BackLink";
import Emblem from "./Emblem";

const WIDTHS = { narrow: "max-w-narrow", page: "max-w-page", wide: "max-w-wide" } as const;

type Props = {
  /** 화면 제목(h1) */
  title: ReactNode;
  /** 제목 위 작은 줄: 날짜 · 상대 · 팀 이름 같은 보조 정보 */
  overline?: ReactNode;
  /** 안쪽 화면이면 엠블럼 자리에 뒤로 가기(‹ + 돌아갈 화면 이름)를 둔다 */
  back?: { href: string; label: string };
  /** 오른쪽: 상태 칩 · 주요 단추 */
  actions?: ReactNode;
  /** 띠 안 내용 폭. 아래 본문 폭에 맞춘다 */
  width?: keyof typeof WIDTHS;
};

/**
 * 머리띠(PLAN.md §7 "테마"): 풋볼매니저의 구단 색 타이틀 바. 화면 맨 위를 우리 유니폼 하늘색으로 칠하고
 * 엠블럼(또는 뒤로 가기) · 제목 · 보조 줄 · 주요 단추를 남색으로 올린다. 띠는 화면 끝까지, 내용은 본문 폭에 맞춘다.
 */
export default function TitleBar({ title, overline, back, actions, width = "page" }: Props) {
  return (
    <header className="bg-kit text-kit-label">
      <div className={`mx-auto flex min-h-14 w-full ${WIDTHS[width]} items-center gap-3 px-4 md:min-h-16 md:px-6 lg:px-8`}>
        {back ? (
          <div className="shrink-0">
            <BackLink href={back.href} label={back.label} tone="band" />
          </div>
        ) : (
          <Emblem className="h-8 w-7 md:h-9 md:w-8" />
        )}
        <div className="min-w-0 flex-1 py-2">
          {overline && <p className="truncate text-xs font-semibold text-kit-label/85">{overline}</p>}
          <h1 className="truncate text-lg leading-tight font-extrabold md:text-xl">{title}</h1>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>
    </header>
  );
}
