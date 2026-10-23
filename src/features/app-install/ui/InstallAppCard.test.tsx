import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const external = vi.hoisted(() => ({ open: vi.fn() }));
vi.mock("../model/platform", async (original) => ({
  ...(await original<typeof import("../model/platform")>()),
  openInExternalBrowser: external.open,
}));

const { resetInstallPromptForTest } = await import("../model/installPrompt");
const { default: InstallAppCard, DISMISS_KEY } = await import("./InstallAppCard");

const ANDROID = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const KAKAO = `${ANDROID};KAKAOTALK 2410650`;

const setDevice = (userAgent: string, standalone = false) => {
  vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(userAgent);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: standalone && query.includes("standalone"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetInstallPromptForTest();
  external.open.mockReset();
});

describe("앱으로 설치 패널", () => {
  it("브라우저가 설치 창을 띄울 수 있으면 '앱 설치' 단추로 띄운다", async () => {
    const user = userEvent.setup();
    setDevice(ANDROID);
    render(<InstallAppCard />);
    const prompt = vi.fn(async () => {});
    act(() => {
      window.dispatchEvent(
        Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
          prompt,
          userChoice: Promise.resolve({ outcome: "accepted" as const }),
        }),
      );
    });
    await user.click(await screen.findByRole("button", { name: "앱 설치" }));
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it("설치 창을 못 띄우는 안드로이드는 브라우저 메뉴 안내를 보인다", async () => {
    setDevice(ANDROID);
    render(<InstallAppCard />);
    expect(await screen.findByText(/앱 설치.*홈 화면에 추가/)).toBeInTheDocument();
  });

  it("아이폰은 공유 → 홈 화면에 추가 순서와, 앱에서 한 번 더 로그인한다는 것을 알려 준다", async () => {
    setDevice(IPHONE);
    render(<InstallAppCard />);
    const steps = await screen.findByRole("list", { name: "설치 순서" });
    expect(steps).toHaveTextContent("공유");
    expect(steps).toHaveTextContent("홈 화면에 추가");
    expect(screen.getByText(/한 번 더 로그인/)).toBeInTheDocument();
  });

  it("카톡 안에서는 '다른 브라우저로 열기' 단추로 바깥 브라우저에 지금 주소를 연다", async () => {
    const user = userEvent.setup();
    setDevice(KAKAO);
    render(<InstallAppCard />);
    await user.click(await screen.findByRole("button", { name: "다른 브라우저로 열기" }));
    expect(external.open).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByText(/다른 브라우저로 열기/, { selector: "p, li" })).toBeInTheDocument();
  });

  it("이미 앱으로 열었으면 아무것도 보이지 않는다", () => {
    setDevice(ANDROID, true);
    const { container } = render(<InstallAppCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("접을 수 있는 자리에서는 '다음에'로 2주 동안 숨긴다", async () => {
    const user = userEvent.setup();
    setDevice(IPHONE);
    const { unmount } = render(<InstallAppCard dismissible />);
    await user.click(await screen.findByRole("button", { name: "다음에" }));
    expect(screen.queryByRole("region", { name: "앱으로 설치" })).not.toBeInTheDocument();
    unmount();

    render(<InstallAppCard dismissible />);
    expect(screen.queryByRole("region", { name: "앱으로 설치" })).not.toBeInTheDocument();
  });

  it("2주가 지나면 다시 보인다", async () => {
    setDevice(IPHONE);
    localStorage.setItem(DISMISS_KEY, String(Date.now() - 15 * 24 * 60 * 60 * 1000));
    render(<InstallAppCard dismissible />);
    expect(await screen.findByRole("region", { name: "앱으로 설치" })).toBeInTheDocument();
  });

  it("늘 두는 자리(내 정보)에는 '다음에'가 없다", async () => {
    setDevice(IPHONE);
    render(<InstallAppCard />);
    await screen.findByRole("region", { name: "앱으로 설치" });
    expect(screen.queryByRole("button", { name: "다음에" })).not.toBeInTheDocument();
  });
});
