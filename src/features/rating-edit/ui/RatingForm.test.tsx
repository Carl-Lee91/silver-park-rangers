import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RatingValues } from "@/entities/rating";
import type { ActionState } from "@/shared/ui";
import RatingForm from "./RatingForm";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;
const ok: Action = async () => ({});

const EMPTY: RatingValues = { pace: null, shooting: null, passing: null, dribbling: null, defending: null, physical: null, goalkeeping: null };
const rated: RatingValues = { ...EMPTY, pace: 9, passing: 5 };

describe("능력치 매기기 (PLAN.md §5 능력치)", () => {
  it("일곱 항목마다 고르는 칸과 ? 설명이 있다", () => {
    render(<RatingForm action={ok} memberId="m1" initial={EMPTY} />);
    for (const label of ["속도", "슛", "패스", "개인기", "수비", "피지컬", "골키퍼"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: `${label} 설명` })).toBeInTheDocument();
    }
  });

  it("매기지 않은 칸은 '미평가'이고, 매긴 칸은 그 숫자가 색과 함께 보인다", () => {
    render(<RatingForm action={ok} memberId="m1" initial={rated} />);
    expect(screen.getByLabelText("슛")).toHaveValue("");
    expect(screen.getByRole("option", { name: "미평가", selected: true, hidden: false })).toBeTruthy();
    expect(screen.getByLabelText("속도")).toHaveValue("9");
    expect(screen.getByTestId("rating-pace")).toHaveTextContent("9");
    expect(screen.getByTestId("rating-pace")).toHaveClass("text-fit-best");
  });

  it("고르면 숫자와 색이 바로 바뀐다", async () => {
    const user = userEvent.setup();
    render(<RatingForm action={ok} memberId="m1" initial={rated} />);
    await user.selectOptions(screen.getByLabelText("패스"), "2");
    expect(screen.getByTestId("rating-passing")).toHaveTextContent("2");
    expect(screen.getByTestId("rating-passing")).toHaveClass("text-fit-poor");
  });

  it("바꾼 것이 있어야 저장할 수 있고, 저장하면 고른 값을 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(ok);
    render(<RatingForm action={action} memberId="m1" initial={rated} />);
    const save = screen.getByRole("button", { name: "능력치 저장" });
    expect(save).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("골키퍼"), "4");
    await user.click(save);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = action.mock.calls[0][1];
    expect(data.get("memberId")).toBe("m1");
    expect(data.get("pace")).toBe("9");
    expect(data.get("shooting")).toBe("");
    expect(data.get("goalkeeping")).toBe("4");
    expect(await screen.findByRole("status")).toHaveTextContent("능력치를 저장했어요.");
  });

  it("저장에 실패하면 이유를 알린다", async () => {
    const user = userEvent.setup();
    render(<RatingForm action={async () => ({ error: "권한이 없어요." })} memberId="m1" initial={rated} />);
    await user.selectOptions(screen.getByLabelText("수비"), "6");
    await user.click(screen.getByRole("button", { name: "능력치 저장" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없어요.");
  });

  it("기준(9~10 팀 최고 · 7~8 잘함 · 4~6 평균 · 1~3 약함)을 보여 준다", () => {
    render(<RatingForm action={ok} memberId="m1" initial={EMPTY} />);
    const legend = screen.getByRole("list", { name: "점수 기준" });
    expect(within(legend).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "9~10 팀 최고",
      "7~8 잘함",
      "4~6 평균",
      "1~3 약함",
    ]);
  });
});
