"use client";

import { useEffect } from "react";
import { listenForInstallPrompt } from "../model/installPrompt";

/**
 * 앱 전체에 하나(루트 레이아웃). 브라우저 설치 창 이벤트를 화면을 옮겨도 놓치지 않게 처음부터 듣고,
 * 최소 서비스 워커(public/sw.js)를 등록한다 — 크롬은 이게 있어야 설치 창을 띄운다(PLAN.md §7 "앱으로 설치").
 */
export default function InstallListener() {
  useEffect(() => {
    listenForInstallPrompt();
    // 등록에 실패해도(사생활 모드 · 오래된 브라우저) 앱은 그대로 쓴다. 설치 창만 안 뜬다.
    navigator.serviceWorker?.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
