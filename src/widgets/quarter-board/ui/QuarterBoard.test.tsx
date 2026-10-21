import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { quarterSchedule } from "@/entities/match";
import type { SavedQuarter } from "@/entities/squad";
import QuarterBoard from "./QuarterBoard";

const schedule = quarterSchedule({ startsAt: "10:00", endsAt: "11:00", quarterCount: 2 });
const quarters: SavedQuarter[] = [
  {
    number: 1,
    formationName: "4-3-3",
    slots: [
      { slotIndex: 0, position: "GK", x: 50, y: 92, memberId: "k", memberName: "김키퍼", jerseyNumber: 1 },
      { slotIndex: 1, position: "FW", x: 50, y: 18, memberId: "a", memberName: "나공격", jerseyNumber: null },
    ],
  },
  {
    number: 2,
    formationName: "4-4-2",
    slots: [
      { slotIndex: 0, position: "GK", x: 50, y: 92, memberId: "k", memberName: "김키퍼", jerseyNumber: 1 },
      { slotIndex: 1, position: "FW", x: 50, y: 18, memberId: null, memberName: null, jerseyNumber: null },
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
    expect(within(keeperRow).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["1 김키퍼", "GK", "GK", "0"]);
  });

  it("필드 선수 동그라미는 우리 유니폼 색, 키퍼는 키퍼 색이다", () => {
    render(<QuarterBoard quarters={quarters} schedule={schedule} />);
    const pitch = screen.getByRole("group", { name: "1쿼터 경기장" });
    expect(within(pitch).getByText("FW")).toHaveClass("bg-kit");
    expect(within(pitch).getByText("1")).toHaveClass("bg-kakao");
  });

  it("동그라미에 등번호를 넣고, 번호가 없으면 포지션을 넣는다", () => {
    render(<QuarterBoard quarters={quarters} schedule={schedule} />);
    const pitch = screen.getByRole("group", { name: "1쿼터 경기장" });
    expect(within(pitch).getByText("1")).toBeInTheDocument();
    expect(within(pitch).queryByText("GK")).not.toBeInTheDocument();
    expect(within(pitch).getByText("FW")).toBeInTheDocument();
  });

  it("출전표 이름 앞에 등번호를 붙인다", async () => {
    const user = userEvent.setup();
    render(<QuarterBoard quarters={quarters} schedule={schedule} />);
    await user.click(screen.getByRole("tab", { name: "출전표" }));
    expect(screen.getByRole("row", { name: /김키퍼/ })).toHaveTextContent("1 김키퍼");
  });

  it("넓은 화면(태블릿 이상)에서는 탭 없이 모든 쿼터와 출전표를 한눈에 보여 준다", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(<QuarterBoard quarters={quarters} schedule={schedule} />);

    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("group", { name: "1쿼터 경기장" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "2쿼터 경기장" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /김키퍼/ })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

