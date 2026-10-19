import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silver Park Rangers",
  description: "참석 투표부터 쿼터별 스쿼드 편성까지",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
