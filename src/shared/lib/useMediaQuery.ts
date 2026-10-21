"use client";

import { useCallback, useSyncExternalStore } from "react";

/** 태블릿 이상(Tailwind `md`, 768px). 화면 폭 기준은 PLAN.md §7 "화면 크기"와 같다. */
export const TABLET_UP = "(min-width: 48rem)";

/**
 * 화면 폭 조건에 맞는지. 폭이 바뀌면 따라간다. 배치만 다르면 CSS(`md:` · `lg:`)로 하고,
 * **그리는 것 자체가 달라질 때만**(탭 ↔ 한눈에 보기) 쓴다.
 *
 * 서버와 matchMedia 가 없는 곳에서는 좁은 화면으로 본다(모바일 우선).
 */
export const useMediaQuery = (query: string) => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    () => false,
  );
};
