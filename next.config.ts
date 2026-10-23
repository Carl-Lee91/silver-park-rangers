import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    Cache Components(cacheComponents)는 켜지 않는다. 로그인 화면 말고는 모든 화면이
    세션을 읽는데, 켜 두면 세션을 읽는 자리마다 Suspense 경계가 필요하다.
    얻는 것(정적 껍데기 미리 그리기)이 이 앱에는 거의 없다.
  */
  /*
    메타데이터 스트리밍을 끈다. 동적 페이지의 메타태그는 원래 본문 뒤에 흘려 보내고, 알려진 봇에게만
    <head> 에 넣어 준다. 카카오톡 미리보기 수집기(kakaotalk-scrap)는 그 목록에 없어서, 켜 두면
    공유 링크(/s/…)의 미리보기 카드가 비게 된다. 메타데이터를 만드는 화면이 공유 페이지뿐이라
    다른 화면이 느려지지는 않는다.
  */
  htmlLimitedBots: /.*/,
  /*
    서비스 워커(public/sw.js)는 기기에 캐시하지 않는다. 고쳐도 예전 워커가 남지 않게(Next.js PWA 안내서).
  */
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  /*
    서버 이미지(/s/…/og · /s/…/image · 관리자 스쿼드 이미지)가 실행 중에 읽는 한글 폰트와 엠블럼을 배포 묶음에 넣는다
    (src/shared/lib/server.ts 의 loadImageFonts · loadImageEmblem).
  */
  outputFileTracingIncludes: {
    "/s/**": ["./src/shared/assets/fonts/**", "./src/shared/assets/brand/**"],
    "/admin/matches/**": ["./src/shared/assets/fonts/**", "./src/shared/assets/brand/**"],
  },
  /*
    Turbopack 파일 캐시를 끈다(이 버전은 기본으로 켜져 있다). 켜 두면 Vercel 이 되살린 빌드 캐시에서
    Tailwind 결과를 그대로 써서, globals.css 에 새로 넣은 토큰(유니폼 색 등)만 운영 CSS 에서 빠졌다
    (2026-10-21, 다른 파일의 새 클래스는 들어가 있었다). 개발 서버도 재시작해도 예전 토큰이 남았다.
    작은 앱이라 매번 새로 컴파일해도 느리지 않다.
  */
  experimental: {
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
