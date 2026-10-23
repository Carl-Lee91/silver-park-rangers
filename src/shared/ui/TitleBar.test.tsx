import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TitleBar from "./TitleBar";

describe("머리띠 (PLAN.md §7 테마)", () => {
  it("하늘색 띠에 화면 제목(h1)과 그 위 보조 줄을 둔다", () => {
    render(<TitleBar title="vs FC 한강" overline="11월 2일 (일)" />);
    expect(screen.getByRole("banner")).toHaveClass("bg-kit", "text-kit-label");
    expect(screen.getByRole("heading", { level: 1, name: "vs FC 한강" })).toBeInTheDocument();
    expect(screen.getByText("11월 2일 (일)")).toBeInTheDocument();
  });

  it("맨 위 화면은 엠블럼을, 안쪽 화면은 엠블럼 자리에 뒤로 가기를 둔다", () => {
    const { container, rerender } = render(<TitleBar title="홈" />);
    expect(container.querySelector("img")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    rerender(<TitleBar title="매치" back={{ href: "/", label: "홈" }} />);
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/");
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("오른쪽에 상태 칩 · 주요 단추를 둔다", () => {
    render(<TitleBar title="스쿼드 편성" actions={<button type="button">저장</button>} />);
    expect(screen.getByRole("banner")).toContainElement(screen.getByRole("button", { name: "저장" }));
  });
});
