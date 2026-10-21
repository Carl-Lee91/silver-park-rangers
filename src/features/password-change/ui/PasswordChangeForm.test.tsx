import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PasswordChangeState } from "../model/passwordChange";
import PasswordChangeForm from "./PasswordChangeForm";

type Action = (state: PasswordChangeState, formData: FormData) => Promise<PasswordChangeState>;

describe("비밀번호 바꾸기 폼", () => {
  it("두 칸을 다 채워야 바꿀 수 있고, 둘 다 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<PasswordChangeForm action={action} />);
    const submit = screen.getByRole("button", { name: "비밀번호 바꾸기" });

    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText("새 비밀번호"), "newpass12");
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText("새 비밀번호 확인"), "newpass12");
    await user.click(submit);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("password")).toBe("newpass12");
    expect(formData.get("passwordConfirm")).toBe("newpass12");
  });

  it("바꾸면 알려 주고 칸을 비운다", async () => {
    const user = userEvent.setup();
    render(<PasswordChangeForm action={async () => ({ saved: true })} />);

    await user.type(screen.getByLabelText("새 비밀번호"), "newpass12");
    await user.type(screen.getByLabelText("새 비밀번호 확인"), "newpass12");
    await user.click(screen.getByRole("button", { name: "비밀번호 바꾸기" }));

    expect(await screen.findByText("비밀번호를 바꿨어요.")).toBeInTheDocument();
    expect(screen.getByLabelText("새 비밀번호")).toHaveValue("");
  });

  it("서버가 돌려준 오류를 해당 칸 아래에 보여 준다", async () => {
    const user = userEvent.setup();
    render(<PasswordChangeForm action={async () => ({ errors: { passwordConfirm: "비밀번호가 서로 달라요." } })} />);

    await user.type(screen.getByLabelText("새 비밀번호"), "newpass12");
    await user.type(screen.getByLabelText("새 비밀번호 확인"), "newpass13");
    await user.click(screen.getByRole("button", { name: "비밀번호 바꾸기" }));

    expect(await screen.findByText("비밀번호가 서로 달라요.")).toBeInTheDocument();
  });
});
