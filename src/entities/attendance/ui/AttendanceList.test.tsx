import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Attendance } from "../model/attendance";
import AttendanceList from "./AttendanceList";

const row = (memberId: string, realName: string, response: Attendance["response"]): Attendance => ({
  memberId,
  realName,
  jerseyNumber: null,
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

  it("! 단추 · 등번호 · 이름 순서로 둔다", () => {
    render(<AttendanceList attendance={[{ ...attendance[0], jerseyNumber: 7 }]} tips={{ a: <button type="button">김철수 정보</button> }} />);
    expect(screen.getByRole("listitem")).toHaveTextContent("김철수 정보7김철수");
  });

  it("관리 화면에서도 ! 단추는 링크 밖에 있다(누르면 상세로 가지 않고 툴팁이 뜬다)", () => {
    render(
      <AttendanceList
        attendance={[{ ...attendance[0], jerseyNumber: 7 }]}
        tips={{ a: <button type="button">김철수 정보</button> }}
        hrefOf={(id) => `/admin/members/${id}`}
      />,
    );
    expect(screen.getByRole("button", { name: "김철수 정보" }).closest("a")).toBeNull();
    expect(screen.getByRole("link")).toHaveTextContent("7김철수");
  });
});
