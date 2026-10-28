import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/shared/ui";
import EntryForm from "./EntryForm";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

describe("장부 적기 폼", () => {
  it("오늘 날짜로 시작하고, 항목 · 금액을 넣어야 적을 수 있다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<EntryForm action={action} today="2026-10-28" />);
    const submit = screen.getByRole("button", { name: "장부에 적기" });

    expect(screen.getByLabelText("날짜")).toHaveValue("2026-10-28");
    expect(submit).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("항목"), "field");
    await user.type(screen.getByLabelText("금액(원)"), "120000");
    await user.type(screen.getByLabelText(/^메모/), "10월 구장");
    await user.click(submit);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect([formData.get("date"), formData.get("category"), formData.get("amount"), formData.get("memo")]).toEqual([
      "2026-10-28",
      "field",
      "120000",
      "10월 구장",
    ]);
  });

  it("적고 나면 금액 · 메모를 비운다", async () => {
    const user = userEvent.setup();
    render(<EntryForm action={async () => ({})} today="2026-10-28" />);

    await user.selectOptions(screen.getByLabelText("항목"), "gear");
    await user.type(screen.getByLabelText("금액(원)"), "30000");
    await user.click(screen.getByRole("button", { name: "장부에 적기" }));

    await waitFor(() => expect(screen.getByLabelText("금액(원)")).toHaveValue(""));
    expect(await screen.findByText("적었어요.")).toBeInTheDocument();
  });
});
