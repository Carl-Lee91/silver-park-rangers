"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { progress } from "./progressStore";

/** 이만큼 넘게 걸릴 때만 보인다. 금방 끝나는 일마다 바가 깜빡이면 오히려 거슬린다. */
const DELAY_MS = 150;

/**
 * 맨 위에 붙는 얇은 로딩 바(앱 전체에 하나, 루트 레이아웃). 화면 이동과 서버 요청이 켠다.
 * 카톡 인앱 브라우저는 앱 안 화면 이동에 자체 로딩 표시가 없어서 이게 없으면 멈춘 것처럼 보인다.
 */
export default function TopProgressBar() {
  const active = useSyncExternalStore(progress.subscribe, progress.isActive, () => false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setShown(true), DELAY_MS);
    return () => {
      clearTimeout(timer);
      setShown(false);
    };
  }, [active]);

  if (!active || !shown) return null;
  return (
    <div
      role="progressbar"
      aria-label="불러오는 중"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-primary-soft"
    >
      <div className="h-full w-1/3 animate-progress bg-primary" />
    </div>
  );
}
