"use server";

import { redirect } from "next/navigation";
import { startOAuthLogin } from "@/shared/api";
import { getServerEnv, ROUTES } from "@/shared/config";

/** 카카오 로그인을 시작한다. 카카오 동의 화면으로 보낸다. */
export async function startKakaoLogin() {
  const { SITE_URL } = getServerEnv();
  const url = await startOAuthLogin("kakao", `${SITE_URL}${ROUTES.authCallback}`);
  redirect(url ?? `${ROUTES.login}?error=start`);
}
