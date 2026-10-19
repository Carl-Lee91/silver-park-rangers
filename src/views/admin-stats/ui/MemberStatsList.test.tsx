import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { MemberStats } from "@/entities/stats";
import MemberStatsList from "./MemberStatsList";

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

const names = () => screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
/** 사람 한 명의 행(포지션 칩 목록 말고) */
const rowOf = (index: number) => screen.getAllByRole("heading", { level: 3 })[index].closest("li")!;

describe("멤버 통계 목록", () => {
  it("기본은 참석률 높은 순이고, 낼 수 없는 사람은 맨 뒤다", () => {
    render(<MemberStatsList stats={list} />);
    expect(names()).toEqual(["나멤버", "가멤버", "다신입"]);
  });

  it("노쇼 많은 순으로 바꿀 수 있다", async () => {
    const user = userEvent.setup();
    render(<MemberStatsList stats={list} />);
    await user.selectOptions(screen.getByLabelText("정렬"), "noShows");
    expect(names()[0]).toBe("가멤버");
  });

  it("참석률과 근거(출석/확정 매치)를 함께 보여 준다", () => {
    render(<MemberStatsList stats={list} />);
    const item = rowOf(0);
    expect(item).toHaveTextContent("100%");
    expect(item).toHaveTextContent("5/5");
    expect(item).toHaveTextContent("응답 50%");
  });

  it("값을 낼 수 없으면 – 로 보인다", () => {
    render(<MemberStatsList stats={list} />);
    expect(rowOf(2)).toHaveTextContent("참석률 –");
  });

  it("득점·도움을 보여 주고 득점 많은 순으로 바꿀 수 있다", async () => {
    const user = userEvent.setup();
    render(<MemberStatsList stats={[stats("가", { goals: 1 }), stats("나", { goals: 4, assists: 2 })]} />);
    await user.selectOptions(screen.getByLabelText("정렬"), "goals");
    expect(names()[0]).toBe("나");
    expect(rowOf(0)).toHaveTextContent("골 4 · 도움 2");
  });
});
