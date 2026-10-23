import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResponseChip from "./ResponseChip";

describe("내 응답 칩", () => {
  it("응답이 있으면 참석 · 미정 · 불참을 뜻 색으로 보인다", () => {
    const { rerender } = render(<ResponseChip response="yes" open />);
    expect(screen.getByText("참석")).toHaveClass("text-primary");
    rerender(<ResponseChip response="maybe" open />);
    expect(screen.getByText("미정")).toHaveClass("text-fit-fair");
    rerender(<ResponseChip response="no" open />);
    expect(screen.getByText("불참")).toHaveClass("text-text-secondary");
  });

  it("응답이 없으면 마감 전엔 빨간 테두리 '투표 전', 마감 뒤엔 '마감'", () => {
    const { rerender } = render(<ResponseChip response={undefined} open />);
    expect(screen.getByText("투표 전")).toHaveClass("border-danger");
    rerender(<ResponseChip response={undefined} open={false} />);
    expect(screen.getByText("마감")).toBeInTheDocument();
  });
});
