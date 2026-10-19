import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PasswordLoginState } from "../lib/passwordLogin";
import PasswordLoginForm from "./PasswordLoginForm";

type Action = (state: PasswordLoginState, formData: FormData) => Promise<PasswordLoginState>;

describe("어드민 계정 로그인 폼", () => {
  it("이메일과 비밀번호를 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<PasswordLoginForm action={action} />);

    await user.type(screen.getByLabelText("이메일"), "admin@team.kr");
    await user.type(screen.getByLabelText("비밀번호"), "secret");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("email")).toBe("admin@team.kr");
    expect(formData.get("password")).toBe("secret");
  });

  it("실패 안내를 보여 준다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({ error: "이메일 또는 비밀번호가 맞지 않아요." }));
    render(<PasswordLoginForm action={action} />);

    await user.type(screen.getByLabelText("이메일"), "admin@team.kr");
    await user.type(screen.getByLabelText("비밀번호"), "wrong");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("이메일 또는 비밀번호가 맞지 않아요.");
  });
});
