import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const { default: PendingWatcher } = await import("./PendingWatcher");

describe("가입 신청 실시간 감시", () => {
  it("멤버가 바뀌었다는 알림이 오면 화면을 새로 그린다", () => {
    let notify = () => {};
    const watch = vi.fn((onChange: () => void) => {
      notify = onChange;
      return () => {};
    });
    render(<PendingWatcher watch={watch} />);

    notify();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("화면을 떠나면 그만 듣는다", () => {
    const stop = vi.fn();
    const { unmount } = render(<PendingWatcher watch={() => stop} />);
    unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
