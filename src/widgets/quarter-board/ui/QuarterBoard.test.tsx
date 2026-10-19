import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { quarterSchedule } from "@/entities/match";
import type { SavedQuarter } from "@/entities/squad";
import QuarterBoard from "./QuarterBoard";

const schedule = quarterSchedule({ startsAt: "10:00", endsAt: "11:00", quarterCount: 2 });
const quarters: SavedQuarter[] = [
  {
    number: 1,
    formationName: "4-3-3",
    slots: [
      { slotIndex: 0, position: "GK", x: 50, y: 92, memberId: "k", memberName: "김키퍼" },
      { slotIndex: 1, position: "FW", x: 50, y: 18, memberId: "a", memberName: "나공격" },
    ],
  },
  {
    number: 2,
    formationName: "4-4-2",
    slots: [
      { slotIndex: 0, position: "GK", x: 50, y: 92, memberId: "k", memberName: "김키퍼" },
      { slotIndex: 1, position: "FW", x: 50, y: 18, memberId: null, memberName: null },
    ],
  },
];

describe("쿼터 보드", () => {
  it("처음에는 1쿼터 포메이션을 보여 준다", () => {
    render(<QuarterBoard quarters={quarters} schedule={schedule} />);
    const pitch = screen.getByRole("group", { name: "1쿼터 경기장" });
    expect(within(pitch).getByText("나공격")).toBeInTheDocument();
    expect(screen.getByText("4-3-3")).toBeInTheDocument();
  });

  it("쿼터 탭을 누르면 그 쿼터를 보여 준다", async () => {
    const user = userEvent.setup();
    render(<QuarterBoard quarters={quarters} schedule={schedule} />);
    await user.click(screen.getByRole("tab", { name: /2쿼터/ }));
    const pitch = screen.getByRole("group", { name: "2쿼터 경기장" });
    expect(within(pitch).queryByText("나공격")).not.toBeInTheDocument();
    expect(screen.getByText("4-4-2")).toBeInTheDocument();
  });

  it("출전표 탭은 사람마다 뛰는 쿼터를 표로 보여 준다", async () => {
    const user = userEvent.setup();
    render(<QuarterBoard quarters={quarters} schedule={schedule} />);
    await user.click(screen.getByRole("tab", { name: "출전표" }));
    const row = screen.getByRole("row", { name: /나공격/ });
    expect(within(row).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["나공격", "●", "", "1"]);
    const keeperRow = screen.getByRole("row", { name: /김키퍼/ });
    expect(within(keeperRow).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["김키퍼", "GK", "GK", "0"]);
  });
});
