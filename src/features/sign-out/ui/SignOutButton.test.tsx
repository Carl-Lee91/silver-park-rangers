import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../api/signOutAction", () => ({ signOutAction: vi.fn() }));

const { default: SignOutButton } = await import("./SignOutButton");

describe("로그아웃 단추", () => {
  it("내 정보 링크와 같은 모양으로 나란히 놓인다 — 꾸밈 아이콘 + 이름, 44px", () => {
    const { container } = render(<SignOutButton />);
    const button = screen.getByRole("button", { name: "로그아웃" });
    expect(button).toHaveClass("h-11");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("놓인 자리에 맞춘 모양을 뒤에 잇는다", () => {
    render(<SignOutButton className="lg:w-full" />);
    expect(screen.getByRole("button", { name: "로그아웃" })).toHaveClass("lg:w-full");
  });
});
