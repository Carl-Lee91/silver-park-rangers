import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MatchSummary from "./MatchSummary";

const match = { date: "2026-11-01", startsAt: "10:00", endsAt: "13:00", quarterCount: 6, venue: "실버파크 구장", opponent: "FC 한강" };

describe("매치 미리보기 (풋볼매니저 경기 전 화면)", () => {
  it("우리 팀 엠블럼과 상대, 가운데 킥오프 시각을 둔다", () => {
    render(<MatchSummary match={match} />);
    expect(screen.getByText("우리 팀")).toBeInTheDocument();
    expect(screen.getByText("FC 한강")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("아래 줄에 구장 · 시간 · 쿼터를 칸으로 나눠 둔다", () => {
    render(<MatchSummary match={match} />);
    const terms = screen.getAllByRole("term").map((term) => term.textContent);
    const details = screen.getAllByRole("definition").map((detail) => detail.textContent);
    expect(terms).toEqual(["구장", "시간", "쿼터"]);
    expect(details).toEqual(["실버파크 구장", "10:00~13:00", "6쿼터"]);
  });

  it("상대를 아직 안 정했으면 '상대 미정', 구장이 없으면 '–'다", () => {
    render(<MatchSummary match={{ ...match, opponent: null, venue: null }} />);
    expect(screen.getByText("상대 미정")).toBeInTheDocument();
    expect(screen.getAllByRole("definition")[0]).toHaveTextContent("–");
  });
});
