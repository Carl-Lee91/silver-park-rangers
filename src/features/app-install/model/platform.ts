/**
 * 이 기기에서 앱(PWA)으로 설치하는 방법(PLAN.md §7 "앱으로 설치").
 *
 * - installed: 이미 앱으로 열었다
 * - kakao-android · kakao-ios: 카톡 인앱 브라우저. 설치가 안 돼서 바깥 브라우저로 넘긴다
 * - inapp: 그 밖의 앱 안 브라우저(네이버 · 밴드 · 인스타그램 · 페이스북 · 라인)
 * - prompt: 브라우저가 설치 창을 띄울 수 있다(크롬 · 삼성 인터넷 · 엣지)
 * - ios: 아이폰 · 아이패드. 공유 → 홈 화면에 추가
 * - android: 설치 창을 못 띄우는 안드로이드. 브라우저 메뉴 → 앱 설치
 * - desktop: 컴퓨터. 주소창 · 메뉴의 앱 설치
 */
export type InstallGuide = "installed" | "kakao-android" | "kakao-ios" | "inapp" | "prompt" | "ios" | "android" | "desktop";

const KAKAO = /KAKAOTALK/i;
const OTHER_IN_APP = /NAVER\(inapp|BAND\/|Instagram|FBAN|FBAV|\bLine\/|DaumApps/i;
const IOS = /iPhone|iPad|iPod/i;
const ANDROID = /Android/i;

export const installGuide = ({
  userAgent,
  standalone,
  canPrompt,
  maxTouchPoints,
}: {
  userAgent: string;
  /** 홈 화면 앱으로 열었는지(display-mode: standalone · navigator.standalone) */
  standalone: boolean;
  /** 브라우저 설치 창(beforeinstallprompt)을 받아 두었는지 */
  canPrompt: boolean;
  /** 아이패드는 맥 사파리처럼 보이므로 손가락 입력으로 가른다 */
  maxTouchPoints: number;
}): InstallGuide => {
  const ios = IOS.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (standalone) return "installed";
  if (KAKAO.test(userAgent)) return ios ? "kakao-ios" : "kakao-android";
  if (OTHER_IN_APP.test(userAgent)) return "inapp";
  if (canPrompt) return "prompt";
  if (ios) return "ios";
  if (ANDROID.test(userAgent)) return "android";
  return "desktop";
};

/** 카톡 인앱 브라우저에서 이 주소를 기기의 기본 브라우저로 여는 카톡 주소 */
export const externalBrowserUrl = (href: string) => `kakaotalk://web/openExternal?url=${encodeURIComponent(href)}`;

/**
 * 카톡에게 바깥 브라우저로 열어 달라고 한다. 새 창(window.open)이 아니라 카톡 주소로 이동한다 —
 * 카톡이 받아서 기본 브라우저를 띄운다. 버전에 따라 안 될 때가 있어 화면에 손 안내를 같이 둔다.
 */
export const openInExternalBrowser = (href: string) => {
  window.location.href = externalBrowserUrl(href);
};
