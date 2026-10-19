import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silver Park Rangers",
  description: "참석 투표부터 쿼터별 스쿼드 편성까지",
};

export const viewport: Viewport = {
  // globals.css 의 --color-primary 와 같은 값
  themeColor: "#1f6f43",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
