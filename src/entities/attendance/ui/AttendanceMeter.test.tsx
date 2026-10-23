import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AttendanceMeter from "./AttendanceMeter";

describe("참석 인원 막대 (홈 다음 매치)", () => {
  it("참석 · 미정 · 불참 인원을 글자로 적는다 — 12명이든 21명이든 숫자 그대로", () => {
    render(<AttendanceMeter counts={{ yes: 21, maybe: 2, no: 4 }} />);
    expect(screen.getByText("참석").parentElement).toHaveTextContent("참석 21");
    expect(screen.getByText("미정").parentElement).toHaveTextContent("미정 2");
    expect(screen.getByText("불참").parentElement).toHaveTextContent("불참 4");
  });

  it("막대는 응답한 사람 중 비율로 나눈다(꾸밈이라 읽지 않는다)", () => {
    const { container } = render(<AttendanceMeter counts={{ yes: 12, maybe: 4, no: 4 }} />);
    const bar = container.querySelector("[data-meter]");
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(bar?.querySelector("[data-part=yes]")).toHaveStyle({ width: "60%" });
    expect(bar?.querySelector("[data-part=maybe]")).toHaveStyle({ width: "20%" });
  });

  it("아무도 응답하지 않았으면 빈 막대에 '아직 응답이 없어요'", () => {
    render(<AttendanceMeter counts={{ yes: 0, maybe: 0, no: 0 }} />);
    expect(screen.getByText("아직 응답이 없어요.")).toBeInTheDocument();
  });
});
