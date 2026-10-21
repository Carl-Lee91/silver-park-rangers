import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { progress } from "./progress/progressStore";
import SubmitButton from "./SubmitButton";

const deferred = () => {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
};

describe("제출 단추", () => {
  it("보내는 동안 막히고 스피너가 돌며, 전역 로딩 바도 켠다", async () => {
    const user = userEvent.setup();
    const wait = deferred();
    render(
      <form action={() => wait.promise}>
        <SubmitButton className="btn">저장</SubmitButton>
      </form>,
    );
    const button = screen.getByRole("button", { name: "저장" });

    await user.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(progress.isActive()).toBe(true);

    wait.resolve();
    await waitFor(() => expect(button).toBeEnabled());
    expect(button).toHaveAttribute("aria-busy", "false");
    expect(progress.isActive()).toBe(false);
  });

  it("막아 두면 누를 수 없다", () => {
    render(
      <form>
        <SubmitButton disabled>저장</SubmitButton>
      </form>,
    );
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("한 폼에 단추가 여럿이면 누른 단추에만 스피너가 돈다", async () => {
    const user = userEvent.setup();
    const wait = deferred();
    render(
      <form action={() => wait.promise}>
        <SubmitButton name="response" value="yes">
          참석
        </SubmitButton>
        <SubmitButton name="response" value="no">
          불참
        </SubmitButton>
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "참석" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "참석" })).toHaveAttribute("aria-busy", "true"));
    expect(screen.getByRole("button", { name: "불참" })).toHaveAttribute("aria-busy", "false");
    expect(screen.getByRole("button", { name: "불참" })).toBeDisabled();

    wait.resolve();
    await waitFor(() => expect(screen.getByRole("button", { name: "참석" })).toBeEnabled());
  });
});
