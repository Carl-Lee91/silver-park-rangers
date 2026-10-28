import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { quarterSchedule } from "@/entities/match";
import LiveBoard, { type LiveQuarterPlan } from "./LiveBoard";

const schedule = quarterSchedule({ startsAt: "10:00", endsAt: "13:00", quarterCount: 6 });
const plans: LiveQuarterPlan[] = schedule.map((_, index) => ({
  number: index + 1,
  formationName: "4-3-3",
  comingIn: index === 2 ? [{ name: "홍길동", jerseyNumber: 7, position: "CB" }] : [],
  goingOut: index === 2 ? [{ name: "김철수", jerseyNumber: null, position: "CB" }] : [],
  moved: index === 2 ? [{ name: "박영희", jerseyNumber: 10, from: "MF", to: "FW" }] : [],
}));

describe("현장 모드 쿼터 시계 · 교체 안내 (PLAN.md §10)", () => {
  it("지금 쿼터와 남은 시간, 다음 쿼터의 교체를 보여 준다", () => {
    render(<LiveBoard schedule={schedule} plans={plans} today now={() => new Date("2026-10-28T01:42:00Z")} />);

    expect(screen.getByText("2쿼터 경기 중")).toBeInTheDocument();
    expect(screen.getByText("18분 남음 · 10:30~11:00")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "3쿼터 교체 · 11:00" })).toBeInTheDocument();
    expect(screen.getByText(/들어감/).parentElement).toHaveTextContent("7 홍길동 (센터백)");
    expect(screen.getByText(/나옴/).parentElement).toHaveTextContent("김철수 (센터백)");
    expect(screen.getByText(/자리 바꿈/).parentElement).toHaveTextContent("10 박영희 중앙 미드필더 → 공격수");
  });

  it("다른 쿼터를 골라 볼 수 있다", async () => {
    const user = userEvent.setup();
    render(<LiveBoard schedule={schedule} plans={plans} today now={() => new Date("2026-10-28T01:42:00Z")} />);

    await user.click(screen.getByRole("tab", { name: "5쿼터" }));
    expect(screen.getByRole("heading", { name: "5쿼터 교체 · 12:00" })).toBeInTheDocument();
    expect(screen.getByText("바뀌는 사람이 없어요.")).toBeInTheDocument();
  });

  it("매치 날이 아니면 시계 대신 짠 순서만 보여 준다", () => {
    render(<LiveBoard schedule={schedule} plans={plans} today={false} now={() => new Date("2026-10-28T01:42:00Z")} />);
    expect(screen.getByText("오늘 매치가 아니에요. 쿼터를 골라 교체를 미리 볼 수 있어요.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1쿼터 교체 · 10:00" })).toBeInTheDocument();
  });
});
