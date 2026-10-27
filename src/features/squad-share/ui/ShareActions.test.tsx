import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ShareActions from "./ShareActions";

describe("공유 단추", () => {
  it("이미지가 있으면(축구) 쿼터별 · 출전표 이미지 단추를 둔다", () => {
    render(<ShareActions shareUrl="https://x/s/t" title="스쿼드" imageUrls={{ quarters: "/q.png", rotation: "/r.png" }} />);
    expect(screen.getByRole("button", { name: "공유하기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "쿼터별 이미지" })).toBeInTheDocument();
  });

  it("이미지가 없으면(풋살) 공유 링크만 둔다", () => {
    render(<ShareActions shareUrl="https://x/s/t" title="팀" />);
    expect(screen.getByRole("button", { name: "공유하기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "쿼터별 이미지" })).not.toBeInTheDocument();
  });
});
