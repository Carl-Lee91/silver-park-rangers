import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/shared/ui";
import MvpVoteForm from "./MvpVoteForm";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;
const candidates = [
  { id: "a", realName: "홍길동", jerseyNumber: 7 },
  { id: "b", realName: "김철수", jerseyNumber: null },
];

describe("MVP 투표 (PLAN.md §10)", () => {
  it("한 사람을 골라 투표한다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<MvpVoteForm action={action} matchId="m1" candidates={candidates} current={null} />);
    const submit = screen.getByRole("button", { name: "투표" });

    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "김철수" }));
    await user.click(submit);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect([action.mock.calls[0][1].get("matchId"), action.mock.calls[0][1].get("candidateId")]).toEqual(["m1", "b"]);
  });

  it("이미 투표했으면 고른 사람이 표시되고, 마감 전까지 바꾼다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<MvpVoteForm action={action} matchId="m1" candidates={candidates} current="a" />);

    expect(screen.getByRole("radio", { name: "7 홍길동" })).toBeChecked();
    expect(screen.getByRole("button", { name: "바꾸기" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "김철수" }));
    await user.click(screen.getByRole("button", { name: "바꾸기" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });
});
