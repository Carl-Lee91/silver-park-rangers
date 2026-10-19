import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    Cache Components(cacheComponents)는 켜지 않는다. 로그인 화면 말고는 모든 화면이
    세션을 읽는데, 켜 두면 세션을 읽는 자리마다 Suspense 경계가 필요하다.
    얻는 것(정적 껍데기 미리 그리기)이 이 앱에는 거의 없다.
  */
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
