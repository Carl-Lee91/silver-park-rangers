import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useConfirm, type ConfirmOptions } from "./useConfirm";

function Harness({ options, onAnswer }: { options: ConfirmOptions; onAnswer: (ok: boolean) => void }) {
  const { confirm, dialog } = useConfirm();
  return (
    <>
      <button type="button" onClick={async () => onAnswer(await confirm(options))}>
        묻기
      </button>
      {dialog}
    </>
  );
}

const ask = async (options: ConfirmOptions = { message: "거절할까요?", confirmLabel: "거절", tone: "danger" }) => {
  const user = userEvent.setup();
  const onAnswer = vi.fn();
  render(<Harness options={options} onAnswer={onAnswer} />);
  await user.click(screen.getByRole("button", { name: "묻기" }));
  return { user, onAnswer };
};

describe("확인 창 (브라우저 기본 confirm 대신)", () => {
  it("물을 말과 두 단추를 띄운다 — 확인 단추에는 할 일을 쓴다", async () => {
    await ask();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAccessibleDescription("거절할까요?");
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "거절" })).toHaveClass("bg-danger");
  });

  it("확인하면 true, 창은 닫힌다", async () => {
    const { user, onAnswer } = await ask();
    await user.click(screen.getByRole("button", { name: "거절" }));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(true));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("취소·Esc·바깥을 누르면 false", async () => {
    const first = await ask();
    await first.user.click(screen.getByRole("button", { name: "취소" }));
    await waitFor(() => expect(first.onAnswer).toHaveBeenCalledWith(false));

    await first.user.click(screen.getAllByRole("button", { name: "묻기" })[0]);
    await first.user.keyboard("{Escape}");
    await waitFor(() => expect(first.onAnswer).toHaveBeenCalledTimes(2));
    expect(first.onAnswer).toHaveBeenLastCalledWith(false);

    await first.user.click(screen.getAllByRole("button", { name: "묻기" })[0]);
    await first.user.click(screen.getByTestId("confirm-backdrop"));
    await waitFor(() => expect(first.onAnswer).toHaveBeenCalledTimes(3));
    expect(first.onAnswer).toHaveBeenLastCalledWith(false);
  });

  it("확인 단추 이름을 안 주면 '확인'이고, 위험하지 않으면 강조색이다", async () => {
    await ask({ message: "새로 짤까요?" });
    expect(screen.getByRole("button", { name: "확인" })).toHaveClass("bg-primary");
  });
});
