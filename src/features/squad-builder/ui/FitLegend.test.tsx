import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FitLegend from "./FitLegend";

describe("자리 적합도 범례", () => {
  it("점 색이 무엇인지 순서대로 보여 준다 — 색만으로는 뜻을 알 수 없다", () => {
    render(<FitLegend />);
    const legend = screen.getByRole("list", { name: "자리 적합도" });
    expect(legend).toHaveTextContent("1순위2순위3순위선호 아님");
  });
});
