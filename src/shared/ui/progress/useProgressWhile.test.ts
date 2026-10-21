import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { progress } from "./progressStore";
import { useProgressWhile } from "./useProgressWhile";

describe("진행 중인 동안 전역 로딩 바 켜기", () => {
  it("진행 중이면 켜고, 끝나면 끈다", () => {
    const { rerender, unmount } = renderHook(({ pending }) => useProgressWhile(pending), {
      initialProps: { pending: false },
    });
    expect(progress.isActive()).toBe(false);
    rerender({ pending: true });
    expect(progress.isActive()).toBe(true);
    rerender({ pending: false });
    expect(progress.isActive()).toBe(false);
    unmount();
  });

  it("진행 중에 화면에서 사라져도 끈다", () => {
    const { unmount } = renderHook(() => useProgressWhile(true));
    expect(progress.isActive()).toBe(true);
    unmount();
    expect(progress.isActive()).toBe(false);
  });
});
