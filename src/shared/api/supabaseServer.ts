import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnv } from "@/shared/config";

/**
 * 서버(Server Component · Server Action · Route Handler)에서 쓰는 Supabase 클라이언트.
 * 세션은 쿠키에 있다.
 *
 * 🔴 요청마다 새로 만든다. 하나를 재사용하면 앞 사람의 세션이 뒷사람 응답에 섞인다.
 *
 * 🔴 `next/headers` 를 부르므로 **서버에서만** 불릴 수 있다. 클라이언트 컴포넌트의
 * import 그래프에 이 파일이 끼면 빌드가 깨진다.
 */
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getEnv();

  return createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component 를 그리는 중에는 쿠키를 쓸 수 없다(응답 헤더가
          // 이미 나갔다). 만료 토큰 갱신은 proxy 가 맡는다.
        }
      },
    },
  });
};
