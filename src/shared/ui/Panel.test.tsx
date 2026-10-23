import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Panel from "./Panel";

describe("패널 (PLAN.md §7 테마)", () => {
  it("머리 줄에 제목(h2)과 오른쪽 요약을 두고, 본문을 그 아래에 둔다", () => {
    render(
      <Panel title="참석자" aside="참석 14 · 미정 3">
        <p>명단</p>
      </Panel>,
    );
    const panel = screen.getByRole("region", { name: "참석자" });
    expect(screen.getByRole("heading", { level: 2, name: "참석자" })).toBeInTheDocument();
    expect(panel).toHaveTextContent("참석 14 · 미정 3");
    expect(panel).toHaveTextContent("명단");
  });

  it("목록·표처럼 가장자리까지 채우는 본문은 안쪽 여백을 뺀다", () => {
    const { container, rerender } = render(<Panel title="표">본문</Panel>);
    expect(container.querySelector("[data-panel-body]")).toHaveClass("p-3");
    rerender(
      <Panel title="표" flush>
        본문
      </Panel>,
    );
    expect(container.querySelector("[data-panel-body]")).not.toHaveClass("p-3");
  });

  it("바탕 위에 뜬 상자다: 패널 바탕 · 테두리 · 각진 모서리", () => {
    render(<Panel title="다음 매치">본문</Panel>);
    expect(screen.getByRole("region")).toHaveClass("bg-bg-panel", "border-border", "rounded-box");
  });
});
