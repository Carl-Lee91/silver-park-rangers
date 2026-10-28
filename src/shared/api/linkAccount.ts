/**
 * 개인 링크(PLAN.md §4)로 처음 들어온 사람의 로그인 계정.
 *
 * 로그인 서버는 계정마다 이메일이나 전화번호를 요구한다. 그래서 메일이 가지 않는 표시용 주소를 넣는다 —
 * `.invalid` 는 어디에도 쓰지 않기로 정해 둔 최상위 도메인이다(RFC 2606). 메일은 원래 보내지 않는다(PLAN.md §2).
 */
const LINK_EMAIL_DOMAIN = "link.invalid";

export const linkAccountEmail = (memberId: string) => `${memberId}@${LINK_EMAIL_DOMAIN}`;

/** 링크로 만든 계정의 표시. 계정의 app_metadata 에 남기고 DB(`is_link_account`)도 같은 값을 본다 */
export const LINK_ACCOUNT_METADATA = { link_login: true } as const;

export const isLinkAccount = (appMetadata: unknown): boolean =>
  typeof appMetadata === "object" && appMetadata !== null && (appMetadata as Record<string, unknown>).link_login === true;
