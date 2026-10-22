import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOAST_MS, useToast } from "./useToast";

function Harness({ message }: { message: string }) {
  const { show, toast } = useToast();
  return (
    <>
      <button type="button" onClick={() => show(message)}>
        저장
      </button>
      {toast}
    </>
  );
}

describe("토스트 — 화면 아래에 잠깐 뜨는 결과 안내", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("보여 주고, 잠시 뒤 사라진다", () => {
    render(<Harness message="저장했어요." />);
    act(() => screen.getByRole("button", { name: "저장" }).click());
    expect(screen.getByRole("status")).toHaveTextContent("저장했어요.");

    act(() => vi.advanceTimersByTime(TOAST_MS));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("다시 띄우면 시간을 새로 센다", () => {
    render(<Harness message="저장했어요." />);
    act(() => screen.getByRole("button", { name: "저장" }).click());
    act(() => vi.advanceTimersByTime(TOAST_MS - 100));
    act(() => screen.getByRole("button", { name: "저장" }).click());
    act(() => vi.advanceTimersByTime(TOAST_MS - 100));
    expect(screen.getByRole("status")).toHaveTextContent("저장했어요.");
  });
});
