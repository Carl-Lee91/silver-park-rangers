import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProfileState } from "../model/profileSchema";
import ProfileForm from "./ProfileForm";

type Action = (state: ProfileState, formData: FormData) => Promise<ProfileState>;

describe("내 정보 수정 폼", () => {
  it("지금 주발·선호 포지션으로 시작한다", () => {
    render(<ProfileForm action={async () => ({})} feet={["left"]} preferredPositions={["CB", "FW"]} />);
    expect(screen.getByRole("button", { name: "왼발" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^센터백/ })).toHaveTextContent("1순위");
    expect(screen.getByRole("button", { name: /^공격수/ })).toHaveTextContent("2순위");
  });

  it("바꾼 게 없으면 저장할 수 없다", async () => {
    const user = userEvent.setup();
    render(<ProfileForm action={async () => ({})} feet={["left"]} preferredPositions={["CB"]} />);
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "오른발" }));
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
  });

  it("바꾼 값을 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<ProfileForm action={action} feet={["left"]} preferredPositions={["CB"]} />);
    await user.click(screen.getByRole("button", { name: /^미드필더/ }));
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].getAll("preferredPositions")).toEqual(["CB", "MF"]);
  });

  it("저장하면 알려 준다", async () => {
    const user = userEvent.setup();
    render(<ProfileForm action={async () => ({ saved: true })} feet={["left"]} preferredPositions={["CB"]} />);
    await user.click(screen.getByRole("button", { name: "오른발" }));
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByText("저장했어요.")).toBeInTheDocument();
  });
});
