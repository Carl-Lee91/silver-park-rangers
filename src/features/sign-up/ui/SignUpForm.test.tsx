import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SignUpState } from "../model/signUpSchema";
import SignUpForm from "./SignUpForm";

type Action = (state: SignUpState, formData: FormData) => Promise<SignUpState>;
const noop: Action = async () => ({});
const position = (label: RegExp) => screen.getByRole("button", { name: label });

const fillAccount = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("이메일"), "kim@team.kr");
  await user.type(screen.getByLabelText("비밀번호"), "password1");
  await user.type(screen.getByLabelText("비밀번호 확인"), "password1");
  await user.type(screen.getByLabelText("실명"), "김운영");
  await user.click(screen.getByRole("button", { name: "오른발" }));
};

describe("가입 신청 폼 (PLAN.md §4·§5)", () => {
  it("모든 칸을 채우고 포지션 3개를 골라야 신청할 수 있다", async () => {
    const user = userEvent.setup();
    render(<SignUpForm action={noop} takenNumbers={[]} />);
    const submit = screen.getByRole("button", { name: "가입 신청" });

    await fillAccount(user);
    await user.click(position(/^센터백/));
    await user.click(position(/^미드필더/));
    expect(submit).toBeDisabled();

    await user.click(position(/^윙백/));
    expect(submit).toBeEnabled();
  });

  it("1순위 골키퍼면 골키퍼 하나로 신청할 수 있다", async () => {
    const user = userEvent.setup();
    render(<SignUpForm action={noop} takenNumbers={[]} />);

    await fillAccount(user);
    await user.click(position(/^골키퍼/));

    expect(screen.getByRole("button", { name: "가입 신청" })).toBeEnabled();
  });

  it("다른 사람이 쓰는 등번호는 고를 수 없다", () => {
    render(<SignUpForm action={noop} takenNumbers={[7]} />);
    expect(screen.getByRole("option", { name: "7 (사용 중)" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "8" })).toBeEnabled();
  });

  it("제출하면 고른 순서대로 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(noop);
    render(<SignUpForm action={action} takenNumbers={[]} />);

    await fillAccount(user);
    await user.click(position(/^센터백/));
    await user.click(position(/^골키퍼/));
    await user.click(position(/^공격수/));
    await user.selectOptions(screen.getByLabelText(/^등번호/), "10");
    await user.click(screen.getByRole("button", { name: "가입 신청" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("email")).toBe("kim@team.kr");
    expect(formData.get("password")).toBe("password1");
    expect(formData.get("passwordConfirm")).toBe("password1");
    expect(formData.get("realName")).toBe("김운영");
    expect(formData.getAll("feet")).toEqual(["right"]);
    expect(formData.getAll("preferredPositions")).toEqual(["CB", "GK", "FW"]);
    expect(formData.get("jerseyNumber")).toBe("10");
  });

  it("서버가 돌려준 오류를 해당 칸 아래에 보여 주고, 입력한 값은 그대로 둔다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({ errors: { email: "이미 가입한 이메일이에요. 로그인해 주세요." } }));
    render(<SignUpForm action={action} takenNumbers={[]} />);

    await fillAccount(user);
    await user.click(position(/^골키퍼/));
    await user.click(screen.getByRole("button", { name: "가입 신청" }));

    expect(await screen.findByText("이미 가입한 이메일이에요. 로그인해 주세요.")).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toHaveValue("kim@team.kr");
    expect(screen.getByLabelText("실명")).toHaveValue("김운영");
  });

  it("칸과 상관없는 실패는 알림으로 보여 준다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({ message: "시도가 너무 많아요. 잠시 뒤 다시 시도해 주세요." }));
    render(<SignUpForm action={action} takenNumbers={[]} />);

    await fillAccount(user);
    await user.click(position(/^골키퍼/));
    await user.click(screen.getByRole("button", { name: "가입 신청" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("시도가 너무 많아요.");
  });
});
