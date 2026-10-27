import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { Position } from "@/entities/position";
import { PositionPicker } from "./ProfilePickers";

function Harness({ initial = [] }: { initial?: Position[] }) {
  const [value, setValue] = useState<Position[]>(initial);
  return <PositionPicker value={value} onChange={setValue} />;
}

const button = (label: RegExp) => screen.getByRole("button", { name: label });

describe("선호 포지션 고르기 (PLAN.md §5)", () => {
  it("10개 포지션을 줄(1선 ~ 5선 · 골키퍼)로 묶어 보여 준다", () => {
    render(<Harness />);
    const line = (name: string) => screen.getByRole("group", { name });
    expect(line("1선").querySelectorAll("button")).toHaveLength(1);
    expect(line("3선")).toHaveTextContent(/중앙 미드필더.*와이드 미드필더/);
    expect(line("4선")).toHaveTextContent(/수비형 미드필더.*윙백/);
    expect(line("5선")).toHaveTextContent(/센터백.*풀백/);
    expect(screen.getAllByRole("button")).toHaveLength(10);
  });

  it("1순위로 골키퍼를 고르면 나머지 포지션이 막힌다", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(button(/^골키퍼/));

    expect(button(/^골키퍼/)).toHaveTextContent("1순위");
    expect(button(/^센터백/)).toBeDisabled();
    expect(button(/^공격수/)).toBeDisabled();
  });

  it("골키퍼를 빼면 다시 고를 수 있다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["GK"]} />);

    await user.click(button(/^골키퍼/));

    expect(button(/^센터백/)).toBeEnabled();
  });

  it("골키퍼를 2순위로 고르면 3순위를 더 고를 수 있다", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(button(/^센터백/));
    await user.click(button(/^골키퍼/));

    expect(button(/^골키퍼/)).toHaveTextContent("2순위");
    expect(button(/^공격수/)).toBeEnabled();
  });

  it("3개를 다 고르면 나머지가 막힌다", async () => {
    render(<Harness initial={["CB", "FW", "WG"]} />);

    expect(button(/^중앙 미드필더/)).toBeDisabled();
    expect(button(/^센터백/)).toBeEnabled();
  });
});
