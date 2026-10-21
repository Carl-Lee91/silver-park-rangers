import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShareActions from "./ShareActions";

const props = {
  shareUrl: "https://team.example/s/token",
  title: "10월 25일 (일) vs FC 서울 스쿼드",
  imageUrls: { quarters: "/s/token/image?view=quarters", rotation: "/s/token/image?view=rotation" },
};

describe("스쿼드 공유", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "share");
  });

  it("공유 시트가 있으면 그것으로 링크를 보낸다", async () => {
    const user = userEvent.setup();
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    render(<ShareActions {...props} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));
    expect(share).toHaveBeenCalledWith({ title: props.title, url: props.shareUrl });
  });

  it("공유 시트가 없으면 링크를 복사한다", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<ShareActions {...props} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(props.shareUrl));
    expect(await screen.findByText("링크를 복사했어요. 카톡에 붙여 넣으세요.")).toBeInTheDocument();
  });

  it("복사도 안 되면 길게 눌러 복사할 수 있게 주소를 보여 준다", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    render(<ShareActions {...props} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));
    expect(await screen.findByDisplayValue(props.shareUrl)).toBeInTheDocument();
  });

  it("이미지는 새 창이 아니라 앱 안에서 연다 — PWA 에서 새 창은 앱을 하나 더 띄운다", () => {
    render(<ShareActions {...props} />);
    expect(screen.getByRole("button", { name: "쿼터별 이미지" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "출전표 이미지" })).toBeNull();
  });
});
