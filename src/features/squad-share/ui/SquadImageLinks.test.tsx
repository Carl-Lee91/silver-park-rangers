import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SquadImageLinks from "./SquadImageLinks";

describe("스쿼드 이미지 열기", () => {
  it("쿼터별·출전표 이미지를 새 창으로 연다 — 카톡 인앱 브라우저에서 길게 눌러 저장한다", () => {
    render(<SquadImageLinks urls={{ quarters: "/q.png", rotation: "/r.png" }} />);
    expect(screen.getByRole("link", { name: "쿼터별 이미지" })).toHaveAttribute("href", "/q.png");
    expect(screen.getByRole("link", { name: "출전표 이미지" })).toHaveAttribute("href", "/r.png");
    expect(screen.getByRole("link", { name: "출전표 이미지" })).toHaveAttribute("target", "_blank");
  });
});
