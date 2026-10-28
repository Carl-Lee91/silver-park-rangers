import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/shared/ui";
import MemberLinkCard from "./MemberLinkCard";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

describe("개인 링크 카드 (선수 상세, PLAN.md §4)", () => {
  it("링크가 없으면 만들기 단추만 둔다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<MemberLinkCard action={action} memberId="m1" memberName="홍길동" url={null} />);

    expect(screen.getByText(/아직 개인 링크가 없어요/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "링크 만들기" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].get("memberId")).toBe("m1");
  });

  it("링크가 있으면 주소와 안내 문구 복사를 둔다", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<MemberLinkCard action={async () => ({})} memberId="m1" memberName="홍길동" url="https://spr.example/j/6f1c" />);

    expect(screen.getByDisplayValue("https://spr.example/j/6f1c")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "안내 문구와 같이 복사" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("홍길동님 전용 링크예요."));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("https://spr.example/j/6f1c"));
  });

  it("새 링크는 예전 링크가 안 열린다고 물은 뒤 만든다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<MemberLinkCard action={action} memberId="m1" memberName="홍길동" url="https://spr.example/j/6f1c" />);

    await user.click(screen.getByRole("button", { name: "새 링크 만들기" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("예전 링크는 더 열리지 않아요");
    await user.click(within(dialog).getByRole("button", { name: "새 링크 만들기" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });
});
