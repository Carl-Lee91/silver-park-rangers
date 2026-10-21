import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { progress } from "./progressStore";
import TopProgressBar from "./TopProgressBar";

describe("맨 위 로딩 바", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("쉬고 있으면 보이지 않는다", () => {
    render(<TopProgressBar />);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("진행이 잠깐 이어질 때만 보인다 — 금방 끝나는 일은 깜빡이지 않는다", () => {
    render(<TopProgressBar />);
    act(() => progress.start());
    expect(screen.queryByRole("progressbar")).toBeNull();

    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("progressbar", { name: "불러오는 중" })).toBeInTheDocument();

    act(() => progress.done());
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("기다리는 사이 끝나면 아예 보이지 않는다", () => {
    render(<TopProgressBar />);
    act(() => progress.start());
    act(() => progress.done());
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
