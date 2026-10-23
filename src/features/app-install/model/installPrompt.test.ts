import { afterEach, describe, expect, it, vi } from "vitest";
import { getInstallState, listenForInstallPrompt, promptInstall, resetInstallPromptForTest } from "./installPrompt";

/** 크롬이 보내는 beforeinstallprompt 와 같은 모양 */
const firePrompt = (outcome: "accepted" | "dismissed" = "accepted") => {
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome }),
  });
  window.dispatchEvent(event);
  return event;
};

afterEach(() => resetInstallPromptForTest());

describe("브라우저 설치 창 맡아 두기", () => {
  it("설치 창 이벤트를 받아 두고, 브라우저가 스스로 띄우지 않게 막는다", () => {
    listenForInstallPrompt();
    expect(getInstallState()).toEqual({ canPrompt: false, installed: false });
    const event = firePrompt();
    expect(event.defaultPrevented).toBe(true);
    expect(getInstallState().canPrompt).toBe(true);
  });

  it("단추를 누르면 받아 둔 설치 창을 띄우고 고른 결과를 돌려준다. 설치 창은 한 번만 쓸 수 있다", async () => {
    listenForInstallPrompt();
    const event = firePrompt("dismissed");
    await expect(promptInstall()).resolves.toBe("dismissed");
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(getInstallState().canPrompt).toBe(false);
    await expect(promptInstall()).resolves.toBe("unavailable");
  });

  it("설치가 끝나면(appinstalled) 설치됨으로 본다", () => {
    listenForInstallPrompt();
    firePrompt();
    window.dispatchEvent(new Event("appinstalled"));
    expect(getInstallState()).toEqual({ canPrompt: false, installed: true });
  });

  it("여러 번 불러도 이벤트를 한 번만 듣는다", () => {
    const spy = vi.spyOn(window, "addEventListener");
    listenForInstallPrompt();
    listenForInstallPrompt();
    expect(spy.mock.calls.filter(([type]) => type === "beforeinstallprompt")).toHaveLength(1);
    spy.mockRestore();
  });
});
