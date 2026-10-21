import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GuestState } from "../model/guestSchema";
import GuestForm from "./GuestForm";

type Action = (state: GuestState, formData: FormData) => Promise<GuestState>;
const noop: Action = async () => ({});

describe("그날 용병 넣기 폼", () => {
  it("이름·주발·포지션을 채워야 넣을 수 있다 — 등번호는 선택", async () => {
    const user = userEvent.setup();
    render(<GuestForm action={noop} matchId="m1" submitLabel="용병 넣기" />);
    const submit = screen.getByRole("button", { name: "용병 넣기" });

    await user.type(screen.getByLabelText("이름"), "오늘용병");
    await user.click(screen.getByRole("button", { name: "오른발" }));
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /^골키퍼/ }));
    expect(submit).toBeEnabled();
  });

  it("매치와 입력한 값을 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(noop);
    render(<GuestForm action={action} matchId="m1" submitLabel="용병 넣기" />);

    await user.type(screen.getByLabelText("이름"), "오늘용병");
    await user.click(screen.getByRole("button", { name: "왼발" }));
    for (const label of [/^센터백/, /^미드필더/, /^윙백/]) await user.click(screen.getByRole("button", { name: label }));
    await user.selectOptions(screen.getByLabelText(/^등번호/), "7");
    await user.click(screen.getByRole("button", { name: "용병 넣기" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("matchId")).toBe("m1");
    expect(formData.get("memberId")).toBeNull();
    expect(formData.get("realName")).toBe("오늘용병");
    expect(formData.getAll("preferredPositions")).toEqual(["CB", "MF", "WB"]);
    expect(formData.get("jerseyNumber")).toBe("7");
  });

  it("넣고 나면 칸을 비워 다음 용병을 받는다", async () => {
    const user = userEvent.setup();
    render(<GuestForm action={async () => ({ saved: true })} matchId="m1" submitLabel="용병 넣기" />);

    await user.type(screen.getByLabelText("이름"), "오늘용병");
    await user.click(screen.getByRole("button", { name: "왼발" }));
    await user.click(screen.getByRole("button", { name: /^골키퍼/ }));
    await user.click(screen.getByRole("button", { name: "용병 넣기" }));

    await waitFor(() => expect(screen.getByLabelText("이름")).toHaveValue(""));
    expect(screen.getByRole("button", { name: /^골키퍼/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("고칠 때는 지금 값으로 시작하고 그 사람을 함께 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({ saved: true }));
    render(
      <GuestForm
        action={action}
        matchId="m1"
        submitLabel="저장"
        guest={{ id: "g1", realName: "오늘용병", feet: ["right"], preferredPositions: ["GK"], jerseyNumber: 9 }}
      />,
    );

    expect(screen.getByLabelText("이름")).toHaveValue("오늘용병");
    expect(screen.getByLabelText(/^등번호/)).toHaveValue("9");
    await user.clear(screen.getByLabelText("이름"));
    await user.type(screen.getByLabelText("이름"), "바뀐용병");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].get("memberId")).toBe("g1");
    expect(screen.getByLabelText("이름")).toHaveValue("바뀐용병");
  });

  it("서버가 돌려준 오류를 보여 준다", async () => {
    const user = userEvent.setup();
    render(<GuestForm action={async () => ({ message: "권한이 없어요." })} matchId="m1" submitLabel="용병 넣기" />);

    await user.type(screen.getByLabelText("이름"), "오늘용병");
    await user.click(screen.getByRole("button", { name: "왼발" }));
    await user.click(screen.getByRole("button", { name: /^골키퍼/ }));
    await user.click(screen.getByRole("button", { name: "용병 넣기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없어요.");
  });
});
