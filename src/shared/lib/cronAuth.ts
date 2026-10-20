/**
 * Vercel Cron 요청인지. `CRON_SECRET` 을 정해 두면 Vercel 이 `Authorization: Bearer <값>` 을 붙여 보낸다.
 * 비밀값을 안 정했으면 막지 않는다 — DB 에 핑을 보내는 것뿐이라 남이 불러도 해가 없다.
 */
export const isCronAuthorized = (authorization: string | null, secret: string) =>
  secret === "" || authorization === `Bearer ${secret}`;
