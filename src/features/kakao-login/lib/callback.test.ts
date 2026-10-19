import { describe, expect, it, vi } from "vitest";
import { callbackDestination } from "./callback";

describe("카카오 로그인 후 돌아왔을 때 갈 곳", () => {
  it("코드를 세션으로 바꾸면 홈으로 간다 — 그다음은 게이트가 정한다", async () => {
    const exchange = vi.fn(async () => true);
    expect(await callbackDestination({ code: "abc", error: null }, exchange)).toBe("/");
    expect(exchange).toHaveBeenCalledWith("abc");
  });

  it("카카오 화면에서 취소하면 그 사유를 들고 로그인 화면으로 간다", async () => {
    const exchange = vi.fn(async () => true);
    expect(await callbackDestination({ code: null, error: "access_denied" }, exchange)).toBe(
      "/login?error=access_denied",
    );
    expect(exchange).not.toHaveBeenCalled();
  });

  it("코드가 없거나 바꾸지 못하면 로그인 화면으로 간다", async () => {
    expect(await callbackDestination({ code: null, error: null }, async () => true)).toBe("/login?error=exchange");
    expect(await callbackDestination({ code: "abc", error: null }, async () => false)).toBe("/login?error=exchange");
  });

  it("사유에 이상한 글자가 있어도 주소를 깨뜨리지 않는다", async () => {
    expect(await callbackDestination({ code: null, error: "a&b=c" }, async () => true)).toBe(
      "/login?error=a%26b%3Dc",
    );
  });
});
