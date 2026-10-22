import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Select from "./Select";

describe("드롭다운", () => {
  it("라벨로 찾고, 고르면 알려 준다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <label htmlFor="pick">도착</label>
        <Select id="pick" value="a" onChange={(event) => onChange(event.target.value)}>
          <option value="a">처음부터</option>
          <option value="b">11:00 도착</option>
        </Select>
      </>,
    );

    await user.selectOptions(screen.getByLabelText("도착"), "b");
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("브라우저 기본 화살표 대신 오른쪽 안쪽에 꺾쇠를 그린다 — 글자가 꺾쇠 밑으로 들어가지 않게 오른쪽을 비운다", () => {
    const { container } = render(
      <Select aria-label="정렬" defaultValue="a">
        <option value="a">이름순</option>
      </Select>,
    );
    const select = screen.getByRole("combobox", { name: "정렬" });
    expect(select).toHaveClass("appearance-none", "pr-11", "text-base");
    const chevron = container.querySelector("svg");
    expect(chevron).toHaveAttribute("aria-hidden", "true");
    expect(chevron).toHaveClass("right-4");
  });

  it("바깥 자리(여백·폭)는 감싸는 칸에 준다", () => {
    const { container } = render(
      <Select aria-label="x" className="mt-2 flex-1">
        <option>1</option>
      </Select>,
    );
    expect(container.firstElementChild).toHaveClass("relative", "mt-2", "flex-1");
  });
});
