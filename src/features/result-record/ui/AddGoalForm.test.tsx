import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/shared/ui";
import AddGoalForm from "./AddGoalForm";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const props = {
  matchId: "m1",
  quarter: 2,
  played: [{ id: "a", realName: "가공격" }],
  others: [{ id: "b", realName: "나교체" }],
};

describe("골 추가", () => {
  it("그 쿼터에 뛴 사람을 먼저 보여 준다", () => {
    render(<AddGoalForm action={async () => ({})} {...props} />);
    const options = screen.getAllByRole("option", { name: /가공격|나교체|모름/ }).map((option) => option.textContent);
    expect(options.slice(0, 3)).toEqual(["득점자 모름 · 상대 자책골", "가공격", "나교체"]);
  });

  it("득점자·도움·쿼터를 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<AddGoalForm action={action} {...props} />);
    await user.selectOptions(screen.getByLabelText("2쿼터 득점"), "a");
    await user.selectOptions(screen.getByLabelText("2쿼터 도움"), "b");
    await user.click(screen.getByRole("button", { name: "골 추가" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("quarter")).toBe("2");
    expect(formData.get("scorerId")).toBe("a");
    expect(formData.get("assistId")).toBe("b");
  });
});
