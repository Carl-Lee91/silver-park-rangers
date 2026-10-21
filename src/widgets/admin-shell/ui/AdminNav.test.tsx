import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/admin/matches/m1/squad" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

const { default: AdminNav } = await import("./AdminNav");

describe("관리 메뉴 줄", () => {
  it("스쿼드 메뉴가 있고, 지금 화면의 메뉴를 표시한다", () => {
    render(<AdminNav />);
    expect(screen.getByRole("link", { name: "스쿼드" })).toHaveAttribute("href", "/admin/squads");
    expect(screen.getByRole("link", { name: "스쿼드" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "매치" })).not.toHaveAttribute("aria-current");
  });
});
