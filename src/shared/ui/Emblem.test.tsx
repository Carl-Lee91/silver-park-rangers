import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Emblem, { EMBLEM_SRC } from "./Emblem";

describe("엠블럼", () => {
  it("한 파일에서 읽는다 — 팀 엠블럼을 받으면 이 파일만 바꾼다", () => {
    const { container } = render(<Emblem />);
    expect(container.querySelector("img")).toHaveAttribute("src", EMBLEM_SRC);
  });

  it("옆에 팀 이름이 있으면 꾸밈이라 읽지 않고, 혼자 있으면 팀 이름으로 읽는다", () => {
    const { container, rerender } = render(<Emblem />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    rerender(<Emblem label="Silver Park Rangers" />);
    expect(screen.getByRole("img", { name: "Silver Park Rangers" })).toBeInTheDocument();
  });
});
