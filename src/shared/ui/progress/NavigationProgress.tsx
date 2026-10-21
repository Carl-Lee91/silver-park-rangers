"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { isNavigationClick } from "./navigationClick";
import { progress } from "./progressStore";

/** 주소가 끝내 안 바뀌어도(이동이 취소되는 등) 이만큼 지나면 끈다. */
const FAILSAFE_MS = 10_000;

/**
 * 앱 안 링크를 누르면 로딩 바를 켜고, 주소가 바뀌면 끈다. App Router 에는 이동 시작 이벤트가
 * 없어서 링크 클릭을 문서 전체에서 먼저(capture) 받는다. Link 가 preventDefault 하기 전이다.
 *
 * 🔴 `useSearchParams` 를 쓰므로 루트 레이아웃에서 `<Suspense>` 로 감싼다.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (pending.current === null) return;
    clearTimeout(pending.current);
    pending.current = null;
    progress.done();
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (anchor === null || pending.current !== null) return;
      const click = {
        button: event.button,
        modified: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
        href: anchor.href,
        target: anchor.target,
        download: anchor.hasAttribute("download"),
      };
      if (!isNavigationClick(click, window.location.href)) return;
      progress.start();
      pending.current = setTimeout(finish, FAILSAFE_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [finish]);

  // 주소가 바뀌면(새 화면이 들어오면) 끈다. 화면에서 사라질 때도 끈다.
  useEffect(() => finish(), [pathname, search, finish]);
  useEffect(() => finish, [finish]);

  return null;
}
