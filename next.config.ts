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
    서버 이미지(/s/…/og · /s/…/image)가 실행 중에 읽는 한글 폰트를 배포 묶음에 넣는다
    (src/shared/lib/server.ts 의 loadImageFonts).
  */
  outputFileTracingIncludes: {
    "/s/**": ["./src/shared/assets/fonts/**"],
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
