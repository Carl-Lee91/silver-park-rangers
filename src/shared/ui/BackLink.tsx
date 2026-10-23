import Link from "next/link";

/**
 * 뒤로 가기. 화면마다 "← 홈", "← 로그인"처럼 제각각이던 것을 한 모양(‹ 꺾쇠 + 돌아갈 화면 이름)으로 맞춘다.
 * 글자만 있던 링크는 누르는 영역이 20px 남짓이라 44px 로 키운다(왼쪽 여백은 꺾쇠가 본문 줄에 맞게 당긴다).
 */
export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex h-11 max-w-full items-center gap-0.5 self-start rounded-box pr-3 pl-1 text-sm text-text-secondary"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-5 shrink-0">
        <path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="truncate">{label}</span>
    </Link>
  );
}
