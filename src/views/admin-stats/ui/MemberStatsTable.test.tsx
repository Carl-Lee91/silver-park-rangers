import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { MemberStats } from "@/entities/stats";
import MemberStatsTable from "./MemberStatsTable";

const stats = (realName: string, extra: Partial<MemberStats> = {}): MemberStats => ({
  memberId: realName,
  realName,
  status: "approved",
  eligible: 6,
  responded: 6,
  responseRate: 1,
  confirmed: 5,
  attended: 4,
  attendanceRate: 0.8,
  yesConfirmed: 4,
  noShows: 0,
  noShowRate: 0,
  squadMatches: 4,
  fieldQuarters: 14,
  keeperQuarters: 0,
  avgFieldQuarters: 3.5,
  positionCounts: { MF: 10, CB: 4 },
  preferredShare: 0.71,
  goals: 0,
  assists: 0,
  ...extra,
});

const list = [
  stats("가멤버", { attendanceRate: 0.6, attended: 3, noShows: 2, noShowRate: 0.5, yesConfirmed: 4 }),
  stats("나멤버", { attendanceRate: 1, attended: 5, responseRate: 0.5, responded: 3 }),
  stats("다신입", { attendanceRate: null, attended: 0, confirmed: 0, avgFieldQuarters: null, preferredShare: null }),
];

const names = () => screen.getAllByRole("rowheader").map((cell) => cell.textContent);
const rowOf = (name: string) => screen.getByRole("rowheader", { name }).closest("tr")!;
const header = (name: string) => screen.getByRole("columnheader", { name: new RegExp(`^${name}`) });

describe("멤버별 표 (풋볼매니저 선수 표)", () => {
  it("기본은 참석률 높은 순이고, 낼 수 없는 사람은 맨 뒤다", () => {
    render(<MemberStatsTable stats={list} />);
    expect(names()).toEqual(["나멤버", "가멤버", "다신입"]);
    expect(header("참석률")).toHaveAttribute("aria-sort", "descending");
  });

  it("머리글을 누르면 그 칸으로 많은 순, 한 번 더 누르면 적은 순이다", async () => {
    const user = userEvent.setup();
    render(<MemberStatsTable stats={list} />);
    await user.click(within(header("노쇼")).getByRole("button"));
    expect(names()[0]).toBe("가멤버");
    expect(header("노쇼")).toHaveAttribute("aria-sort", "descending");
    expect(header("참석률")).not.toHaveAttribute("aria-sort");

    await user.click(within(header("응답률")).getByRole("button"));
    await user.click(within(header("응답률")).getByRole("button"));
    expect(header("응답률")).toHaveAttribute("aria-sort", "ascending");
    expect(names()[0]).toBe("나멤버");
  });

  it("참석률과 근거(출석/확정 매치), 응답률을 칸마다 보여 준다", () => {
    render(<MemberStatsTable stats={list} />);
    expect(rowOf("나멤버")).toHaveTextContent("100%");
    expect(rowOf("나멤버")).toHaveTextContent("5/5");
    expect(rowOf("나멤버")).toHaveTextContent("50%");
  });

  it("비율에 색 단계를 붙인다(90 · 75 · 60%)", () => {
    render(<MemberStatsTable stats={list} />);
    expect(within(rowOf("나멤버")).getByText("100%")).toHaveClass("text-fit-best");
    expect(within(rowOf("가멤버")).getByText("60%")).toHaveClass("text-fit-fair");
  });

  it("값을 낼 수 없으면 – 로 보인다", () => {
    render(<MemberStatsTable stats={list} />);
    expect(within(rowOf("다신입")).getAllByText("–").length).toBeGreaterThan(0);
  });

  it("득점 · 도움 칸이 있고 득점 많은 순으로 바꿀 수 있다", async () => {
    const user = userEvent.setup();
    render(<MemberStatsTable stats={[stats("가", { goals: 1 }), stats("나", { goals: 4, assists: 2 })]} />);
    await user.click(within(header("골")).getByRole("button"));
    expect(names()[0]).toBe("나");
  });

  it("이름 칸은 옆으로 밀어도 왼쪽에 붙어 있다(모바일)", () => {
    render(<MemberStatsTable stats={list} />);
    expect(screen.getByRole("rowheader", { name: "가멤버" })).toHaveClass("sticky");
  });
});
