import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TeamRoster from "./TeamRoster";

const teams = [
  [
    { id: "a", name: "가", jerseyNumber: 3 },
    { id: "b", name: "나", jerseyNumber: null },
    { id: "c", name: "다", jerseyNumber: 9 },
  ],
  [
    { id: null, name: "라", jerseyNumber: 1 },
    { id: null, name: "마", jerseyNumber: 2 },
  ],
];

describe("풋살 팀 명단 보기(팀원 · 공유 링크)", () => {
  it("팀마다 패널에 등번호 · 이름을 늘어놓는다", () => {
    render(<TeamRoster teams={teams} perSide={2} />);
    const a = screen.getByRole("region", { name: "A팀" });
    expect(within(a).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["3가", "나", "9다"]);
    expect(screen.getByRole("region", { name: "B팀" })).toBeInTheDocument();
  });

  it("경기 인원보다 많으면 교체 인원을 적는다", () => {
    render(<TeamRoster teams={teams} perSide={2} />);
    expect(screen.getByRole("region", { name: "A팀" })).toHaveTextContent("3명 · 교체 1");
    expect(screen.getByRole("region", { name: "B팀" })).toHaveTextContent("2명");
  });

  it("팀원 화면은 이름 앞에 ! 단추를 둔다(공유 링크는 선수 id 가 없어서 없다)", () => {
    render(<TeamRoster teams={teams} perSide={2} tips={{ a: <button type="button">가 정보</button> }} />);
    const a = screen.getByRole("region", { name: "A팀" });
    expect(within(a).getAllByRole("listitem")[0]).toHaveTextContent("가 정보3가");
    expect(within(screen.getByRole("region", { name: "B팀" })).queryByRole("button")).not.toBeInTheDocument();
  });
});
