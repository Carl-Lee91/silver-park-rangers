import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Match } from "../model/match";
import MatchCard from "./MatchCard";

const match: Match = {
  id: "m1",
  date: "2026-11-01",
  startsAt: "10:00",
  endsAt: "13:00",
  quarterCount: 6,
  venue: "실버파크 구장",
  opponent: "FC 한강",
  voteDeadline: null,
  squadPublishedAt: null,
  shareToken: "t",
  format: "football",
  teamCount: 2,
};

describe("매치 줄 (풋볼매니저 일정표)", () => {
  it("왼쪽 일정 칸에 월 · 일 · 요일, 가운데 상대와 시간 · 쿼터 · 장소를 둔다", () => {
    render(<MatchCard match={match} href="/matches/m1" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/matches/m1");
    expect(link).toHaveTextContent("11월");
    expect(link).toHaveTextContent("vs FC 한강");
    expect(link).toHaveTextContent("10:00~13:00 · 6쿼터 · 실버파크 구장");
  });

  it("일정 칸은 꾸밈이고, 날짜는 한 줄로 읽는다", () => {
    const { container } = render(<MatchCard match={match} href="/matches/m1" />);
    expect(container.querySelector("[data-date-block]")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("11월 1일 (일)")).toHaveClass("sr-only");
  });

  it("오른쪽에 내 투표 같은 표시를 둔다", () => {
    render(<MatchCard match={match} href="/matches/m1" aside={<span>참석</span>} />);
    expect(screen.getByRole("link")).toHaveTextContent(/참석$/);
  });

  it("풋살 매치는 쿼터 수 대신 종류(풋살 5:5)를 쓴다", () => {
    render(<MatchCard match={{ ...match, format: "futsal5" }} href="/matches/m1" />);
    expect(screen.getByRole("link")).toHaveTextContent("10:00~13:00 · 풋살 5:5 · 실버파크 구장");
  });
});
