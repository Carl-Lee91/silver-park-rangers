"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** 토스트가 떠 있는 시간 */
export const TOAST_MS = 2500;

/**
 * 화면 아래에 잠깐 뜨는 결과 안내("저장했어요."). 긴 폼 맨 아래에 작은 글씨로 두면 놓치기 쉽다.
 *
 *   const { show, toast } = useToast();
 *   show("저장했어요.");
 *   return <>…{toast}</>;
 */
export const useToast = () => {
  // 같은 말을 다시 띄워도 시간을 새로 세도록 번호를 붙인다.
  const [current, setCurrent] = useState<{ message: string; id: number } | null>(null);

  const show = useCallback((message: string) => setCurrent((previous) => ({ message, id: (previous?.id ?? 0) + 1 })), []);

  useEffect(() => {
    if (current === null) return;
    const timer = setTimeout(() => setCurrent(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [current]);

  const toast =
    current === null
      ? null
      : createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
            <p role="status" className="rounded-full bg-text-primary px-5 py-3 text-sm font-medium text-bg-base shadow-lg">
              {current.message}
            </p>
          </div>,
          document.body,
        );

  return { show, toast };
};
