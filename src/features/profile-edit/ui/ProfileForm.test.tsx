import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProfileState } from "../model/profileSchema";
import ProfileForm from "./ProfileForm";

type Action = (state: ProfileState, formData: FormData) => Promise<ProfileState>;

describe("내 정보 수정 폼", () => {
  it("지금 주발·선호 포지션으로 시작한다", () => {
    render(<ProfileForm action={async () => ({})} feet={["left"]} preferredPositions={["CB", "FW", "WG"]} jerseyNumber={null} takenNumbers={[]} />);
    expect(screen.getByRole("button", { name: "왼발" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^센터백/ })).toHaveTextContent("1순위");
    expect(screen.getByRole("button", { name: /^공격수/ })).toHaveTextContent("2순위");
  });

  it("바꾼 게 없으면 저장할 수 없다", async () => {
    const user = userEvent.setup();
    render(<ProfileForm action={async () => ({})} feet={["left"]} preferredPositions={["CB", "FW", "WG"]} jerseyNumber={null} takenNumbers={[]} />);
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "오른발" }));
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
  });

  it("바꾼 값을 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<ProfileForm action={action} feet={["left"]} preferredPositions={["CB", "FW", "WG"]} jerseyNumber={null} takenNumbers={[]} />);
    await user.click(screen.getByRole("button", { name: /^공격수/ }));
    await user.click(screen.getByRole("button", { name: /^중앙 미드필더/ }));
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].getAll("preferredPositions")).toEqual(["CB", "WG", "MF"]);
  });

  it("포지션을 3개 다 고르기 전에는 저장할 수 없다", async () => {
    const user = userEvent.setup();
    render(<ProfileForm action={async () => ({})} feet={["left"]} preferredPositions={["CB", "FW", "WG"]} jerseyNumber={null} takenNumbers={[]} />);
    await user.click(screen.getByRole("button", { name: /^공격수/ }));
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("1순위 골키퍼는 골키퍼 하나로 저장한다", async () => {
    const user = userEvent.setup();
    render(<ProfileForm action={async () => ({})} feet={["left"]} preferredPositions={["CB", "FW", "WG"]} jerseyNumber={null} takenNumbers={[]} />);
    for (const label of [/^센터백/, /^공격수/, /^윙 |^윙$/]) await user.click(screen.getByRole("button", { name: label }));
    await user.click(screen.getByRole("button", { name: /^골키퍼/ }));
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
  });

  it("저장하면 알려 준다", async () => {
    const user = userEvent.setup();
    render(<ProfileForm action={async () => ({ saved: true })} feet={["left"]} preferredPositions={["CB", "FW", "WG"]} jerseyNumber={null} takenNumbers={[]} />);
    await user.click(screen.getByRole("button", { name: "오른발" }));
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByText("저장했어요.")).toBeInTheDocument();
  });

  it("등번호를 고른다 — 다른 사람이 쓰는 번호는 고를 수 없다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<ProfileForm action={action} feet={["left"]} preferredPositions={["CB", "FW", "WG"]} jerseyNumber={null} takenNumbers={[7]} />);
    expect(screen.getByRole("option", { name: "7 (사용 중)" })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText(/^등번호/), "10");
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].get("jerseyNumber")).toBe("10");
  });

  it("포지션을 빼서 저장이 막히면 무엇이 남았는지 알려 준다", async () => {
    const user = userEvent.setup();
    render(<ProfileForm action={async () => ({})} feet={["left"]} preferredPositions={["CB", "FW", "WG"]} jerseyNumber={null} takenNumbers={[]} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    await user.click(screen.getByRole("button", { name: /^공격수/ }));

    expect(screen.getByRole("status")).toHaveTextContent("남은 것: 선호 포지션 1개 더");
  });

  it("등번호 안내는 지금 화면(유니폼 모양)과 맞게 말한다", () => {
    render(<ProfileForm action={async () => ({})} feet={["left"]} preferredPositions={["CB", "FW", "WG"]} jerseyNumber={null} takenNumbers={[]} />);
    expect(screen.getByText(/유니폼에 들어가요/)).toBeInTheDocument();
    expect(screen.queryByText(/동그라미/)).toBeNull();
  });
});

