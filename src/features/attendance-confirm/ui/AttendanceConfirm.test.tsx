import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../api/actions", () => ({ confirmFromSquad: vi.fn(), setAttended: vi.fn(), addAttendee: vi.fn() }));

const { default: AttendanceConfirm } = await import("./AttendanceConfirm");

const rows = [{ memberId: "a", realName: "가", response: "yes" as const, attended: null, inSquad: true }];

describe("실제 출석 확정", () => {
  it("스쿼드가 있으면 '스쿼드대로 확정' 단추를 둔다", () => {
    render(<AttendanceConfirm matchId="m1" rows={rows} members={[]} hasSquad />);
    expect(screen.getByRole("button", { name: "스쿼드대로 확정" })).toBeInTheDocument();
  });

  it("풋살은 '팀 명단대로 확정'이다", () => {
    render(<AttendanceConfirm matchId="m1" rows={rows} members={[]} hasSquad squadLabel="팀 명단" />);
    expect(screen.getByRole("button", { name: "팀 명단대로 확정" })).toBeInTheDocument();
  });
});
