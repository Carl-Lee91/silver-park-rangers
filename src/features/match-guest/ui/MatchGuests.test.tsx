import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MatchGuests from "./MatchGuests";

describe("그날 용병 목록", () => {
  it("없으면 안내하고, 넣기 폼을 보여 준다", () => {
    render(<MatchGuests matchId="m1" guests={[]} />);
    expect(screen.getByText("아직 그날 용병이 없어요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "용병 넣기" })).toBeInTheDocument();
  });

  it("번호·이름·포지션과 고치기·빼기를 보여 준다", () => {
    render(
      <MatchGuests
        matchId="m1"
        guests={[{ id: "g1", realName: "오늘용병", feet: ["right"], preferredPositions: ["CB", "MF", "WB"], jerseyNumber: 7 }]}
      />,
    );
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("7오늘용병");
    expect(item).toHaveTextContent("센터백 · 미드필더 · 윙백");
    expect(within(item).getByRole("button", { name: "빼기" })).toBeInTheDocument();
    expect(within(item).getByText("고치기")).toBeInTheDocument();
  });

  it("이름을 누르면 선수 상세(능력치)로 가고, 뒤로 가면 이 매치로 온다", () => {
    render(
      <MatchGuests
        matchId="m1"
        guests={[{ id: "g1", realName: "오늘용병", feet: ["right"], preferredPositions: ["CB", "MF", "WB"], jerseyNumber: 7 }]}
      />,
    );
    expect(screen.getByRole("link", { name: /오늘용병/ })).toHaveAttribute("href", "/admin/members/g1?from=%2Fadmin%2Fmatches%2Fm1");
  });
});
