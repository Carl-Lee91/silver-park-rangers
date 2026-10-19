import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/shared/ui";
import NoteEditor from "./NoteEditor";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

describe("특이사항 쓰기", () => {
  it("이미 쓴 메모로 시작한다", () => {
    render(<NoteEditor action={async () => ({})} matchId="m1" memberId="a" name="이수비" note="무릎 안 좋음" />);
    expect(screen.getByLabelText("이수비 특이사항")).toHaveValue("무릎 안 좋음");
  });

  it("저장하면 매치·사람·메모를 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<NoteEditor action={action} matchId="m1" memberId="a" name="이수비" note={null} />);

    await user.type(screen.getByLabelText("이수비 특이사항"), "2쿼터부터 옴");
    await user.click(screen.getByRole("button", { name: "메모 저장" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("matchId")).toBe("m1");
    expect(formData.get("memberId")).toBe("a");
    expect(formData.get("note")).toBe("2쿼터부터 옴");
  });

  it("고친 게 없으면 저장할 수 없다", async () => {
    const user = userEvent.setup();
    render(<NoteEditor action={async () => ({})} matchId="m1" memberId="a" name="이수비" note="무릎" />);
    expect(screen.getByRole("button", { name: "메모 저장" })).toBeDisabled();
    await user.type(screen.getByLabelText("이수비 특이사항"), " 조심");
    expect(screen.getByRole("button", { name: "메모 저장" })).toBeEnabled();
  });

  it("실패하면 이유를 보여 준다", async () => {
    const user = userEvent.setup();
    render(
      <NoteEditor action={async () => ({ error: "권한이 없어요." })} matchId="m1" memberId="a" name="이수비" note={null} />,
    );
    await user.type(screen.getByLabelText("이수비 특이사항"), "메모");
    await user.click(screen.getByRole("button", { name: "메모 저장" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없어요.");
  });
});
