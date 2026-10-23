/**
 * 계정 줄(팀 화면 · 내 정보 · 로그아웃) 단추 모양. 내 정보 링크(MyPageLink)와 로그아웃(features/sign-out)이
 * 같은 모양으로 나란히 놓인다(PLAN.md §7 "내 정보 · 로그아웃").
 *
 * 🔴 "use client" 파일에 두지 않는다. 서버 컴포넌트가 클라이언트 파일의 값을 가져오면 글자 대신 참조가 와서
 * 모양이 빠진다(로그아웃 아이콘이 글자 위로 올라갔다).
 */
export const ACCOUNT_ITEM =
  "inline-flex h-11 items-center gap-1.5 rounded-box px-3 text-sm font-medium text-text-secondary aria-[current=page]:font-bold aria-[current=page]:text-text-primary";
