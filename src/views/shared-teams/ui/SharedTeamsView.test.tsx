import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SharedTeams } from "@/entities/futsal";
import SharedTeamsView from "./SharedTeamsView";

const shared: SharedTeams = {
  matchId: "m1",
  match: { date: "2026-11-01", startsAt: "10:00", endsAt: "12:00", venue: "실버파크 풋살장", opponent: null, format: "futsal5" },
  teams: [
    [
      { id: null, name: "가", jerseyNumber: 1 },
      { id: null, name: "나", jerseyNumber: 2 },
    ],
    [{ id: null, name: "다", jerseyNumber: null }],
  ],
};

describe("공유 링크로 연 풋살 팀", () => {
  it("팀마다 명단을 두고, 이미지 없이 링크 공유만 둔다", () => {
    render(<SharedTeamsView shared={shared} shareUrl="https://x/s/t" title="11/1 팀" />);
    expect(screen.getByText("A팀")).toBeInTheDocument();
    expect(screen.getByText("B팀")).toBeInTheDocument();
    expect(screen.getByText("다")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "공유하기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "쿼터별 이미지" })).not.toBeInTheDocument();
  });

  it("종류를 보여 주고, 팀원은 매치 화면으로 가서 투표한다", () => {
    render(<SharedTeamsView shared={shared} shareUrl="https://x/s/t" title="11/1 팀" />);
    const summary = screen.getAllByRole("definition");
    expect(summary[2]).toHaveTextContent("풋살 5:5");
    const link = screen.getByRole("link", { name: /참석 투표/ });
    expect(link).toHaveAttribute("href", "/matches/m1");
    expect(within(link).queryByText("스쿼드")).toBeNull();
  });
});
