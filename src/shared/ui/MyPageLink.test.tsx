import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

const { default: MyPageLink } = await import("./MyPageLink");

describe("내 정보 링크", () => {
  it("내 정보 화면으로 간다. 누르는 영역은 44px 이고 아이콘은 꾸밈이다", () => {
    const { container } = render(<MyPageLink />);
    const link = screen.getByRole("link", { name: "내 정보" });
    expect(link).toHaveAttribute("href", "/me");
    expect(link).toHaveClass("h-11");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("내 정보 화면에 있으면 지금 화면으로 표시한다", () => {
    route.pathname = "/me";
    render(<MyPageLink />);
    expect(screen.getByRole("link", { name: "내 정보" })).toHaveAttribute("aria-current", "page");
  });
});
