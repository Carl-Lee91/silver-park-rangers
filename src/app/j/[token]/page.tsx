import type { Metadata } from "next";
import { LinkLoginView } from "@/views/link-login";

// 카톡 미리보기 카드에는 이름을 넣지 않는다 — 링크가 다른 방으로 옮겨져도 누구 것인지 드러나지 않게.
export const metadata: Metadata = {
  title: "Silver Park Rangers 개인 링크",
  description: "누르면 가입 없이 바로 들어가서 참석 투표를 해요.",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: PageProps<"/j/[token]">) {
  const { token } = await params;
  return <LinkLoginView token={token} />;
}
