import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RatingValues } from "../model/rating";
import RatingBars from "./RatingBars";

const values: RatingValues = { pace: 8, shooting: 3, passing: 6, dribbling: null, defending: 9, physical: 7, goalkeeping: null };

describe("능력치 막대", () => {
  it("항목마다 막대와 숫자를 둔다 — 막대 길이는 10점 만점 기준", () => {
    render(<RatingBars values={values} />);
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(["속도", "슛", "패스", "개인기", "수비", "피지컬"]);
    const pace = screen.getByRole("meter", { name: "속도" });
    expect(pace).toHaveAttribute("aria-valuenow", "8");
    expect(pace).toHaveAttribute("aria-valuemax", "10");
    expect(screen.getAllByRole("definition")[0]).toHaveTextContent("8");
  });

  it("매기지 않은 항목은 막대 없이 '–' 다", () => {
    render(<RatingBars values={values} />);
    expect(screen.queryByRole("meter", { name: "개인기" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("definition")[3]).toHaveTextContent("–");
  });

  it("골키퍼는 매겼을 때만 보인다(선택 항목)", () => {
    render(<RatingBars values={{ ...values, goalkeeping: 6 }} />);
    expect(screen.getByRole("meter", { name: "골키퍼" })).toHaveAttribute("aria-valuenow", "6");
  });

  it("점수 단계 색을 막대에 칠한다(9~10 · 7~8 · 4~6 · 1~3)", () => {
    render(<RatingBars values={values} />);
    expect(screen.getByRole("meter", { name: "수비" }).firstElementChild).toHaveClass("bg-fit-best");
    expect(screen.getByRole("meter", { name: "속도" }).firstElementChild).toHaveClass("bg-fit-good");
    expect(screen.getByRole("meter", { name: "슛" }).firstElementChild).toHaveClass("bg-fit-poor");
  });
});
