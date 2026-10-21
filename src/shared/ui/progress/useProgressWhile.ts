import { useEffect } from "react";
import { progress } from "./progressStore";

/** `pending` 인 동안 맨 위 로딩 바를 켠다. 진행 중에 화면에서 사라져도 끈다. */
export const useProgressWhile = (pending: boolean) => {
  useEffect(() => {
    if (!pending) return;
    progress.start();
    return () => progress.done();
  }, [pending]);
};
