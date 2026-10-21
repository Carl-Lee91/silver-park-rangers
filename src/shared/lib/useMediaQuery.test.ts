import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

type Listener = () => void;

const stubMatchMedia = (initial: boolean) => {
  let matches = initial;
  const listeners = new Set<Listener>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
  }));
  return (next: boolean) => {
    matches = next;
    listeners.forEach((listener) => listener());
  };
};

describe("화면 폭 조건", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("조건에 맞는지 알려 주고, 화면 폭이 바뀌면 따라간다", () => {
    const resize = stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
    act(() => resize(true));
    expect(result.current).toBe(true);
  });

  it("matchMedia 가 없는 곳(서버·오래된 브라우저)에서는 좁은 화면으로 본다", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });
});
