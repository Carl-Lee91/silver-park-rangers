import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { MatchTrendPoint } from "@/entities/stats";
import AttendanceTrendChart from "./AttendanceTrendChart";

const point = (date: string, attended: number | null, yes = 18, guestsAttended: number | null = 0): MatchTrendPoint => ({
  matchId: date,
  date,
  opponent: "FC 서울",
  yes,
  attended,
  guestsAttended,
});

const trend = [point("2026-10-04", 14), point("2026-10-11", 17, 18, 2), point("2026-10-18", 15), point("2026-10-25", null, 12, null)];

describe("매치별 실제 출석 차트", () => {
  it("값은 최댓값과 마지막으로 확정한 매치에만 붙인다", () => {
    render(<AttendanceTrendChart trend={trend} />);
    const bars = screen.getAllByRole("button");
    expect(bars[1]).toHaveTextContent("17");
    expect(bars[2]).toHaveTextContent("15");
    expect(bars[0]).not.toHaveTextContent("14");
  });

  it("출석을 정하지 않은 매치는 막대 없이 – 로 둔다", () => {
    render(<AttendanceTrendChart trend={trend} />);
    expect(screen.getAllByRole("button")[3]).toHaveTextContent("–");
  });

  it("막대를 누르면 날짜·상대·출석·투표를 보여 준다", async () => {
    const user = userEvent.setup();
    render(<AttendanceTrendChart trend={trend} />);
    await user.click(screen.getAllByRole("button")[1]);
    expect(screen.getByText("10월 11일 (일) vs FC 서울 — 실제 출석 17명(용병 2) · 참석 투표 18명")).toBeInTheDocument();
  });

  it("표로 보기에 모든 매치가 있다 — 툴팁 없이도 값을 볼 수 있다", () => {
    render(<AttendanceTrendChart trend={trend} />);
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(5);
    expect(rows[4]).toHaveTextContent("미확정");
  });

  it("매치가 없으면 안내만 보여 준다", () => {
    render(<AttendanceTrendChart trend={[]} />);
    expect(screen.getByText("기간 안에 지난 매치가 없어요.")).toBeInTheDocument();
  });
});
