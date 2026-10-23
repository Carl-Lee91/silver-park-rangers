import type { MetadataRoute } from "next";

/** 홈 화면에 추가(PWA). 카톡 링크로 들어온 뒤 홈 화면에 두면 앱처럼 열린다. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Silver Park Rangers",
    short_name: "SPR",
    description: "참석 투표부터 쿼터별 스쿼드 편성까지",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    // 시작 화면은 앱 바탕(--color-bg-base), 상태 표시줄은 머리띠 하늘색(--color-kit). theme.test.ts 가 검사한다
    background_color: "#0b1016",
    theme_color: "#80c4ee",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
