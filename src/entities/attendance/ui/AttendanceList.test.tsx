import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Attendance } from "../model/attendance";
import AttendanceList from "./AttendanceList";

const row = (memberId: string, realName: string, response: Attendance["response"]): Attendance => ({
  memberId,
  realName,
  response,
  arriveAt: null,
  leaveAt: null,
  attended: null,
});
const attendance = [row("a", "김철수", "yes"), row("b", "이영희", "maybe")];

describe("참석 명단", () => {
  it("팀원 화면에서는 이름만 늘어놓는다(링크 없음)", () => {
    render(<AttendanceList attendance={attendance} />);
    expect(screen.getByText("김철수")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("관리 화면에서는 이름을 누르면 선수 상세로 간다", () => {
    render(<AttendanceList attendance={attendance} hrefOf={(id) => `/admin/members/${id}`} />);
    expect(screen.getByRole("link", { name: "김철수" })).toHaveAttribute("href", "/admin/members/a");
    expect(screen.getByRole("link", { name: "이영희" })).toHaveClass("min-h-11");
  });
});
