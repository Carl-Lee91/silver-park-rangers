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

  it("메뉴마다 아이콘이 있다(데스크톱 왼쪽 메뉴). 아이콘은 꾸밈이라 이름만 읽는다", () => {
    render(<AdminNav />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["매치", "스쿼드", "멤버", "통계"]);
  });
});
