import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/shared/ui";
import TheirScoreStepper from "./TheirScoreStepper";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;
const sent = (action: ReturnType<typeof vi.fn<Action>>) => action.mock.calls[0][1];

describe("상대 점수 (− 숫자 +)", () => {
  it("아직 안 남겼으면 숫자 자리에 흐린 0 을 두고, 줄이기는 막는다 — '–' 는 빼기 기호처럼 보여 '− − +'로 읽힌다", () => {
    render(<TheirScoreStepper action={vi.fn<Action>()} matchId="m1" quarter={2} theirs={undefined} hasGoals={false} />);
    expect(screen.getByRole("status", { name: "2쿼터 상대 점수" })).toHaveTextContent("0");
    expect(screen.getByRole("status", { name: "2쿼터 상대 점수" })).toHaveClass("text-text-tertiary");
    expect(screen.getByRole("button", { name: "상대 점수 1 줄이기" })).toBeDisabled();
  });

  it("0:0 으로 끝난 쿼터는 '무실점'으로 남긴다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<TheirScoreStepper action={action} matchId="m1" quarter={2} theirs={undefined} hasGoals={false} />);

    await user.click(screen.getByRole("button", { name: "무실점" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(sent(action).get("theirScore")).toBe("0");
    expect(sent(action).get("quarter")).toBe("2");
    expect(sent(action).get("matchId")).toBe("m1");
  });

  it("늘리기는 지금 점수에 1 을 더한다 — 안 남겼으면 1 이 된다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<TheirScoreStepper action={action} matchId="m1" quarter={2} theirs={undefined} hasGoals={false} />);

    await user.click(screen.getByRole("button", { name: "상대 점수 1 늘리기" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(sent(action).get("theirScore")).toBe("1");
  });

  it("남긴 점수는 가운데에 보이고, 줄이면 1 을 뺀다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({}));
    render(<TheirScoreStepper action={action} matchId="m1" quarter={1} theirs={2} hasGoals />);
    expect(screen.getByRole("status", { name: "1쿼터 상대 점수" })).toHaveTextContent("2");
    expect(screen.queryByRole("button", { name: "무실점" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "상대 점수 1 줄이기" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(sent(action).get("theirScore")).toBe("1");
  });

  it("우리 골만 남기고 상대 점수를 안 남겼으면 0 으로 보이고, 무실점 단추는 없다 — 이미 결과가 있다", () => {
    render(<TheirScoreStepper action={vi.fn<Action>()} matchId="m1" quarter={3} theirs={undefined} hasGoals />);
    expect(screen.getByRole("status", { name: "3쿼터 상대 점수" })).toHaveTextContent("0");
    expect(screen.queryByRole("button", { name: "무실점" })).toBeNull();
    expect(screen.getByRole("button", { name: "상대 점수 1 줄이기" })).toBeDisabled();
  });

  it("실패하면 이유를 보여 준다", async () => {
    const user = userEvent.setup();
    render(<TheirScoreStepper action={async () => ({ error: "권한이 없어요." })} matchId="m1" quarter={1} theirs={1} hasGoals={false} />);

    await user.click(screen.getByRole("button", { name: "상대 점수 1 늘리기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없어요.");
  });
});
