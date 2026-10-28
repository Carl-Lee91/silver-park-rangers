import { z } from "zod";

/**
 * 환경변수는 여기서 한 번 검증하고, 코드에서는 검증된 값만 쓴다.
 * `process.env` 를 곳곳에서 직접 읽으면 오타가 런타임까지 살아남는다.
 *
 * 스키마가 둘인 이유는 **누가 보느냐**가 다르기 때문이다.
 *
 * - `NEXT_PUBLIC_` 이 붙은 값은 빌드 때 브라우저 번들에 그대로 박힌다.
 *   anon key 는 공개되는 것이 정상이고, 실제 접근 통제는 Supabase 의 RLS 가 한다.
 * - 접두사가 없는 값은 서버에만 있다. 브라우저에서 읽으면 `undefined` 다.
 *   🔴 비밀은 반드시 이쪽에 둔다.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = z.object({
  /**
   * 이 배포본의 주소. 카톡에 붙일 공유 링크와 미리보기 이미지 주소를 절대 주소로 만들 때 쓴다.
   *
   * 요청 헤더(Host)에서 뽑지 않는 이유는, 헤더는 보내는 쪽이 정하기 때문이다.
   * 밖으로 나가는 주소만큼은 **우리가 설정한 값**이어야 한다.
   */
  SITE_URL: z
    .url()
    // 뒤에 경로를 이어 붙이므로 끝 슬래시를 떼어 둔다. 안 떼면 `//s/...`.
    .transform((value) => value.replace(/\/+$/, "")),
  /**
   * Vercel Cron 이 보내는 비밀값. Vercel 프로젝트 환경변수에 같은 이름으로 넣으면 Vercel 이
   * Cron 요청에 실어 보낸다. 없어도 된다(그때는 누구나 핑을 보낼 수 있다).
   */
  CRON_SECRET: z.string().default(""),
  /**
   * Supabase 서버 전용 키(service role). 개인 링크(PLAN.md §4)로 들어올 때 로그인 계정을 만들고 세션을 여는 데만 쓴다.
   * 🔴 RLS 를 건너뛰는 키다. `NEXT_PUBLIC_` 을 붙이지 않고, 이 일 말고는 쓰지 않는다.
   * 없어도 된다 — 그때 링크 화면이 무엇이 빠졌는지 보여 준다.
   */
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
});

export type Env = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

/**
 * 빠진 값을 **한 번에 모아서** 알려준다. 하나씩 터지면 고치고 다시 실행하기를
 * 반복하게 된다.
 */
const parseWith = <T>(schema: z.ZodType<T>, source: Record<string, string | undefined>): T => {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const detail = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`환경변수가 올바르지 않습니다 — ${detail}`);
};

export const parseEnv = (source: Record<string, string | undefined>): Env =>
  parseWith(publicSchema, source);

export const parseServerEnv = (source: Record<string, string | undefined>): ServerEnv =>
  parseWith(serverSchema, source);
