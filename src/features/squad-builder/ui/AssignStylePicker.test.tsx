import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AssignStyle } from "@/entities/squad";
import AssignStylePicker from "./AssignStylePicker";

const pick = (overrides: Partial<Parameters<typeof AssignStylePicker>[0]> = {}) => {
  const onChange = vi.fn<(style: AssignStyle) => void>();
  const view = render(<AssignStylePicker value={{ kind: "default" }} quarterCount={6} rated onChange={onChange} {...overrides} />);
  return { onChange, ...view };
};

const style = (name: string) => screen.getByRole("button", { name });

describe("자동 배치 스타일 고르기 (PLAN.md §6)", () => {
  it("기본 · 균등 · 초반 집중 · 후반 집중 · 쿼터 지정이 있고, 지금 스타일이 눌려 있다", () => {
    pick({ value: { kind: "balanced" } });
    for (const name of ["기본", "균등", "초반 집중", "후반 집중", "쿼터 지정"]) expect(style(name)).toBeInTheDocument();
    expect(style("균등")).toHaveAttribute("aria-pressed", "true");
    expect(style("기본")).toHaveAttribute("aria-pressed", "false");
  });

  it("균등은 바로 고른다", async () => {
    const user = userEvent.setup();
    const { onChange } = pick();
    await user.click(style("균등"));
    expect(onChange).toHaveBeenCalledWith({ kind: "balanced" });
  });

  it("집중형은 경고 창으로 한 번 더 묻고, 취소하면 바꾸지 않는다", async () => {
    const user = userEvent.setup();
    const { onChange } = pick();
    await user.click(style("초반 집중"));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("3쿼터 넘게 이어서 쉴 수 있어요");
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onChange).not.toHaveBeenCalled();

    await user.click(style("후반 집중"));
    await user.click(screen.getByRole("button", { name: "이 스타일로" }));
    expect(onChange).toHaveBeenCalledWith({ kind: "back" });
  });

  it("쿼터 지정은 경고 뒤에 몰 쿼터를 고른다(처음엔 가운데 두 쿼터)", async () => {
    const user = userEvent.setup();
    const { onChange, rerender } = pick();
    await user.click(style("쿼터 지정"));
    await user.click(screen.getByRole("button", { name: "이 스타일로" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "focus", quarters: [2, 3] });

    rerender(<AssignStylePicker value={{ kind: "focus", quarters: [2, 3] }} quarterCount={6} rated onChange={onChange} />);
    const quarters = screen.getByRole("group", { name: "전력을 몰 쿼터" });
    expect(quarters).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3쿼터" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "1쿼터" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "focus", quarters: [0, 2, 3] });
  });

  it("쿼터 지정에서 마지막 하나는 뺄 수 없다", async () => {
    const user = userEvent.setup();
    const { onChange } = pick({ value: { kind: "focus", quarters: [4] } });
    await user.click(screen.getByRole("button", { name: "5쿼터" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("능력치를 매긴 선수가 없으면 스타일이 기본과 같다고 알려 준다", () => {
    pick({ rated: false });
    expect(screen.getByText(/능력치를 매긴 선수가 없어/)).toBeInTheDocument();
  });
});
