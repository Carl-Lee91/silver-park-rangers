import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/shared/ui";
import LinkLoginForm from "./LinkLoginForm";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

describe("개인 링크로 들어가기 (PLAN.md §4)", () => {
  it("단추 하나로 링크 주인으로 들어간다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<LinkLoginForm action={action} token="6f1c" memberName="홍길동" ready switching={false} />);

    await user.click(screen.getByRole("button", { name: "홍길동님으로 들어가기" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].get("token")).toBe("6f1c");
  });

  it("다른 사람으로 들어와 있으면 바뀐다고 알려 준다", () => {
    render(<LinkLoginForm action={async () => ({})} token="6f1c" memberName="홍길동" ready switching />);
    expect(screen.getByText(/지금은 다른 사람으로 들어와 있어요/)).toBeInTheDocument();
  });

  it("서버 키가 없으면 무엇이 빠졌는지 보여 주고 단추를 막는다", () => {
    render(<LinkLoginForm action={async () => ({})} token="6f1c" memberName="홍길동" ready={false} switching={false} />);
    expect(screen.getByRole("button", { name: "홍길동님으로 들어가기" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("실패하면 이유를 보여 준다", async () => {
    const user = userEvent.setup();
    render(
      <LinkLoginForm action={async () => ({ error: "링크가 맞지 않아요." })} token="6f1c" memberName="홍길동" ready switching={false} />,
    );

    await user.click(screen.getByRole("button", { name: "홍길동님으로 들어가기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("링크가 맞지 않아요.");
  });
});
