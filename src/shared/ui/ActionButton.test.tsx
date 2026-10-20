import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ActionButton, { type ActionState } from "./ActionButton";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

describe("한 번 누르면 서버 동작을 부르는 단추", () => {
  afterEach(() => vi.restoreAllMocks());

  it("숨은 값을 실어 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<ActionButton action={action} fields={{ memberId: "m1", kind: "guest" }} label="용병으로 승인" />);

    await user.click(screen.getByRole("button", { name: "용병으로 승인" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("memberId")).toBe("m1");
    expect(formData.get("kind")).toBe("guest");
  });

  it("서버가 돌려준 오류를 보여 준다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({ error: "권한이 없어요." }));
    render(<ActionButton action={action} fields={{}} label="거절" />);

    await user.click(screen.getByRole("button", { name: "거절" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없어요.");
  });

  it("확인을 묻는 단추는 취소하면 보내지 않는다", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const action = vi.fn<Action>(async () => ({}));
    render(<ActionButton action={action} fields={{}} label="거절" confirmMessage="거절할까요?" />);

    await user.click(screen.getByRole("button", { name: "거절" }));

    expect(window.confirm).toHaveBeenCalledWith("거절할까요?");
    expect(action).not.toHaveBeenCalled();
  });

  it("확인하면 보낸다", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const action = vi.fn<Action>(async () => ({}));
    render(<ActionButton action={action} fields={{}} label="거절" confirmMessage="거절할까요?" />);

    await user.click(screen.getByRole("button", { name: "거절" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });

  it("막아 두면 누를 수 없다", () => {
    render(<ActionButton action={async () => ({})} fields={{}} label="공개하기" disabled />);
    expect(screen.getByRole("button", { name: "공개하기" })).toBeDisabled();
  });
});
