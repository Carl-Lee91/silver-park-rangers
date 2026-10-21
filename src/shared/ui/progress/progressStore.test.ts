import { describe, expect, it, vi } from "vitest";
import { createProgressStore } from "./progressStore";

describe("로딩 상태 모음", () => {
  it("처음에는 쉬고 있다", () => {
    expect(createProgressStore().isActive()).toBe(false);
  });

  it("하나라도 진행 중이면 진행 중이다 — 시작한 만큼 끝나야 쉰다", () => {
    const store = createProgressStore();
    store.start();
    store.start();
    store.done();
    expect(store.isActive()).toBe(true);
    store.done();
    expect(store.isActive()).toBe(false);
  });

  it("끝을 더 불러도 음수가 되지 않는다", () => {
    const store = createProgressStore();
    store.done();
    store.start();
    expect(store.isActive()).toBe(true);
  });

  it("바뀔 때마다 알려 주고, 구독을 끊을 수 있다", () => {
    const store = createProgressStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.start();
    unsubscribe();
    store.done();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
