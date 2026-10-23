import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BackLink from "./BackLink";

describe("뒤로 가기", () => {
  it("돌아갈 화면 이름으로 찾고, 그 주소로 간다", () => {
    render(<BackLink href="/" label="홈" />);
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/");
  });

  it("꺾쇠는 꾸밈이라 읽지 않고, 누르는 영역은 44px 이다", () => {
    const { container } = render(<BackLink href="/" label="홈" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link")).toHaveClass("h-11");
  });

  it("머리띠 위에서는 띠 글자색(남색)으로 그린다", () => {
    render(<BackLink href="/" label="홈" tone="band" />);
    expect(screen.getByRole("link")).toHaveClass("text-kit-label");
    expect(screen.getByRole("link")).not.toHaveClass("text-text-secondary");
  });
});
