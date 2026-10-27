import { parseEnv, parseServerEnv, type Env, type ServerEnv } from "./env";

export type { Env, ServerEnv } from "./env";
export { adminMatchEditPath, adminMatchPath, adminMemberPath, adminSquadPath, isUnder, matchPath, ROUTES } from "./routes";

let cachedPublic: Env | null = null;
let cachedServer: ServerEnv | null = null;

/**
 * 검증된 공개 환경변수. 처음 부를 때 한 번만 검사한다.
 *
 * 모듈을 불러오는 순간 검사하지 않는 이유는 두 가지다. 값이 없는 환경에서
 * import 만으로 터지면 테스트가 무관한 이유로 죽고, 빌드 때 없어도 되는 값을
 * 빌드가 요구하게 된다.
 *
 * 🔴 `process.env.X` 를 **한 글자씩 그대로** 적어야 한다. Next 는 빌드 때
 * 이 표현을 문자열로 치환하는데, `process.env` 를 통째로 넘기면 브라우저
 * 번들에서 빈 객체가 된다.
 */
export const getEnv = (): Env =>
  (cachedPublic ??= parseEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }));

/** 서버에서만 부른다. 브라우저에서 부르면 값이 없어 터진다 — 그게 맞다. */
export const getServerEnv = (): ServerEnv =>
  (cachedServer ??= parseServerEnv({ SITE_URL: process.env.SITE_URL, CRON_SECRET: process.env.CRON_SECRET }));
