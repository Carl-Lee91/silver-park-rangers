import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { progress } from "./progressStore";

const route = vi.hoisted(() => ({ pathname: "/", search: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.search),
}));

const { default: NavigationProgress } = await import("./NavigationProgress");

describe("화면 이동 로딩", () => {
  it("다른 화면으로 가는 링크를 누르면 켜고, 주소가 바뀌면 끈다", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <NavigationProgress />
        <a href="/me" onClick={(event) => event.preventDefault()}>
          내 정보
        </a>
      </>,
    );

    await user.click(screen.getByRole("link", { name: "내 정보" }));
    expect(progress.isActive()).toBe(true);

    route.pathname = "/me";
    rerender(
      <>
        <NavigationProgress />
        <a href="/me">내 정보</a>
      </>,
    );
    expect(progress.isActive()).toBe(false);
  });
});
