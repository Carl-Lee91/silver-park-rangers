import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/shared/ui";
import ProxyVoteForm from "./ProxyVoteForm";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;
const choices = [
  { id: "a", label: "7 홍길동" },
  { id: "b", label: "김철수 · 지금 미정" },
];

describe("대신 투표 (관리자, PLAN.md §4)", () => {
  it("사람과 응답을 골라야 보낼 수 있고, 보내면 그 사람의 투표로 남긴다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<ProxyVoteForm action={action} matchId="m1" choices={choices} />);
    const submit = screen.getByRole("button", { name: "대신 투표" });

    expect(submit).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("누구 대신"), "b");
    await user.click(screen.getByRole("button", { name: "참석" }));
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect([formData.get("matchId"), formData.get("memberId"), formData.get("response")]).toEqual(["m1", "b", "yes"]);
  });

  it("남기고 나면 알려 주고 다음 사람을 받는다", async () => {
    const user = userEvent.setup();
    render(<ProxyVoteForm action={async () => ({})} matchId="m1" choices={choices} />);

    await user.selectOptions(screen.getByLabelText("누구 대신"), "a");
    await user.click(screen.getByRole("button", { name: "불참" }));
    await user.click(screen.getByRole("button", { name: "대신 투표" }));

    expect(await screen.findByText("7 홍길동 → 불참으로 남겼어요.")).toBeInTheDocument();
    expect(screen.getByLabelText("누구 대신")).toHaveValue("");
  });
});
