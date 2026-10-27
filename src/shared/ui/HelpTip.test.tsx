import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import HelpTip from "./HelpTip";

describe("? 설명 단추", () => {
  it("이름 옆 ? 단추를 누르면(휴대폰) 설명이 뜨고, 다시 누르면 닫힌다", async () => {
    const user = userEvent.setup();
    render(<HelpTip label="속도">순간 속도, 전력 질주</HelpTip>);
    const button = screen.getByRole("button", { name: "속도 설명" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("tooltip")).toHaveTextContent("순간 속도, 전력 질주");
    expect(button).toHaveAccessibleDescription("순간 속도, 전력 질주");

    await user.click(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("Esc 로 닫는다", async () => {
    const user = userEvent.setup();
    render(<HelpTip label="슛">결정력</HelpTip>);
    await user.click(screen.getByRole("button", { name: "슛 설명" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("데스크톱은 마우스를 올리면 뜬다(누르지 않아도)", () => {
    const { container } = render(<HelpTip label="패스">시야</HelpTip>);
    expect(container.querySelector("[data-help-text]")).toHaveClass("group-hover:block");
  });

  it("아이콘은 작아도 누르는 영역은 44px 이다", () => {
    render(<HelpTip label="수비">마크</HelpTip>);
    expect(screen.getByRole("button", { name: "수비 설명" })).toHaveClass("size-11");
  });
});
