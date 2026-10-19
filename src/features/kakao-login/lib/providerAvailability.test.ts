import { describe, expect, it } from "vitest";
import { isKakaoEnabled } from "./providerAvailability";

describe("카카오 로그인이 켜져 있는지 (Supabase /auth/v1/settings)", () => {
  it("external.kakao 가 true 면 켜져 있다", () => {
    expect(isKakaoEnabled({ external: { kakao: true, google: false } })).toBe(true);
  });

  it("false 면 꺼져 있다", () => {
    expect(isKakaoEnabled({ external: { kakao: false } })).toBe(false);
  });

  it.each([null, undefined, "error", {}, { external: null }, { external: { kakao: "yes" } }])(
    "모르는 모양이면 꺼진 것으로 본다 (%o)",
    (settings) => {
      expect(isKakaoEnabled(settings)).toBe(false);
    },
  );
});
