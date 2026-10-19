import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { quarterSchedule } from "@/entities/match";
import type { ActionState } from "@/shared/ui";
import TimeWindowEditor from "./TimeWindowEditor";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;
const schedule = quarterSchedule({ startsAt: "10:00", endsAt: "13:00", quarterCount: 6 });

describe("당일 도착·떠나는 시간 고치기", () => {
  it("지금 시간으로 시작한다", () => {
    render(
      <TimeWindowEditor action={async () => ({})} matchId="m1" memberId="a" name="이수비" schedule={schedule} arriveAt={null} leaveAt="12:00" />,
    );
    expect(screen.getByLabelText("이수비 도착")).toHaveValue("");
    expect(screen.getByLabelText("이수비 떠나는 시간")).toHaveValue("12:00");
  });

  it("바꾼 시간을 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(
      <TimeWindowEditor action={action} matchId="m1" memberId="a" name="이수비" schedule={schedule} arriveAt={null} leaveAt={null} />,
    );
    expect(screen.getByRole("button", { name: "시간 저장" })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("이수비 떠나는 시간"), "11:30");
    await user.click(screen.getByRole("button", { name: "시간 저장" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("memberId")).toBe("a");
    expect(formData.get("leaveAt")).toBe("11:30");
    expect(formData.get("arriveAt")).toBe("");
  });
});
