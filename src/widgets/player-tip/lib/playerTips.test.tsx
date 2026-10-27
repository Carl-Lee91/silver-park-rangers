import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { RatingValues } from "@/entities/rating";
import type { PlayerProfile } from "../ui/PlayerTip";
import { playerTips } from "./playerTips";

const people: PlayerProfile[] = [
  { id: "a", realName: "김철수", jerseyNumber: 7, preferredPositions: ["CB", "MF", "WB"], feet: ["right"] },
  { id: "b", realName: "이영희", jerseyNumber: null, preferredPositions: ["GK"], feet: ["left", "right"] },
];
const values: RatingValues = { pace: 8, shooting: 3, passing: 6, dribbling: 5, defending: 9, physical: 7, goalkeeping: null };

describe("선수 정보 단추 묶음(선수 id → ! 단추)", () => {
  it("사람마다 ! 단추를 만든다", () => {
    const tips = playerTips(people, null);
    expect(Object.keys(tips)).toEqual(["a", "b"]);
    render(<>{tips.b}</>);
    expect(screen.getByRole("button", { name: "이영희 선수 정보" })).toBeInTheDocument();
  });

  it("능력치를 넘기면(관리자) 능력치를 보여 주고, 안 넘기면(팀원) 보여 주지 않는다", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<>{playerTips(people, { a: values }).a}</>);
    await user.click(screen.getByRole("button", { name: "김철수 선수 정보" }));
    expect(screen.getByRole("meter", { name: "속도" })).toBeInTheDocument();
    unmount();

    render(<>{playerTips(people, null).a}</>);
    await user.click(screen.getByRole("button", { name: "김철수 선수 정보" }));
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  });

  it("관리자인데 안 매긴 사람은 '아직 안 매김'이다", async () => {
    const user = userEvent.setup();
    render(<>{playerTips(people, { a: values }).b}</>);
    await user.click(screen.getByRole("button", { name: "이영희 선수 정보" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("능력치를 아직 매기지 않았어요");
  });
});
