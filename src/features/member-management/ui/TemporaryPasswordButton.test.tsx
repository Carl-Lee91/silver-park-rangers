import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TemporaryPasswordState } from "../api/actions";
import TemporaryPasswordButton from "./TemporaryPasswordButton";

type Action = (state: TemporaryPasswordState, formData: FormData) => Promise<TemporaryPasswordState>;

describe("임시 비밀번호 만들기 (PLAN.md §4)", () => {
  it("물어본 뒤 그 사람의 임시 비밀번호를 만들고, 한 번 보여 준다", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const action = vi.fn<Action>(async () => ({ password: "a1b2c3d4e5" }));
    render(<TemporaryPasswordButton action={action} memberId="m1" memberName="김운영" />);

    await user.click(screen.getByRole("button", { name: "임시 비밀번호 만들기" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].get("memberId")).toBe("m1");
    expect(await screen.findByText("a1b2c3d4e5")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("김운영님에게 알려 주세요");
  });

  it("묻는 창에서 취소하면 만들지 않는다", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const action = vi.fn<Action>(async () => ({ password: "x" }));
    render(<TemporaryPasswordButton action={action} memberId="m1" memberName="김운영" />);

    await user.click(screen.getByRole("button", { name: "임시 비밀번호 만들기" }));

    expect(action).not.toHaveBeenCalled();
  });

  it("실패하면 이유를 보여 준다", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TemporaryPasswordButton action={async () => ({ error: "권한이 없어요." })} memberId="m1" memberName="김운영" />);

    await user.click(screen.getByRole("button", { name: "임시 비밀번호 만들기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없어요.");
  });
});
