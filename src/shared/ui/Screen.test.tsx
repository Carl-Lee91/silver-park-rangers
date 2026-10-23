import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Screen from "./Screen";

describe("화면 틀", () => {
  it("맨 위에 머리띠, 그 아래 본문(main)을 둔다", () => {
    render(
      <Screen title="홈" overline="Silver Park Rangers">
        <p>다음 매치</p>
      </Screen>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "홈" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("다음 매치");
  });

  it("머리띠 내용과 본문은 같은 폭이다", () => {
    const { container } = render(
      <Screen title="로그인" width="narrow">
        폼
      </Screen>,
    );
    expect(screen.getByRole("main")).toHaveClass("max-w-narrow");
    expect(container.querySelector("header > div")).toHaveClass("max-w-narrow");
  });
});
