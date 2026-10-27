import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { RatingValues } from "@/entities/rating";
import PlayerTip, { type PlayerProfile } from "./PlayerTip";

const profile: PlayerProfile = {
  id: "a",
  realName: "김철수",
  jerseyNumber: 7,
  preferredPositions: ["CB", "MF", "WB"],
  feet: ["right"],
};
const values: RatingValues = { pace: 8, shooting: 3, passing: 6, dribbling: 5, defending: 9, physical: 7, goalkeeping: null };

describe("선수 정보 ! 단추", () => {
  it("누르는 영역은 44px 이고 누가 누구인지 읽힌다", () => {
    render(<PlayerTip profile={profile} ratings={null} showRatings={false} />);
    const button = screen.getByRole("button", { name: "김철수 선수 정보" });
    expect(button).toHaveClass("size-11");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("누르면 선호 포지션(순서대로)과 주발이 뜬다", async () => {
    const user = userEvent.setup();
    render(<PlayerTip profile={profile} ratings={null} showRatings={false} />);
    await user.click(screen.getByRole("button", { name: "김철수 선수 정보" }));
    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("7김철수");
    expect(tip).toHaveTextContent("1 센터백 · 2 중앙 미드필더 · 3 윙백");
    expect(tip).toHaveTextContent("오른발");
  });

  it("팀원이 볼 때는 능력치가 없다", async () => {
    const user = userEvent.setup();
    render(<PlayerTip profile={profile} ratings={values} showRatings={false} />);
    await user.click(screen.getByRole("button", { name: "김철수 선수 정보" }));
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(screen.getByRole("tooltip")).not.toHaveTextContent("능력치");
  });

  it("관리자가 볼 때는 능력치를 막대와 숫자로, 필드 평균과 함께 보여 준다", async () => {
    const user = userEvent.setup();
    render(<PlayerTip profile={profile} ratings={values} showRatings />);
    await user.click(screen.getByRole("button", { name: "김철수 선수 정보" }));
    expect(screen.getByRole("meter", { name: "속도" })).toHaveAttribute("aria-valuenow", "8");
    expect(screen.getByRole("tooltip")).toHaveTextContent("평균 6.3");
  });

  it("관리자인데 아직 안 매긴 선수는 그렇다고 알려 준다", async () => {
    const user = userEvent.setup();
    render(<PlayerTip profile={profile} ratings={null} showRatings />);
    await user.click(screen.getByRole("button", { name: "김철수 선수 정보" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("능력치를 아직 매기지 않았어요");
  });

  it("다시 누르거나 Esc 를 누르면 닫힌다", async () => {
    const user = userEvent.setup();
    render(<PlayerTip profile={profile} ratings={null} showRatings={false} />);
    const button = screen.getByRole("button", { name: "김철수 선수 정보" });
    await user.click(button);
    await user.click(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await user.click(button);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("바깥을 누르면 닫힌다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <PlayerTip profile={profile} ratings={null} showRatings={false} />
        <p>바깥</p>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "김철수 선수 정보" }));
    await user.click(screen.getByText("바깥"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("데스크톱은 마우스를 올리면 뜨고 내리면 닫힌다", async () => {
    const user = userEvent.setup();
    render(<PlayerTip profile={profile} ratings={null} showRatings={false} />);
    const button = screen.getByRole("button", { name: "김철수 선수 정보" });
    await user.hover(button);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.unhover(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
