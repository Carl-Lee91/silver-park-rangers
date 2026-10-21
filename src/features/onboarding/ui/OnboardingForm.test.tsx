import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OnboardingState } from "../model/onboardingSchema";
import OnboardingForm from "./OnboardingForm";

type Action = (state: OnboardingState, formData: FormData) => Promise<OnboardingState>;
const noop: Action = async () => ({});
const positionButton = (label: RegExp) => screen.getByRole("button", { name: label });

describe("온보딩 폼", () => {
  it("포지션은 누른 순서대로 순위가 붙고, 3개를 넘게 고를 수 없다", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm action={noop} takenNumbers={[]} />);

    await user.click(positionButton(/^센터백/));
    await user.click(positionButton(/^공격수/));
    await user.click(positionButton(/^윙$|^윙 /));
    await user.click(positionButton(/^미드필더/));

    expect(positionButton(/^센터백/)).toHaveTextContent("1순위");
    expect(positionButton(/^공격수/)).toHaveTextContent("2순위");
    expect(positionButton(/^윙$|^윙 /)).toHaveTextContent("3순위");
    expect(positionButton(/^미드필더/)).toHaveAttribute("aria-pressed", "false");
    expect(positionButton(/^미드필더/)).toBeDisabled();
  });

  it("고른 포지션을 다시 누르면 빠지고 뒤 순위가 당겨진다", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm action={noop} takenNumbers={[]} />);

    await user.click(positionButton(/^센터백/));
    await user.click(positionButton(/^공격수/));
    await user.click(positionButton(/^골키퍼/));
    await user.click(positionButton(/^센터백/));

    expect(positionButton(/^센터백/)).toHaveAttribute("aria-pressed", "false");
    expect(positionButton(/^공격수/)).toHaveTextContent("1순위");
    expect(positionButton(/^골키퍼/)).toHaveTextContent("2순위");
  });

  it("실명·주발·포지션 3개를 다 채워야 가입 신청을 누를 수 있다", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm action={noop} takenNumbers={[]} />);
    const submit = screen.getByRole("button", { name: "가입 신청" });

    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText("실명"), "김운영");
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "오른발" }));
    expect(submit).toBeDisabled();
    await user.click(positionButton(/^미드필더/));
    await user.click(positionButton(/^센터백/));
    expect(submit).toBeDisabled();
    await user.click(positionButton(/^윙백/));
    expect(submit).toBeEnabled();
  });

  it("다른 사람이 쓰는 등번호는 고를 수 없다", () => {
    render(<OnboardingForm action={noop} takenNumbers={[7]} />);
    expect(screen.getByRole("option", { name: "7 (사용 중)" })).toBeDisabled();
  });

  it("제출하면 고른 순서대로 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(noop);
    render(<OnboardingForm action={action} takenNumbers={[]} />);

    await user.type(screen.getByLabelText("실명"), "김운영");
    await user.click(screen.getByRole("button", { name: "왼발" }));
    await user.click(screen.getByRole("button", { name: "오른발" }));
    await user.click(positionButton(/^센터백/));
    await user.click(positionButton(/^공격수/));
    await user.click(positionButton(/^윙백/));
    await user.selectOptions(screen.getByLabelText(/^등번호/), "9");
    await user.click(screen.getByRole("button", { name: "가입 신청" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("realName")).toBe("김운영");
    expect(formData.getAll("feet")).toEqual(["left", "right"]);
    expect(formData.getAll("preferredPositions")).toEqual(["CB", "FW", "WB"]);
    expect(formData.get("jerseyNumber")).toBe("9");
  });

  it("서버가 돌려준 오류를 해당 칸 아래에 보여 준다", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ errors: { realName: "실명은 20자까지 입력할 수 있어요." } }));
    render(<OnboardingForm action={action} takenNumbers={[]} />);

    await user.type(screen.getByLabelText("실명"), "김운영");
    await user.click(screen.getByRole("button", { name: "오른발" }));
    await user.click(positionButton(/^골키퍼/));
    await user.click(screen.getByRole("button", { name: "가입 신청" }));

    expect(await screen.findByText("실명은 20자까지 입력할 수 있어요.")).toBeInTheDocument();
  });
});
