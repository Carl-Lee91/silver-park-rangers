import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Jersey from "./Jersey";

describe("유니폼", () => {
  it("유니폼 모양 안에 글자(등번호)를 넣는다", () => {
    render(<Jersey label="7" tone="kit" />);
    const jersey = screen.getByText("7").closest("[data-jersey]");
    expect(jersey).toHaveAttribute("data-jersey", "kit");
    expect(jersey?.querySelector("svg path")).toBeInTheDocument();
  });

  it("키퍼는 키퍼 색, 빈자리는 점선 유니폼이다", () => {
    render(
      <>
        <Jersey label="1" tone="keeper" />
        <Jersey label="CB" tone="empty" />
      </>,
    );
    expect(screen.getByText("1").closest("[data-jersey]")).toHaveAttribute("data-jersey", "keeper");
    expect(screen.getByText("CB").closest("[data-jersey]")).toHaveAttribute("data-jersey", "empty");
  });
});
