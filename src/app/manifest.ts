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
    // 다크 모드: globals.css 의 --color-bg-base 와 같은 값(시작 화면 · 상태 표시줄)
    background_color: "#10151c",
    theme_color: "#10151c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
