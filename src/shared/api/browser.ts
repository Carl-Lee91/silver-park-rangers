"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getEnv } from "@/shared/config";

/**
 * 브라우저에서 쓰는 Supabase 클라이언트. 세션은 서버와 같은 쿠키에서 읽는다.
 *
 * 🔴 실시간 수신에만 쓴다. 읽고 쓰는 일은 서버가 한다.
 * 🔴 `shared/api` 의 기본 진입점(index.ts)은 `next/headers` 를 부르는 서버 전용이라, 브라우저용은
 * 이 진입점으로 따로 연다(CLAUDE.md). 하나만 만들어 쓴다 — 부를 때마다 만들면 연결이 쌓인다.
 */
let client: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseBrowserClient = () => {
  if (client === null) {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getEnv();
    client = createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return client;
};
