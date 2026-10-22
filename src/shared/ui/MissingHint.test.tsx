import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MissingHint from "./MissingHint";

describe("막힌 단추 아래 안내", () => {
  it("남은 항목을 이어서 보여 준다", () => {
    render(<MissingHint items={["실명", "선호 포지션 2개 더"]} />);
    expect(screen.getByRole("status")).toHaveTextContent("남은 것: 실명 · 선호 포지션 2개 더");
  });

  it("남은 게 없으면 아무것도 그리지 않지만 알림 자리는 남긴다 — 스크린리더가 바뀜을 읽게", () => {
    render(<MissingHint items={[]} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
