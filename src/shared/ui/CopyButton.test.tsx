import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CopyButton from "./CopyButton";

afterEach(() => {
  Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
});

describe("복사 단추", () => {
  it("글자를 클립보드에 넣고 붙여 넣으라고 알려 준다", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<CopyButton text={"첫 줄\n둘째 줄"} label="문구 복사" done="복사했어요. 단톡방에 붙여 넣으세요." />);

    await user.click(screen.getByRole("button", { name: "문구 복사" }));

    expect(writeText).toHaveBeenCalledWith("첫 줄\n둘째 줄");
    expect(screen.getByRole("status")).toHaveTextContent("복사했어요. 단톡방에 붙여 넣으세요.");
  });

  it("클립보드가 막히면(카톡 인앱 브라우저) 글자를 보여 주고 길게 눌러 복사하게 한다", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn(async () => Promise.reject(new Error("denied"))) },
      configurable: true,
    });
    render(<CopyButton text={"첫 줄\n둘째 줄"} label="문구 복사" done="복사했어요." />);

    await user.click(screen.getByRole("button", { name: "문구 복사" }));

    expect(screen.getByText("아래 글을 길게 눌러 복사해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("첫 줄\n둘째 줄");
  });
});
