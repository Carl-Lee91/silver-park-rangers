import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RegisterState } from "../model/registerSchema";
import MemberProfileForm from "./MemberProfileForm";

type Action = (state: RegisterState, formData: FormData) => Promise<RegisterState>;
const noop: Action = async () => ({});

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("이름"), "홍길동");
  await user.click(screen.getByRole("button", { name: "오른발" }));
  for (const label of [/^센터백/, /^풀백/, /^수비형 미드필더/]) await user.click(screen.getByRole("button", { name: label }));
};

describe("선수 등록 폼 (PLAN.md §4 관리자 등록)", () => {
  it("멤버인지 용병인지까지 골라야 등록할 수 있다", async () => {
    const user = userEvent.setup();
    render(<MemberProfileForm action={noop} takenNumbers={[]} />);
    const submit = screen.getByRole("button", { name: "등록하기" });

    await fill(user);
    expect(submit).toBeDisabled();
    expect(screen.getByText(/멤버 \/ 용병/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "용병" }));
    expect(submit).toBeEnabled();
  });

  it("입력한 값을 보내고, 등록하면 칸을 비우고 개인 링크를 보내러 가는 길을 둔다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({ saved: true, memberId: "m9" }));
    render(<MemberProfileForm action={action} takenNumbers={[10]} />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "멤버" }));
    expect(screen.getByRole("option", { name: "10 (사용 중)" })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText(/^등번호/), "4");
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("realName")).toBe("홍길동");
    expect(formData.get("kind")).toBe("member");
    expect(formData.getAll("preferredPositions")).toEqual(["CB", "FB", "DM"]);
    expect(formData.get("jerseyNumber")).toBe("4");

    expect(await screen.findByRole("link", { name: /홍길동님에게 개인 링크 보내기/ })).toHaveAttribute(
      "href",
      "/admin/members/m9?from=%2Fadmin%2Fmembers",
    );
    expect(screen.getByLabelText("이름")).toHaveValue("");
  });

  it("고칠 때는 지금 값으로 채우고, 구분은 묻지 않는다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({ saved: true }));
    render(
      <MemberProfileForm
        action={action}
        takenNumbers={[]}
        member={{ id: "m1", realName: "김철수", feet: ["left"], preferredPositions: ["GK"], jerseyNumber: 1 }}
      />,
    );

    expect(screen.getByLabelText("이름")).toHaveValue("김철수");
    expect(screen.queryByRole("button", { name: "용병" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].get("memberId")).toBe("m1");
    expect(action.mock.calls[0][1].get("jerseyNumber")).toBe("1");
  });

  it("실패하면 이유를 보여 준다", async () => {
    const user = userEvent.setup();
    render(<MemberProfileForm action={async () => ({ message: "이미 누가 쓰는 등번호예요." })} takenNumbers={[]} />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "멤버" }));
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("이미 누가 쓰는 등번호예요.");
  });
});
