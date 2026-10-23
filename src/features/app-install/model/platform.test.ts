import { describe, expect, it } from "vitest";
import { externalBrowserUrl, installGuide } from "./platform";

const UA = {
  androidChrome: "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  samsung: "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.69 Mobile/15E148 Safari/604.1",
  ipadDesktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  kakaoAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36;KAKAOTALK 2410650",
  kakaoIos: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.9.1",
  naver: "Mozilla/5.0 (Linux; Android 14; SM-S918N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 NAVER(inapp; search; 1000; 12.6.3)",
  band: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 BAND/12.1.2",
  instagram: "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 Instagram 305.0.0.34.110 Android",
  macChrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
};

const guide = (userAgent: string, extra: Partial<Parameters<typeof installGuide>[0]> = {}) =>
  installGuide({ userAgent, standalone: false, canPrompt: false, maxTouchPoints: 0, ...extra });

describe("앱으로 설치 안내 (PLAN.md §7 앱으로 설치)", () => {
  it("이미 앱으로 열었으면 안내하지 않는다", () => {
    expect(guide(UA.androidChrome, { standalone: true, canPrompt: true })).toBe("installed");
  });

  it("카톡 안에서는 설치가 안 되므로 바깥 브라우저로 넘긴다 — 안드로이드 · 아이폰을 나눈다", () => {
    expect(guide(UA.kakaoAndroid)).toBe("kakao-android");
    expect(guide(UA.kakaoIos)).toBe("kakao-ios");
  });

  it("그 밖의 앱 안 브라우저(네이버 · 밴드 · 인스타그램)도 다른 브라우저로 열라고 한다", () => {
    expect(guide(UA.naver)).toBe("inapp");
    expect(guide(UA.band)).toBe("inapp");
    expect(guide(UA.instagram)).toBe("inapp");
  });

  it("브라우저가 설치 창을 띄울 수 있으면 설치 단추 하나다", () => {
    expect(guide(UA.androidChrome, { canPrompt: true })).toBe("prompt");
    expect(guide(UA.samsung, { canPrompt: true })).toBe("prompt");
    expect(guide(UA.macChrome, { canPrompt: true })).toBe("prompt");
  });

  it("아이폰 · 아이패드는 공유 → 홈 화면에 추가다(크롬으로 열어도 같다). 아이패드는 맥처럼 보여도 손가락 입력으로 안다", () => {
    expect(guide(UA.iphoneSafari)).toBe("ios");
    expect(guide(UA.iphoneChrome)).toBe("ios");
    expect(guide(UA.ipadDesktop, { maxTouchPoints: 5 })).toBe("ios");
  });

  it("설치 창을 못 띄우는 안드로이드는 브라우저 메뉴로, 컴퓨터는 주소창 · 메뉴로 안내한다", () => {
    expect(guide(UA.androidChrome)).toBe("android");
    expect(guide(UA.samsung)).toBe("android");
    expect(guide(UA.macChrome)).toBe("desktop");
    expect(guide(UA.ipadDesktop)).toBe("desktop");
  });
});

describe("카톡에서 바깥 브라우저로 열기", () => {
  it("카톡의 바깥 브라우저 열기 주소에 지금 주소를 실어 보낸다", () => {
    expect(externalBrowserUrl("https://spr.example.com/login?next=/")).toBe(
      "kakaotalk://web/openExternal?url=https%3A%2F%2Fspr.example.com%2Flogin%3Fnext%3D%2F",
    );
  });
});
