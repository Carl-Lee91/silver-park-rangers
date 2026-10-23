import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MatchResultLine } from "../model/form";
import FormStrip from "./FormStrip";
import ResultRow from "./ResultRow";

const line = (matchId: string, date: string, ours: number, theirs: number): MatchResultLine => ({
  matchId,
  date,
  opponent: "FC 한강",
  ours,
  theirs,
  outcome: ours > theirs ? "win" : ours < theirs ? "loss" : "draw",
});

describe("최근 폼 (풋볼매니저 폼)", () => {
  it("왼쪽이 오래된 매치, 오른쪽이 최신이다 — 최근 순으로 받아도 뒤집어 놓는다", () => {
    render(<FormStrip results={[line("c", "2026-10-26", 4, 2), line("b", "2026-10-19", 1, 3), line("a", "2026-10-12", 2, 2)]} />);
    expect(screen.getByRole("img", { name: "최근 3매치: 무, 패, 승 (오른쪽이 최신)" })).toBeInTheDocument();
  });

  it("칸마다 글자(승 · 무 · 패)를 적는다 — 색만으로 구분하지 않는다", () => {
    const { container } = render(<FormStrip results={[line("a", "2026-10-12", 1, 0)]} />);
    expect(container).toHaveTextContent("승");
    expect(container.querySelector("[data-outcome=win]")).toHaveClass("bg-result-win");
  });

  it("결과를 남긴 매치가 없으면 그렇다고 쓴다", () => {
    render(<FormStrip results={[]} />);
    expect(screen.getByText("아직 결과를 남긴 매치가 없어요.")).toBeInTheDocument();
  });
});

describe("결과 한 줄", () => {
  it("날짜 · 상대 · 합계 점수 · 승무패를 한 줄로 둔다(날짜 글자는 부르는 쪽이 만든다)", () => {
    render(<ResultRow result={line("a", "2026-10-26", 4, 2)} dateLabel="10월 26일 (월)" href="/matches/a" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/matches/a");
    expect(link).toHaveTextContent("10월 26일 (월)");
    expect(link).toHaveTextContent("vs FC 한강");
    expect(link).toHaveTextContent("4 : 2");
    expect(link).toHaveTextContent("승");
  });
});
