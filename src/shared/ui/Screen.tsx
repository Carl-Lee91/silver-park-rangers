import type { ComponentProps, ReactNode } from "react";
import TitleBar, { SCREEN_WIDTHS } from "./TitleBar";

type Props = ComponentProps<typeof TitleBar> & { children: ReactNode; className?: string };

/**
 * 화면 하나의 틀: 맨 위 머리띠(TitleBar) + 본문(main). 띠 안 내용과 본문을 같은 폭(width)에 맞춰
 * 제목과 내용의 왼쪽 줄이 같다. 관리 화면은 관리 틀(AdminShell)의 오른쪽 칸 안에 이 틀을 놓는다.
 */
export default function Screen({ children, className = "", width = "page", ...bar }: Props) {
  return (
    <>
      <TitleBar {...bar} width={width} />
      <main
        className={`mx-auto flex w-full ${SCREEN_WIDTHS[width]} flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8 ${className}`}
      >
        {children}
      </main>
    </>
  );
}
