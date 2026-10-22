import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { NavigationProgress, TopProgressBar } from "@/shared/ui";
// 글꼴: Pretendard(무료 OFL)를 글자 범위별 조각으로 우리 서버에서 내보낸다 — 외부 CDN 을 쓰지 않는다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silver Park Rangers",
  description: "참석 투표부터 쿼터별 스쿼드 편성까지",
};

export const viewport: Viewport = {
  // 상태 표시줄 색. 다크 모드라 globals.css 의 --color-bg-base 와 같은 값이다(화면과 이어지게)
  themeColor: "#10151c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* 앱 전체에 하나: 화면 이동·서버 요청 중이면 맨 위에 로딩 바가 뜬다 */}
        <TopProgressBar />
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
