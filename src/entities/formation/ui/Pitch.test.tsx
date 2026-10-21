import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Pitch from "./Pitch";

describe("경기장", () => {
  it("넓은 칸에 놓여도 화면 높이를 넘지 않게 폭에 상한을 둔다", () => {
    render(<Pitch label="경기장">{null}</Pitch>);
    // 폭만 따라 커지면 와이드 모니터에서 골키퍼가 화면 밖으로 나간다. 상한은 globals.css 의 --container-pitch
    expect(screen.getByRole("group", { name: "경기장" })).toHaveClass("max-w-pitch");
  });
});
