import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { quarterSchedule } from "@/entities/match";
import type { VoteState } from "../model/attendanceVote";
import AttendanceVoteForm from "./AttendanceVoteForm";

type Action = (state: VoteState, formData: FormData) => Promise<VoteState>;
const noop: Action = async () => ({});
const schedule = quarterSchedule({ startsAt: "10:00", endsAt: "13:00", quarterCount: 6 });

const renderForm = (props: Partial<Parameters<typeof AttendanceVoteForm>[0]> = {}) =>
  render(<AttendanceVoteForm action={noop} matchId="m1" schedule={schedule} current={null} open {...props} />);

describe("참석 투표 폼", () => {
  it("참석을 고르면 도착·떠나는 시간을 고를 수 있고, 불참이면 안 보인다", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "참석" }));
    expect(screen.getByLabelText("도착")).toBeInTheDocument();
    expect(screen.getByLabelText("떠나는 시간")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "불참" }));
    expect(screen.queryByLabelText("도착")).not.toBeInTheDocument();
  });

  it("떠나는 시간을 고르면 뛸 수 있는 쿼터 수가 바뀐다", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "참석" }));
    expect(screen.getByText("6쿼터 모두 뛸 수 있어요.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("떠나는 시간"), "12:00");
    expect(screen.getByText("10:00~12:00 · 4쿼터 뛸 수 있어요.")).toBeInTheDocument();
  });

  it("고른 값을 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(noop);
    renderForm({ action });

    await user.click(screen.getByRole("button", { name: "참석" }));
    await user.selectOptions(screen.getByLabelText("떠나는 시간"), "12:00");
    await user.click(screen.getByRole("button", { name: "투표하기" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("matchId")).toBe("m1");
    expect(formData.get("response")).toBe("yes");
    expect(formData.get("arriveAt")).toBe("");
    expect(formData.get("leaveAt")).toBe("12:00");
  });

  it("이미 투표했으면 그 값으로 시작하고, 단추는 투표 바꾸기다", () => {
    renderForm({ current: { response: "maybe", arriveAt: "11:00", leaveAt: null } });
    expect(screen.getByRole("button", { name: "미정" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("도착")).toHaveValue("11:00");
    expect(screen.getByRole("button", { name: "투표 바꾸기" })).toBeInTheDocument();
  });

  it("마감됐으면 고를 수 없다", () => {
    renderForm({ open: false, current: { response: "yes", arriveAt: null, leaveAt: null } });
    expect(screen.getByText("투표가 마감됐어요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참석" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /투표/ })).not.toBeInTheDocument();
  });

  it("서버가 돌려준 오류를 보여 준다", async () => {
    const user = userEvent.setup();
    renderForm({ action: async () => ({ error: "투표가 마감됐어요." }) });
    await user.click(screen.getByRole("button", { name: "불참" }));
    await user.click(screen.getByRole("button", { name: "투표하기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("투표가 마감됐어요.");
  });
});
